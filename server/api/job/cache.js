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

// external dependencies
var cache = require('memory-cache');
var uuid = require('node-uuid');

var MINUTE = 1000 * 60;
var HOUR = 60 * MINUTE;

var STATUS = {
  RUNNING : 'running',
  COMPLETE : 'complete',
  ERROR : 'error'
};

module.exports.STATUS = STATUS;

function entry (info) {
  var id = uuid.v1();
  var details = info || {};
  if (!details.status) {
    details.status = STATUS.RUNNING;
  }

  put(id, details, 5 * MINUTE);

  return id;
}

module.exports.entry = entry;

function get (id) {
  return cache.get(id);
}

module.exports.get = get;

function put (id, info) {
  var ttl = 5 * MINUTE;
  var details = info || {};
  if ( details.status === STATUS.COMPLETE || details.status === STATUS.ERROR ) {
    ttl = 24 * HOUR;
  }
  cache.put(id, details, ttl);
}

module.exports.put = put;
