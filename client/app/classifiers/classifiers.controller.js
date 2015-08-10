'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('ClassifiersCtrl', ['$scope', 'nlc',
    function init ($scope, nlc) {
      $scope.classifiers = [];

      $scope.toggleArrowDown = function toggleArrowDown (classifier) {
        classifier.showArrowDown = !classifier.showArrowDown;
      };

      $scope.loadClassifiers = function loadClassifiers () {
        nlc.getClassifiers().then(function getClassifiers (data) {
          $scope.classifiers = data.classifiers;
          $scope.classifiers.forEach(function forEach (classifier) {
            // add additional data required for UI interactions
            $scope.checkStatus(classifier); // get an initial status check
            //$scope.pollStatus(d, 5000); // set up the poll to update the status every 5 seconds
            classifier.logs = []; // store the texts and consequent classes
            classifier.status = ''; // what is the availibility status of the classifier
            classifier.textToClassify = ''; // store the ng-model variable for a given classifier
            classifier.showArrowDown = false; // show logs for a given classifier
          });
        });
      };

      $scope.loadClassifiers();

      $scope.checkStatus = function checkStatus (classifier) {
        /*jshint camelcase: false */
        nlc.checkStatus(classifier.classifier_id).then(function setStatus (data) {
          classifier.status = data.status;
        });
      };

      $scope.pollStatus = function pollStatus (classifier, interval) {
        /*jshint camelcase: false */
        return nlc.pollStatus(classifier.classifier_id, function setStatus (data) {
          classifier.status = data.status;
        }, interval);
      };

      $scope.deleteClassifier = function deleteClassifier (id) {
        nlc.remove(id).then(function reload () {
          $scope.loadClassifiers();
        });
      };

      $scope.classify = function classify (classifier, text) {
        /*jshint camelcase: false */
        classifier.textToClassify = '';
        classifier.logs.push({
          text: text
        });
        nlc.classify(classifier.classifier_id, text).then(function logResults (data) {
          classifier.logs.push({ classes: data.classes });
        });
      };
    }
  ]);
