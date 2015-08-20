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
var controller = require('./classifier.controller');
var bodyParser = require('body-parser');

var rest = require('../../config/rest');

var ENDPOINTS = {
    'classifiers' : '/:tenantid/classifiers',
    'classifier' : '/:tenantid/classifiers/:id',
    'classify' : '/:tenantid/classifiers/:id/classify',
};

var router = express.Router();

router.use(bodyParser.json());

router.post(ENDPOINTS.classifiers, rest.ensureAuthenticated, controller.train);
router.post(ENDPOINTS.classify, rest.ensureAuthenticated, controller.classify);
router.get(ENDPOINTS.classifier, rest.ensureAuthenticated, controller.status);
router.get(ENDPOINTS.classifiers, rest.ensureAuthenticated, controller.list);
router.delete(ENDPOINTS.classifier, rest.ensureAuthenticated, controller.remove);

module.exports = router;
