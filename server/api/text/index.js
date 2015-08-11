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
