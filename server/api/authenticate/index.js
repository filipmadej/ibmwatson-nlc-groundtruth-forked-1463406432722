'use strict';

var express = require('express');
var controller = require('./authenticate.controller');

var router = express.Router();

router.get('/', controller.check);
router.post('/', controller.login);
router.post('/logout', controller.logout);

module.exports = router;
