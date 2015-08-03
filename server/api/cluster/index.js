'use strict';

var express = require('express');
var controller = require('./cluster.controller');

var router = express.Router();

router.get('/', controller.cluster);

module.exports = router;
