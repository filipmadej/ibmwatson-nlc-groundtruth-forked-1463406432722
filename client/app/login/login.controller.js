'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('LoginCtrl', ['$scope', '$rootScope', '$state', 'authentication', function($scope, $rootScope, $state, authentication) {

    // Error Message displayed in the event of login error
    $scope.message = $state.params.message;

    // Credentials for logging in
    $scope.credentials = {
      username: '',
      password: ''
    };

    $scope.login = function(credentials) {
      $scope.errorResponse = '';

      authentication.login(credentials.username, credentials.password).then(function() {
        // Broadcast login event?
        console.log('login');
        $state.go('classifiers');

      }, function(err) {
        console.log(err);
        $state.go('login',{message:err.message});
        //TODO Handle Login Failure
        // Broadcast failure
        //$scope.message = err.message;
      });
    };

  }]);
