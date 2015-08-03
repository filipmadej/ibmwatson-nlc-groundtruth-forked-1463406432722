'use strict';

angular.module('ibmwatsonQaGroundtruthUiApp')
    .controller('LiveSystemCtrl', ['$scope', 'nlc',
        function($scope, nlc) {

            $scope.conversation = [];

            $scope.classifyText = function() {
                $scope.conversation.push($scope.text);
                var responseIndex =$scope.conversation.length;
                $scope.conversation.push([{
                    class: 'Loading Response...'
                }]);
                nlc.classify($scope.text).then(function(response) {
                    console.log(response);
                    $scope.text = '';
                    var result = [];
                    for (var i = 0, len = response.classes.length; i < len; i++) {
                        var classObject = response.classes[i];
                        result.push({
                            class: classObject.class_name,
                            confidence: classObject.confidence
                        });
                    }
                    $scope.conversation[responseIndex] = result;
                });
            };

            $scope.status = '';
            $scope.checkStatus = function () {
                nlc.pollStatus(function(response) {
                    $scope.status = response.data.status;
                }, 5000);
            };
            $scope.checkStatus();
        }
    ]);
