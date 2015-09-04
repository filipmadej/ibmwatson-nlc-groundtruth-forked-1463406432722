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
// var JSONStream = require('JSONStream');
// local dependencies
var restutils = require('../../components/restutils');
var db = require('../../config/db/store');
var dberrors = require('../../config/db/errors');
var log = require('../../config/log');
var socketUtil = require('../../config/socket');

var responses = restutils.res;
var requests = restutils.req;

var TEN_MB = 10 * 1000 * 1000;

var FILE_UPLOAD_OPTIONS = {
  limits : {
    // protect against people uploading files that are too large
    fileSize : TEN_MB,
    // support single file uploads only
    files : 1
  },
  rename : function (fieldname, filename) {
    // don't rename files
    return filename;
  }
};

/**
 * Constructor for a new Error object specific to database operations
 *
 * @param {String} category - type of error
 * @param {String} message - description of error
 * @param {Number} code - http status code to associate with error
 * @returns {void} this is a constructor meant to be called via 'new'
 */
function ImportError (category, message, code) {
    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.error = category;
    this.message = message;
    this.statusCode = code;
}
util.inherits(ImportError, Error);

function verifyExtension (extension) {
  if (extension !== 'json' && extension !== 'csv') {
    throw new Error('Only JSON and CSV formats are accepted');
  }
}

// take the raw response from the file upload and process it to create a formatted JSON for the front-end
function processFileContent (tenantid, data, req, res) {
  async.forEachSeries(data, function process (entry, callback) {
    db.processImportEntry(tenantid, entry, function importEntry (err, result) {
      if (err) {
        socketUtil.send('import', { file: req.files.file, err: err });
        callback();
        return dberrors.handle(err, [httpstatus.BAD_REQUEST], 'Error occurred while attempting to import from file.', function returnResponse () {
          return responses.error(res, err);
        });
      }

      log.debug({ result : result }, 'Imported data');

      result.classes.forEach(function forEach (clazz) {
        if (clazz.err) {
          socketUtil.send('class:create', { attributes: clazz, err: clazz.err });
        } else {
          socketUtil.send('class:create', { attributes: clazz });
        }
      });

      if (result.text.created) {
        if (result.text.err) {
          socketUtil.send('text:create', { attributes: result.text, err: result.text.err });
        } else {
          socketUtil.send('text:create', { attributes: result.text });
        }
      } else if (result.text.classes) {
        if (result.text.err) {
          socketUtil.send('text:update:classes:add', { id: result.text.id, classes: result.text.classes, err: result.text.err });
        } else {
          socketUtil.send('text:update:classes:add', { id: result.text.id, classes: result.text.classes });
        }
      }
      callback();
      return responses.ok(res);
    });
  });
}

function handleFileImport (req, res) {
  log.debug({ files : req.files }, 'File import request');

  if (!req.files) {
    return res.status(httpstatus.INTERNAL_SERVER_ERROR)
      .send({ error : 'File upload middleware not initialized' });
  }

  if (!req.files.file) {
    return res.status(httpstatus.BAD_REQUEST)
      .send({ error : 'Expected one file' });
  }

  var tenantid = req.params.tenantid;
  var file = req.files.file;
  var extension = file.extension;

  try {
    verifyExtension(extension);
  } catch (err) {
    return responses.error(res, err);
  }

  fs.readFile(file.path, 'utf8', function read (err, fileContent) {
    if (err) {
      return responses.error(res, err);
    }
    if (extension === 'json') {
      processFileContent(tenantid, JSON.parse(fileContent).training_data, req, res);
    } else if (extension === 'csv') {
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
          return { text: text, classes: classes };
        })
        .on('data', function onData (data) {
          entries.push(data);
        })
        .on('end', function onEnd () {
          return processFileContent(tenantid, entries, req, res);
        });
    }
    return responses.ok(res);
  });

  // var stream = fs.createReadStream(file.path, { encoding: 'utf-8' });
  // var parser;
  // if (extension === 'json') {
  //   parser = JSONStream.parse('training_data.*');
  // } else if (extension === 'csv') {
  //   parser = csv.parse({ headers: false, ignoreEmpty: true })
  //     .transform(function format (data) {
  //       var text = data.shift();
  //       var classes = [];
  //       for (var i = 0, len = data.length; i < len; i++) {
  //         if (data[i] !== '') {
  //           classes.push(data[i]);
  //         }
  //       }
  //       return { text: text, classes: classes };
  //     });
  // }
  // stream.pipe(parser)
  //   .on('data', function parse (data) {
  //     log.debug(data, 'Importing data');
  //     db.processImportEntry(tenantid, data, function importEntry (err, result) {
  //       if (err) {
  //         socketUtil.send('import', { file: file, err: err });
  //         return dberrors.handle(err, [httpstatus.BAD_REQUEST], 'Error occurred while attempting to import from file.', function returnResponse () {
  //           return responses.error(res, err);
  //         });
  //       }
  //
  //       log.debug({ result : result }, 'Imported data');
  //
  //       result.classes.forEach(function forEach (clazz) {
  //         socketUtil.send('class:create', { attributes: clazz });
  //       });
  //       if (result.text.created) {
  //         socketUtil.send('text:create', { attributes: result.text });
  //       } else if (result.text.classes) {
  //         socketUtil.send('text:update:classes:add', { attributes: result.text });
  //       }
  //       responses.ok(res);
  //     });
  //   })
  //   .on('end', function done (data) {
  //     log.debug(data, 'end import');
  //     socketUtil.send('import:complete', data);
  //     responses.ok(res);
  //   });
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
          db.getClasses(tenantid, { limit: limit }, next);
        }
      ], callback);
    },
    function getTexts (callback) {
      async.waterfall([
        function getTextsCount (next) {
          db.countTexts(tenantid, next);
        },
        function getTextObjects (limit, next) {
          db.getTexts(tenantid, { limit: limit }, next);
        }
      ], callback);
    }
  ], function returnData (err, results) {
    if (err) {
      return responses.error(res, err);
    }
    var classes = results[0];
    var texts = results[1];

    return res.status(httpstatus.OK).json({ classes: classes, texts: texts });
  });
}

module.exports = {
  uploadOptions : FILE_UPLOAD_OPTIONS,
  handleFileImport : handleFileImport,
  handleFileDownload : handleFileDownload
};
