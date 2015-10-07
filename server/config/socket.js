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

'use strict';

var io = require('socket.io')();

// local dependencies
var log = require('./log');

var EVENTS = {
  connection: 'connection',
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe'
};

io.on(EVENTS.connection, function onConnection(socket) {

  // When a client subscribes to a tenant, add them to that tenants room  
  socket.on(EVENTS.subscribe, function (tenant) {
    log.debug({tenant:tenant}, 'onSubscribe');
    socket.join(tenant);
  });

  // When a client unsubscribes from a tenant, remove them from the room
  socket.on(EVENTS.unsubscribe, function (tenant) {
      log.debug({tenant:tenant}, 'onUnsubscribe');
      socket.leave(tenant);
    });

});

exports = module.exports = io;