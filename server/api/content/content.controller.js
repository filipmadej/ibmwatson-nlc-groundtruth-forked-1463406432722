'use strict';
/* eslint no-underscore-dangle:0, max-statements:[1, 16] */

// core dependencies
var path = require('path');
var fs = require('fs');
var util = require('util');
var http = require('http');
// external dependencies
var httpstatus = require('http-status');
var csv = require('fast-csv');
// local dependencies
var restutils = require('../../components/restutils');
var db = require('../../config/db/store');
var dberrors = require('../../config/db/errors');
var log = require('../../config/log');

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

var socket;

function getSocket(socket_io) {
  socket = socket_io;
}

function verifyExtension (filepath) {
  var extension = path.extname(filepath);
  if (extension !== '.json' || extension !== '.csv') {
    throw new Error('Zip files are not supported');
  }
}

function processClasses (processedContent, classes) {
  classes.forEach(function forEach (clazz) {
    if (processedContent.classes.indexOf(clazz) < 0) {
      processedContent.classes.push(clazz);
    }
  });
}

function updateText (text, classes) {
  classes.forEach(function forEach (clazz) {
    if (text.classes.indexOf(clazz) < 0) {
      text.classes.push(clazz);
    }
  });
}

function processText (processedContent, text, classes) {
  if (!text || text.length === 0) {
    return;
  }
  for (var i = 0; i < processedContent.text.length; i++) {
    if (processedContent.text[i].text === text) {
      updateText(processedContent.text[i], classes);
      return;
    }
  }
  processedContent.text.push({ text: text, classes: classes });
}

// take the raw response from the file upload and process it to create a formatted JSON for the front-end
function processUploadResponse (data) {
  var processedContent = {
    classes : [],
    text : []
  };
  data.forEach(function forEach (d) {
    processText(processedContent, d.text, d.classes);
    processClasses(processedContent, d.classes);
  });
  return processedContent;
}

function handleFileUpload (req, res) {
  log.debug({ files : req.files }, 'File upload request');

  if (!req.files) {
    return res.status(httpstatus.INTERNAL_SERVER_ERROR)
      .send({ error : 'File upload middleware not initialized' });
  }

  if (!req.files.file) {
    return res.status(httpstatus.BAD_REQUEST)
      .send({ error : 'Expected one file' });
  }

  var tenantid = req.params.tenantid;
  var uploadedfile = req.files.file.path;

  try {
    verifyExtension(uploadedfile);
  } catch (err) {
    return responses.error(res, err);
  }

  fs.readFile(req.files.file, 'utf8', function importFile (err, data) {
    if (err) {
      return responses.error(res, err);
    }
    log.debug(data, 'got a file!');

    var trainingData = [];
    if (!data || data.length === 0) {
      return responses.error(res, new ImportError('Empty document', 'File must exist and be nonempty.', '400'));
    } else if (data[0] === '{') {
      trainingData = JSON.parse(data).training_data;
    } else {
      csv.fromString(data, {headers : false, ignoreEmpty : true})
        .transform(function format (data) {
          var text = data.shift();
          var classes = [];
          for (var i = 0, len = data.length; i < len; i++) {
            if (data[i] !== '') {
              classes.push(data[i]);
            }
          }
          return {text : text, classes : classes};
        })
        .on('data', function onData (data) {
          trainingData.push(data);
        })
        .on('end', function onEnd () {
          return trainingData;
        });
    }
    var processedContent = processUploadResponse(trainingData);
    log.debug(processedContent, 'processed content');
    // TODO: save to db and send responses back
  });

}

function handleFileDownload (req, res) {
  // Get data from db, format into CSV, send file back
}



module.exports = {
  uploadoptions : FILE_UPLOAD_OPTIONS,
  handleFileUpload : handleFileUpload,
  handleFileDownload : handleFileDownload,
  getSocket: getSocket
};
