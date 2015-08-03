'use strict';

var express = require('express');
var controller = require('./classifier.controller');
var bodyParser = require('body-parser');

var rest = require('../../config/rest');

var ENDPOINTS = {
    'train': '/train',
    'list': '/list',
    'classify': '/:id/classify',
    'status': '/:id/status',
    'classifier': '/:id'
};

var router = express.Router();

router.use(bodyParser.json());

router.post(ENDPOINTS.train, rest.ensureAuthenticated, controller.train);
router.post(ENDPOINTS.classify, rest.ensureAuthenticated, controller.classify);
router.get(ENDPOINTS.status, rest.ensureAuthenticated, controller.status);
router.get(ENDPOINTS.list, rest.ensureAuthenticated, controller.list);
router.delete(ENDPOINTS.classifier, rest.ensureAuthenticated, controller.remove);

module.exports = router;
