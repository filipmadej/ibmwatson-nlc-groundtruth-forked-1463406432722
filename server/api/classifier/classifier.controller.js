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

var watson = require('watson-developer-cloud');
var async = require('async');
var env = require('../../config/environment');

function getCredentials (req) {
  var credentials = {}

  if(!req.user){
    throw new Error('User is not authenticated');
  }

  credentials.url = env.endpoints.classifier;
  credentials.username = req.user.username;
  credentials.password = req.user.password;
  credentials.version = 'v1';
  return credentials;
}

// Trains a new NL Classifier
exports.train = function train (req, res) {
  var credentials = getCredentials(req),
    nlClassifier = watson.natural_language_classifier(credentials);

  nlClassifier.create(req.body, function create (err, result) {
    if (err) {
      res.status(err.code).send(err);
    } else {
      res.send(result);
    }
  });
};

// Call the pre-trained classifier with body.text
// Responses are json
exports.classify = function classify (req, res) {

  var credentials = getCredentials(req),
    nlClassifier = watson.natural_language_classifier(credentials);

  var params = {
    classifier : req.params.id, // pre-trained classifier
    text : req.body.text
  };

  nlClassifier.classify(params, function handleResult (err, results) {
    if (err) {
      res.status(err.code).send(err);
    } else {
      res.send(results);
    }
  });
};

// Checks the status of the current classifier
exports.status = function status (req, res) {

  var credentials = getCredentials(req),
    nlClassifier = watson.natural_language_classifier(credentials);

  var params = {
    classifier : req.params.id
  };

  nlClassifier.status(params, function handleResult (err, results) {
    if (err) {
      res.status(err.code).send(err);
    } else {
      res.send(results);
    }
  });
};

// Lists the current classifiers that are a part of the service
exports.list = function list (req, res) {

  var credentials = getCredentials(req),
    nlClassifier = watson.natural_language_classifier(credentials);

  console.log('CREDENTIALS',credentials);

  nlClassifier.list(null, function handleResult (err, results) {
    if (err) {
      res.status(err.code).send(err);
    } else {
      res.send(results);
    }
  })
};

// Removes an existing classifier
exports.remove = function remove (req, res) {

  var credentials = getCredentials(req),
    nlClassifier = watson.natural_language_classifier(credentials);

  var params = {
    classifier : req.params.id
  }
  nlClassifier.remove(params, function handleResult (err, results) {
    if (err) {
      res.status(err.code).send(err);
    } else {
      res.send(results);
    }
  });
};
