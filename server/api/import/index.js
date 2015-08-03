'use strict';

var express = require('express');
var controller = require('./import.controller');
var bodyParser = require('body-parser');
var rest = require('../../config/rest');

var router = express.Router();

router.use(bodyParser.text({ limit : '10mb' }));

router.post('/csv', rest.ensureAuthenticated ,controller.importCsv);

module.exports = router;
