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

var express = require('express');
var multer = require('multer');

// local dependencies
var controller = require('./content.controller');
var rest = require('../../config/rest');

var router = express.Router();

var ENDPOINTS = {
    content : '/:tenantid/content',
};

var uploading = multer({
  limits : {
    // protect against people uploading files that are too large
    fileSize : 10000000,
    // support single file uploads only
    files : 1
  },
  rename : function (fieldname, filename) {
    // don't rename files
    return filename;
  }
});

router.use(ENDPOINTS.content, rest.ensureAuthenticated);
router.post(ENDPOINTS.content, controller.handleFileUpload); // TODO: integrate multer into this endpoint
router.get(ENDPOINTS.content, controller.handleFileDownload);

module.exports = router;
