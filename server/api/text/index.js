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
var async = require('async');
var httpstatus = require('http-status');
var makeArray = require('make-array');

// local dependencies
var controller = require('./text.controller');
var log = require('../../config/log');
var rest = require('../../config/rest');

var router = express.Router();

var ENDPOINTS = {
    texts : '/:tenantid/texts',
    text : '/:tenantid/texts/:textid'
};

router.use(ENDPOINTS.texts, rest.ensureAuthenticated);
router.use(ENDPOINTS.text, rest.ensureAuthenticated);

router.get(ENDPOINTS.texts, controller.getTexts);
router.get(ENDPOINTS.text, controller.getText);
router.post(ENDPOINTS.texts, controller.createText);
router.patch(ENDPOINTS.text, controller.editText);
router.delete(ENDPOINTS.text, controller.deleteText);

module.exports = router;
