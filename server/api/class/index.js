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

// local dependencies
var controller = require('./class.controller.js');
var rest = require('../../config/rest');

var router = express.Router();

var ENDPOINTS = {
    classes : '/:tenantid/classes',
    class : '/:tenantid/classes/:classid'
};

router.use(ENDPOINTS.classes, rest.ensureAuthenticated);

router.use(ENDPOINTS.class, rest.ensureAuthenticated);

router.get(ENDPOINTS.classes, controller.getClasses);
router.get(ENDPOINTS.class, controller.getClass);
router.post(ENDPOINTS.classes, controller.createClass);
router.put(ENDPOINTS.class, controller.replaceClass);
router.delete(ENDPOINTS.class, controller.deleteClass);
router.delete(ENDPOINTS.classes, controller.deleteClasses);

module.exports = router;
