
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
var uuid = require('node-uuid');
// local dependencies
var cache = require('../job/cache');
var restutils = require('../../components/restutils');
var db = require('../../config/db/store');
var dberrors = require('../../config/db/errors');
var log = require('../../config/log');
var io = require('../../config/socket');

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
  rename : function mirror (fieldname, filename) {
    // don't rename files
    return filename;
  }
};

// take the raw response from the file upload and process it to create a formatted JSON for the front-end
function processFileContent (tenantid, data, file, jobid, done) {
  var details = {
      status : cache.STATUS.RUNNING,
      success : 0,
      error : 0
  };

  cache.put(jobid, details);

  async.forEachSeries(data, function process (entry, callback) {
    db.processImportEntry(tenantid, entry, function importEntry (err, result) {
      var hasError = false;
      if (err || result.error) {
        details.error++;
        io.to(tenantid).emit('import', { file : file, err : err || result.error });
        return callback();
      }

      log.debug({ result : result }, 'Imported data');

      result.classes.forEach(function forEach (clazz) {
        if (clazz.error) {
          hasError = true;
          io.to(tenantid).emit('class:create', { attributes : clazz, err : clazz.error });
        } else {
          io.to(tenantid).emit('class:create', { attributes : clazz });
        }
      });

      if (result.text.created) {
        if (result.text.error) {
          hasError = true;
          io.to(tenantid).emit('text:create', { attributes : result.text, err : result.text.error });
        } else {
          io.to(tenantid).emit('text:create', { attributes : result.text });
        }
      } else if (result.text.classes && result.text.classes.length) {
        var addClassError;
        result.text.classes.some(function errorCheck (clazz) {
          addClassError = clazz.error;
          return clazz.error;
        });
        if (addClassError) {
          hasError = true;
          io.to(tenantid).emit('text:update:classes:add', { id : result.text.id, classes : result.text.classes, err : addClassError });
        } else {
          io.to(tenantid).emit('text:update:classes:add', { id : result.text.id, classes : result.text.classes });
        }
      }

      if (hasError) {
        details.error++;
      } else {
        details.success++;
      }

      cache.put(jobid, details);

      callback();
    });
  }, function onEnd (err) {
    done(err, details);
  });
}

var q = async.queue(function add (task, callback) {
  importFile(task.tenantid, task.file, task.jobid, callback);
});

function importFile (tenantid, file, jobid, callback) {

  fs.readFile(file.path, 'utf8', function read (err, fileContent) {
    if (err) {
      return callback(err);
    }

    if (file.extension === 'json') {
      processFileContent(tenantid, JSON.parse(fileContent).training_data, file, jobid, callback);
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
          processFileContent(tenantid, entries, file, jobid, callback);
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

  var jobid = cache.entry();

  q.push({tenantid : tenantid, file : file, jobid : jobid}, function handleError (err, info) {
    info = info || {};
    if (err) {
      info.status = cache.STATUS.ERROR;
    } else {
      info.status = cache.STATUS.COMPLETE;
    }

    cache.put(jobid, info);
  });

  responses.accepted(
    req.baseUrl + '/:tenantid/jobs/:jobid',
    {
      ':tenantid' : tenantid,
      ':jobid' : jobid
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

module.exports = {
  uploadOptions : FILE_UPLOAD_OPTIONS,
  handleFileImport : handleFileImport,
  handleFileDownload : handleFileDownload
};
