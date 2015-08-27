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

var log = require('./log');
var socket;

// export function for listening to the socket
module.exports.init = function init (socketConnection) {
  socket = socketConnection;

  // send the new user their name and a list of users
  log.debug('client connected...');
  socket.emit('init', {
    data: 'initialized'
  });

  // broadcast a user's message to other users
  socket.on('delete:class', function (data) {
    log.debug({id : data.id}, 'deleting class');
    socket.broadcast.emit('delete:class', {
      id: data.id
    });
  });

  // broadcast a user's message to other users
  socket.on('delete:text', function (data) {
    log.debug({id : data.id}, 'deleting text');
    socket.broadcast.emit('delete:text', {
      id: data.id
    });
  });

  // validate a user's name change, and broadcast it on success
  socket.on('change:name', function (data, fn) {
      socket.broadcast.emit('change:name', {
        // oldName: oldName,
        // newName: name
      });
      fn(true);
  });

  // clean up when a user leaves, and broadcast it to other users
  socket.on('disconnect', function () {

  });
};

module.exports.createClass = function createClass (data) {

};

module.exports.deleteClass = function deleteClass (data) {
  log.debug({id : data.id}, 'deleting class');
  socket.broadcast.emit('delete:class', data);
};

module.exports.deleteClass = function deleteClass (data) {
  log.debug({id : data.id}, 'deleting class');
  socket.broadcast.emit('delete:class', data);
};
