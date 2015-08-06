'use strict';

var watson = require('watson-developer-cloud');
var async = require('async');
var credentials = require('../../config/nlc');

// Create the service wrapper
var nlClassifier = watson.natural_language_classifier(credentials);

// Trains a new NL Classifier
exports.train = function train (req, res) {
  async.waterfall([
    function create (next) {
      nlClassifier.create(req.body, function create (err, result) {
        if (err) {
          next(err, null);
        } else {
          //classifierId = result.classifier_id;
          next(null, result);
        }
      });
    }
  ], function (err, result) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(result);
    }
  });
};

// Call the pre-trained classifier with body.text
// Responses are json
exports.classify = function classify (req, res) {
  var params = {
    classifier : req.params.id, // pre-trained classifier
    text : req.body.text
  };

  nlClassifier.classify(params, function (err, results) {
    if (err) {
      res.status(err.code).send(err);
    } else {
      res.send(results);
    }
  });
};

// Checks the status of the current classifier
exports.status = function status (req, res) {
  var params = {
    classifier : req.params.id
  };

  nlClassifier.status(params, function (err, results) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(results);
    }
  });
};

// Lists the current classifiers that are a part of the service
exports.list = function list (req, res) {
  nlClassifier.list(null, function (err, results) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(results);
    }
  })
};

// Removes an existing classifier
exports.remove = function remove (req, res) {
  var params = {
    classifier : req.params.id
  }
  nlClassifier.remove(params, function (err, results) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send(results);
    }
  });
};
