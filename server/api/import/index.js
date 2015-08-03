'use strict';

var express = require('express');
var controller = require('./import.controller');
var bodyParser = require('body-parser');

var router = express.Router();

router.use(bodyParser.text({ limit : '10mb' }));

router.post('/csv', controller.importCsv);

module.exports = router;
