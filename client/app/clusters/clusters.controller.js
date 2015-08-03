'use strict';

angular.module('ibmwatsonQaGroundtruthUiApp')
    .controller('ClustersCtrl', ['$scope', '$stateParams', 'nlc',
        function ($scope, $stateParams, nlc) {

            /*console.log($stateParams);
            
            $scope.status = '';
            $scope.checkStatus = function () {
                nlc.pollStatus($stateParams.classifierId, function (response) {
                    $scope.status = response.data.status;
                }, 10000);
            };
            $scope.checkStatus();*/
        }
    ]);
