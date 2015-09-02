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

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('ClassifiersCtrl', ['$scope', '$interval', '$log', 'nlc', 'ngDialog', 'watsonAlerts',
    function init ($scope, $interval, $log, nlc, ngDialog, watsonAlerts) {

      $scope.loading = true;
      $scope.classifiers = [];
      $scope.intervals = [];

      $scope.$on('$destroy', function destroy () {
        $scope.intervals.forEach(function forEach (interval) {
          $interval.cancel(interval);
        });
      });

      $scope.toggleArrowDown = function toggleArrowDown (classifier) {
        classifier.showArrowDown = !classifier.showArrowDown;
      };

      $scope.loadClassifiers = function loadClassifiers () {
        nlc.getClassifiers().then(function getClassifiers (data) {
          $scope.loading = false;
          $scope.classifiers = data.classifiers;
          $scope.classifiers.forEach(function forEach (classifier) {
            // add additional data required for UI interactions
            $scope.intervals.push($scope.pollStatus(classifier, 10000)); // set up the poll to update the status every 5 seconds
            classifier.logs = []; // store the texts and consequent classes
            classifier.status = ''; // what is the availibility status of the classifier
            classifier.statusDescription = '';
            classifier.textToClassify = ''; // store the ng-model variable for a given classifier
            classifier.showArrowDown = false; // show logs for a given classifier
            // $scope.checkStatus(classifier); // get an initial status check
          });
        }, function error (err) {
          watsonAlerts.add({ level: 'error', text: 'There was an error retrieving the classifiers list. Error: ' + JSON.stringify(err) });
        });
        $log.debug('Loaded classifiers.');
      };

      $scope.loadClassifiers();

      $scope.checkStatus = function checkStatus (classifier) {
        /*jshint camelcase: false */
        return nlc.checkStatus(classifier.classifier_id).then(function setStatus (data) {
          classifier.status = data.status;
          classifier.statusDescription = data.status_description;
        }, function error (err) {
          watsonAlerts.add({ level: 'error', text: 'Error checking the status of classifier ' + classifier.classifier_id + '. Error: ' + JSON.stringify(err) });
        });
      };

      $scope.pollStatus = function pollStatus (classifier, interval) {
        /*jshint camelcase: false */
        return nlc.pollStatus(classifier.classifier_id, function setStatus (data) {
          if (data.err) {
            watsonAlerts.add({ level: 'error', text: 'Error retrieving status for classifier ' + classifier.classifier_id + '. Error: ' + JSON.stringify(data.err) });
            classifier.status = 'Unavailable';
            classifier.statusDescription = 'Classifier currently unavailable.';
          } else {
            classifier.status = data.status;
            classifier.statusDescription = data.status_description;
          }
        }, interval);
      };

      $scope.deleteClassifier = function deleteClassifier (classifier) {
        /*jshint camelcase: false */
        var msg = $scope.question('Are you sure you want to delete the ' + classifier.name + ' classifier?', 'Delete');
        ngDialog.openConfirm({template: msg, plain: true
        }).then(function remove () {
          $scope.loading = true;
          nlc.remove(classifier.classifier_id).then(function reload () {
            $scope.loadClassifiers();
          }, function error (err) {
            watsonAlerts.add({ level: 'error', text: 'There was an error removing classifier ' + classifier.classifier_id + '. Error: ' + JSON.stringify(err) });
            $scope.loadClassifiers();
          });
        });
      };

      $scope.classify = function classify (classifier, text) {
        /*jshint camelcase: false */
        if (text.length === 0) {
          return;
        }
        if (text.length > 1024) {
          var msg = $scope.inform('Text length is greater than 1024 characters. Please shorten the text to test the classifier.');
          ngDialog.open({ template: msg, plain: true });
          return;
        }
        classifier.textToClassify = '';
        classifier.logs.unshift({
          text: text
        });
        $('#'+classifier.classifier_id).collapse('show');
        nlc.classify(classifier.classifier_id, text).then(function logResults (data) {
          classifier.logs.splice(1, 0, { classes: data.classes });
        }, function error (err) {
          watsonAlerts.add({ level: 'error', text: 'There was an error classifying "' + text + '" on classifier ' + classifier.classifier_id + '. Error: ' + JSON.stringify(err) });
        });
      };

      // construct html for ngDialog used to inform string <aString>
      $scope.inform = function (aString) {
        var contents;
        contents = '<div>' + aString + '</div>';
        contents += '<br>';
        contents += '<form class="ngdialog-buttons">';
        contents += '<input type="submit" value="OK" class="ngdialog-button ngdialog-button-primary" ng-click="closeThisDialog(' + 'Cancel' + ')">';
        contents += '</form>';
        return contents;
      };

      // construct html for ngDialog used to ask question in string <aString>
      $scope.question = function question (aString, confirmStr) {
        var contents = '<div>' + aString + '</div>';
        contents += '<br>';
        contents += '<form class="ngdialog-buttons" ng-submit="confirm(' + 'OK' + ')">';
        contents += '<input type="submit" value="'+(confirmStr || 'OK')+'" class="ngdialog-button ngdialog-button-primary" ng-click="confirm('+ 'OK'+ ')">';
        contents += '<input type="button" value="Cancel" class="ngdialog-button ngdialog-button-secondary" ng-click="closeThisDialog(' + 'Cancel' + ')">';
        contents += '</form>';
        return contents;
      };

    }
  ]);
