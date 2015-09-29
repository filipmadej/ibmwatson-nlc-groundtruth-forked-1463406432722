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
var bodyParser = require('body-parser');

var controller = require('./classifier.controller');
var rest = require('../../config/rest');

var ENDPOINTS = {
    'classifiers' : '/:tenantid/classifiers',
    'classifier' : '/:tenantid/classifiers/:id',
    'classify' : '/:tenantid/classifiers/:id/classify',
};

var router = express.Router();

router.use(ENDPOINTS.classifiers, rest.ensureAuthenticated);
router.use(ENDPOINTS.classifier, rest.ensureAuthenticated);
router.use(ENDPOINTS.classify, rest.ensureAuthenticated);

router.post(ENDPOINTS.classifiers, controller.train);
router.post(ENDPOINTS.classify, controller.classify);
router.get(ENDPOINTS.classifier, controller.status);
router.get(ENDPOINTS.classifiers, controller.list);
router.delete(ENDPOINTS.classifier, controller.remove);

module.exports = router;
