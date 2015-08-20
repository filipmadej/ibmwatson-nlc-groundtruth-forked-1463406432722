/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

var async = require('async');
var httpstatus = require('http-status');
var makeArray = require('make-array');

// local dependencies
var restutils = require('../../components/restutils');
var db = require('../../config/db/store');
var dberrors = require('../../config/db/errors');
var log = require('../../config/log');

var responses = restutils.res;
var requests = restutils.req;


function sanitizeMetadata (value) {
  if (value && (value.value || value.metadata) ) {
    var patch = {
      value : value.value,
      metadata : value.metadata
    };
    return patch;
  }
  return null;
}

function getClassesToPatch (values) {
  return values.map(function getIds (cls) {
    if (cls && (typeof cls.id === 'string' || cls.id instanceof String)) {
      return cls.id;
    }
  }).filter(function makeDense (mapped) {
    if (mapped) {
      return true;
    }
  });
}

function patchTextClasses (tenantid, textid, patchoperation, callback) {
  switch (patchoperation.op) {
    case 'add':
      log.debug({
        operation : patchoperation,
        text : textid
      }, 'Adding classes to text');
      var tenantsToAdd = getClassesToPatch(patchoperation.value);
      if (tenantsToAdd.length !== patchoperation.value.length) {
        return callback(dberrors.invalid('Invalid value array'));
      }

      db.addClassesToText(tenantid, textid, tenantsToAdd, callback);
      break;
    case 'remove':
      log.debug({
        operation : patchoperation,
        text : textid
      }, 'Removing classes from text');
      var tenantsToRemove = getClassesToPatch(patchoperation.value);
      if (tenantsToRemove.length !== patchoperation.value.length) {
        return callback(dberrors.invalid('Invalid value array'));
      }

      db.removeClassesFromText(tenantid, textid, tenantsToRemove, callback);
      break;
    default:
      log.debug({
        operation : patchoperation
      }, 'Unsupported operation');
      return callback(dberrors.invalid('Unsupported operation'));
  }
}

function patchTextMetadata (tenantid, textid, patchoperation, callback) {
  switch (patchoperation.op) {
    case 'replace':
      log.debug({
        operation : patchoperation,
        text : textid
      }, 'Updating metadata on text');
      var metadata = sanitizeMetadata(patchoperation.value);
      if (!metadata) {
        return callback(dberrors.invalid('Invalid value'));
      }
      db.updateTextMetadata(tenantid, textid, metadata, callback);
      break;
    default:
      log.debug({
        operation : patchoperation
      }, 'Unsupported operation');
      return callback(dberrors.invalid('Unsupported operation'));
  }
}

module.exports.getTexts = function getTexts (req, res) {
  log.debug({
    params : req.params,
    query : req.query
  }, 'Getting texts');

  var tenantid = req.params.tenantid;
  var options = requests.listoptions(req);

  async.parallel([
    function getBatch (next) {
      db.getTexts(tenantid, options, next);
    },
    function getCount (next) {
      db.countTexts(tenantid, next);
    }
  ], function returnTexts (err, textresults) {
    if (err) {
      return responses.error(res, err);
    }
    var texts = textresults[0];
    var count = textresults[1];

    log.debug({
      tenant : tenantid,
      num : count
    }, 'Got texts');

    responses.batch(texts, options.skip, count, res);
  });
};

module.exports.getText = function getText (req, res) {
  log.debug({params : req.params}, 'Getting text');

  var tenantid = req.params.tenantid;
  var textid = req.params.textid;

  db.getText(tenantid, textid, function returnClass (err, text) {
    if (err) {
      return dberrors.handle(err, [httpstatus.NOT_FOUND], 'Error occurred while attempting to retrieve class.', function returnResponse () {
        return responses.error(res, err);
      });
    }
    responses.item(text, res);
  });
};

module.exports.createText = function createText (req, res) {
  log.debug({
    body : req.body,
    params : req.params
  }, 'Creating text');

  var tenantid = req.params.tenantid;
  var textattrs = req.body;

  if (!textattrs || !Object.keys(textattrs).length) {
    return responses.badrequest('Missing request body', res);
  }

  db.createText(tenantid, textattrs, function returnNewTest (err, text) {
    if (err) {
      return dberrors.handle(err, [httpstatus.BAD_REQUEST], 'Error occurred while attempting to create text.', function returnResponse () {
        return responses.error(res, err);
      });
    }

    log.debug({
      text : text
    }, 'Created text');

    responses.newitem(
      text,
      req.baseUrl + req.route.path, {
        ':tenantid' : tenantid,
        ':textid' : text._id
      },
      res);
  });
};

module.exports.editText = function editText (req, res) {
  log.debug({
    body : req.body,
    params : req.params
  }, 'Patching text');

  var tenantid = req.params.tenantid;
  var textid = req.params.textid;

  var patchoperations = requests.verifyObjectsList(makeArray(req.body));

  async.eachSeries(patchoperations, function applyPatch (patchoperation, nextop) {
    if (patchoperation.path === '/classes') {
      return patchTextClasses(tenantid, textid, patchoperation, nextop);
    } else if (patchoperation.path === '/metadata') {
      return patchTextMetadata(tenantid, textid, patchoperation, nextop);
    } else {
      log.debug({operation : patchoperation}, 'Unsupported operation');
      return nextop(dberrors.invalid('Unsupported operation'));
    }
  }, function handlePatchResponse (err) {
    if (err) {
      return responses.error(res, err);
    }
    responses.edited(res);
  });
};


module.exports.deleteText = function deleteText (req, res) {
  log.debug({params : req.params}, 'Deleting text');

  var tenantid = req.params.tenantid;
  var textid = req.params.textid;
  var etag = req.headers['if-match'];

  if (!etag) {
    return responses.missingEtag(res);
  }

  db.deleteText(tenantid, textid, etag, function deletedText (err) {
    if (err) {
      return dberrors.handle(err, [httpstatus.NOT_FOUND], 'Error occurred while attempting to delete text.', function returnResponse () {
        return responses.error(res, err);
      });
    }

    log.debug({text : textid}, 'Deleted text');

    responses.del(res);
  });
};
