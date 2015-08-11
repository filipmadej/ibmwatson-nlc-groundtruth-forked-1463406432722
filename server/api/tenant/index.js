'use strict';

var express = require('express');

// local dependencies
var controller = require('./tenant.controller');
var rest = require('../../config/rest');

var router = express.Router();

var ENDPOINTS = {
    tenant : '/:tenantid'
};

router.use(ENDPOINTS.tenant, rest.ensureAuthenticated);

router.delete(ENDPOINTS.tenant, controller.deleteTenant);

module.exports = router;
