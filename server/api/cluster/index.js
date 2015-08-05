'use strict';

var express = require('express');
var controller = require('./cluster.controller');
var rest = require('../../config/rest');

var router = express.Router();

router.get('/', rest.ensureAuthenticated, controller.cluster);

module.exports = router;
