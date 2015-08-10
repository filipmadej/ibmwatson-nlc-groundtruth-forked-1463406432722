/**
 * Main application file
 */
/*jslint node: true*/

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var cfenv = require('cfenv');
var async = require('async');
var config = require('./config/environment');
var log = require('./config/log');
// Setup server
var appEnv = cfenv.getAppEnv();
var app = express();
var server = require('http').createServer(app);
var db = require('./config/db/store');
require('./config/express')(app);
require('./config/passport')(app);
require('./config/csrf')(app);
require('./routes')(app);

// start db then start the server
async.series([
  function startDb (next) {
    db.start(next);
  },
  function startServer (next) {
    server.listen(config.port, config.ip, next);
  }
], function handleStarupSeries (err, results) {
  if (err) {
    var message = 'Error during startup';
    log.error({err : err}, message);
    throw new Error(message);
  } else {
    log.info('Express server listening on %d, in %s mode', config.port, app.get('env'));
  }
});

// Expose app
exports = module.exports = app;
