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
var log = require('./log');

var appenv = cfenv.getAppEnv({vcap : env.vcap});

var service = appenv.getService(env.classifierServiceName);

// if the named service doesn't exist, have it grab the default bound service
if (!service) {
  if (process.env.VCAP_SERVICES) {
    try {
      var services = JSON.parse(process.env.VCAP_SERVICES);
      if (services.natural_language_classifier instanceof Array &&
        services.natural_language_classifier.length > 0 &&
        services.natural_language_classifier[0].name) {
        var serviceName = services.natural_language_classifier[0].name;
        log.info("natural_language_classifier service with name \"" + env.classifierServiceName + "\" does not exist");
        log.info("using first bound instance with name \"" + serviceName + "\" instead");
        service = appenv.getService(serviceName);
      } else {
        log.error("unable to find any bound instances of natural_language_classifier - this app will crash");
      }
    } catch (e) {
      log.error("error finding natural_language_classifier service instance: ", e);
    }
  } else {
    log.error("environment variable VCAP_SERVICES is not set - this app will crash");
  }
}

var classifier = {};

if (service) {
  classifier.id = service.name;
  classifier.url = service.credentials.url;
  classifier.username = service.credentials.username;
  classifier.password = service.credentials.password;
  classifier.version = service.credentials.version || 'v1';
}

module.exports = classifier;
