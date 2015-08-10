'use strict';

var express = require('express');

// local dependencies
var controller = require('./class.controller.js');
var rest = require('../../config/rest');

var router = express.Router();

var ENDPOINTS = {
    'classes' : '/:tenantid/classes',
    'class' : '/:tenantid/classes/:classid'
};

router.use(ENDPOINTS.classes, rest.ensureAuthenticated);

router.use(ENDPOINTS.class, rest.ensureAuthenticated);

router.get(ENDPOINTS.classes, controller.getClasses);
router.get(ENDPOINTS.class, controller.getClass);
router.post(ENDPOINTS.classes, controller.createClass);
router.put(ENDPOINTS.class, controller.replaceClass);
router.delete(ENDPOINTS.class, controller.deleteClass);

module.exports = router;
