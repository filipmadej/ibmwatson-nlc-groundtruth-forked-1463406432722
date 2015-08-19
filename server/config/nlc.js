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

var env = require('./environment');
var cfenv = require('cfenv');

var appenv = cfenv.getAppEnv();

var service = appenv.getService(env.classifierServiceName);

var classifier = {}

if (service) {
  classifier.id = service.name;
  classifier.url = service.credentials.url;
  classifier.username = service.credentials.username;
  classifier.password = service.credentials.password;
  classifier.version = service.credentials.version || 'v1';
}

module.exports = classifier;
