'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('ErrorBarCtrl', ['$scope', 'errors',
    function init ($scope, errors) {
      $scope.display = false;

      $scope.errors = errors.get();

      $scope.$watch('errors', function(newValue, oldValue) {
        console.log('change');
        console.log(newValue);
        console.log(oldValue);
        // when a new error comes in, display the error messsage
        if (newValue.length > oldValue.length){
          $scope.display = true;
        }
      }, true);

      $scope.getErrors = function() {
        $scope.errors = errors.get();
      };
    }
  ]);
