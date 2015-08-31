/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * Main application file
 */
/*jslint node: true*/

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var async = require('async');
var config = require('./config/environment');
var log = require('./config/log');

var app = require('./app');
var db = require('./config/db/store');
var socketUtil = require('./config/socket');

// Setup server
var server = require('http').createServer(app);

var io = require('socket.io').listen(server);
io.sockets.on('connection', function connect (socket) {
  socketUtil.setSocket(socket);
});

// start db then start the server
async.series([
  function startDb (next) {
    db.start(next);
  },
  function startServer (next) {
    server.listen(config.port, config.ip, next);
  }
], function handleStartupSeries (err, results) {
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
