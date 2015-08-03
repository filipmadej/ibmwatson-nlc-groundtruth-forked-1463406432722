'use strict';

angular.module('ibmwatsonQaGroundtruthUiApp')
    .controller('ClassifiersCtrl', ['$scope', 'nlc',
        function($scope, nlc) {
            $scope.classifiers = [];
            
            $scope.toggleArrowDown = function(classifier) {
               classifier.showArrowDown = !classifier.showArrowDown; 
            };

            $scope.loadClassifiers = function() {
                nlc.getClassifiers().then(function(data) {
                    console.log(data);
                    $scope.classifiers = data.classifiers;
                    $scope.classifiers.forEach(function(d){
                        // add additional data required for UI interactions
                        $scope.checkStatus(d); // get an initial status check
                        //$scope.pollStatus(d, 5000); // set up the poll to update the status every 5 seconds
                        d.logs = []; // store the texts and consequent classes
                        d.status = ''; // what is the availibility status of the classifier
                        d.textToClassify = ''; // store the ng-model variable for a given classifier
                        d.showArrowDown = false; // show logs for a given classifier
                    });
                });
            };
            
            $scope.loadClassifiers();
            
            $scope.checkStatus = function(classifier) {
                /*jshint camelcase: false */
                nlc.checkStatus(classifier.classifier_id).then(function(data){
                    classifier.status = data.status;
                });
            };
            
            $scope.pollStatus = function (classifier, interval) {
                /*jshint camelcase: false */
                nlc.pollStatus(classifier.classifier_id, function(data) {
                    classifier.status = data.status;
                }, interval);
            };

            $scope.deleteClassifier = function(id) {
                nlc.remove(id).then(function() {
                    $scope.loadClassifiers();
                });
            };
            
            $scope.classify = function (classifier, text) {
                /*jshint camelcase: false */
                classifier.textToClassify = '';
                classifier.logs.push({
                    text: text
                });                    
                nlc.classify(classifier.classifier_id, text).then(function(data) {
                    classifier.logs.push({
                        classes: data.classes
                    });
                });
            };
        }
    ]);
