
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

// core dependencies
var fs = require('fs');
var util = require('util');
var http = require('http');
// external dependencies
var async = require('async');
var httpstatus = require('http-status');
var csv = require('fast-csv');
var cache = require('memory-cache');
var uuid = require('node-uuid');
// local dependencies
var restutils = require('../../components/restutils');
var db = require('../../config/db/store');
var dberrors = require('../../config/db/errors');
var log = require('../../config/log');
var socketUtil = require('../../config/socket');

var responses = restutils.res;
var requests = restutils.req;

var TEN_MB = 10 * 1000 * 1000;

var MINUTE = 1000 * 60;
var HOUR = 60 * MINUTE;

var STATUS = {
  RUNNING : 'running',
  COMPLETE : 'complete',
  ERROR : 'error'
};

var FILE_UPLOAD_OPTIONS = {
  limits : {
    // protect against people uploading files that are too large
    fileSize : TEN_MB,
    // support single file uploads only
    files : 1
  },
  rename : function mirror (fieldname, filename) {
    // don't rename files
    return filename;
  }
};

// take the raw response from the file upload and process it to create a formatted JSON for the front-end
function processFileContent (tenantid, data, file, statusId, done) {
  var details = {
      status : STATUS.RUNNING,
      success : 0,
      error : 0
  };

  cache.put(statusId, details, 5 * MINUTE);

  async.forEachSeries(data, function process (entry, callback) {
    db.processImportEntry(tenantid, entry, function importEntry (err, result) {
      var hasError = false;
      if (err || result.error) {
        details.error++;
        socketUtil.send('import', { file : file, err : err || result.error });
        return callback();
      }

      log.debug({ result : result }, 'Imported data');

      result.classes.forEach(function forEach (clazz) {
        if (clazz.error) {
          hasError = true;
          socketUtil.send('class:create', { attributes : clazz, err : clazz.error });
        } else {
          socketUtil.send('class:create', { attributes : clazz });
        }
      });

      if (result.text.created) {
        if (result.text.error) {
          hasError = true;
          socketUtil.send('text:create', { attributes : result.text, err : result.text.error });
        } else {
          socketUtil.send('text:create', { attributes : result.text });
        }
      } else if (result.text.classes) {
        var addClassError;
        result.text.classes.some(function errorCheck (clazz) {
          addClassError = clazz.error;
          return clazz.error;
        });
        if (addClassError) {
          hasError = true;
          socketUtil.send('text:update:classes:add', { id : result.text.id, classes : result.text.classes, err : addClassError });
        } else {
          socketUtil.send('text:update:classes:add', { id : result.text.id, classes : result.text.classes });
        }
      }

      if (hasError) {
        details.error++;
      } else {
        details.success++;
      }

      cache.put(statusId, details, 5 * MINUTE);

      callback();
    });
  }, function onEnd (err) {
    done(err, details);
  });
}

var q = async.queue(function add (task, callback) {
  importFile(task.tenantid, task.file, task.importid, callback);
});

function importFile (tenantid, file, importid, callback) {

  fs.readFile(file.path, 'utf8', function read (err, fileContent) {
    if (err) {
      return callback(err);
    }

    if (file.extension === 'json') {
      processFileContent(tenantid, JSON.parse(fileContent).training_data, file, importid, callback);
    } else {
      var entries = [];
      csv.fromString(fileContent, {headers : false, ignoreEmpty : true})
        .transform(function format (data) {
          var text = data.shift();
          var classes = [];
          data.forEach(function forEach (element) {
            if (element !== '') {
              classes.push(element);
            }
          })
          return { text : text, classes : classes };
        })
        .on('data', function onData (data) {
          entries.push(data);
        })
        .on('end', function onEnd () {
          processFileContent(tenantid, entries, file, importid, callback);
        });
    }

  });
}

function handleFileImport (req, res) {
  log.debug({ files : req.files }, 'File import request');

  if (!req.files) {
    return res.status(httpstatus.INTERNAL_SERVER_ERROR)
      .json({ error : 'File upload middleware not initialized' });
  }

  if (!req.files.file) {
    return res.status(httpstatus.BAD_REQUEST)
      .json({ error : 'Expected one file' });
  }

  var tenantid = req.params.tenantid;
  var file = req.files.file;
  var extension = file.extension;


  if (extension !== 'json' && extension !== 'csv') {
    return responses.badrequest('Only JSON and CSV formats are accepted', res);
  }

  var importid = uuid.v1();

  cache.put(importid, {status : STATUS.RUNNING}, 5 * MINUTE);

  q.push({tenantid : tenantid, file : file, importid : importid}, function handleError (err, info) {
    info = info || {};
    if (err) {
      info.status = STATUS.ERROR;
    } else {
      info.status = STATUS.COMPLETE;
    }

    cache.put(importid, info, 24 * HOUR);
  });

  responses.accepted(
    req.baseUrl + req.route.path + '/import/:importid',
    {
      ':tenantid' : tenantid,
      ':importid' : importid
    },
    res);

}

// Retrieves texts and classes from the database and returns them
function handleFileDownload (req, res) {
  var tenantid = req.params.tenantid;
  async.parallel([
    function getClasses (callback) {
      async.waterfall([
        function getClassesCount (next) {
          db.countClasses(tenantid, next);
        },
        function getClassObjects (limit, next) {
          log.debug(limit, 'classLimit');
          db.getClasses(tenantid, { limit : limit }, next);
        }
      ], callback);
    },
    function getTexts (callback) {
      async.waterfall([
        function getTextsCount (next) {
          db.countTexts(tenantid, next);
        },
        function getTextObjects (limit, next) {
          db.getTexts(tenantid, { limit : limit }, next);
        }
      ], callback);
    }
  ], function returnData (err, results) {
    if (err) {
      return responses.error(res, err);
    }
    var classes = results[0];
    var texts = results[1];

    return res.status(httpstatus.OK).json({ classes : classes, texts : texts });
  });
}

function importStatus (req, res) {

  var tenantid = req.params.tenantid;
  var importid = req.params.importid;

  var details = cache.get(importid);
  if (details) {
    return res.status(httpstatus.OK)
      .json(details);
  }

  return responses.notfound(res);
}

module.exports = {
  uploadOptions : FILE_UPLOAD_OPTIONS,
  handleFileImport : handleFileImport,
  handleFileDownload : handleFileDownload,
  importStatus : importStatus
};
