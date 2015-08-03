'use strict';

var express = require('express');
var controller = require('./classifier.controller');
var bodyParser = require('body-parser');

var router = express.Router();

router.use(bodyParser.json());

router.post('/train', controller.train);
router.post('/:id/classify', controller.classify);
router.get('/:id/status', controller.status);
router.get('/list', controller.list);
router.delete('/:id', controller.remove);

module.exports = router;
