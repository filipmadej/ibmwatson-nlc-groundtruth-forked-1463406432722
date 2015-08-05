'use strict';

var env = require('./environment');
var cfenv = require('cfenv');

var appenv = cfenv.getAppEnv({vcap:env.vcap});

var service = appenv.getService(env.classifierServiceName);

var classifier = {}

if (service) {
  classifier.id = service.name;
  classifier.url = service.credentials.url;
  classifier.username = service.credentials.username;
  classifier.password = service.credentials.password;
  classifier.version = 'v1';
}

module.exports = classifier;
