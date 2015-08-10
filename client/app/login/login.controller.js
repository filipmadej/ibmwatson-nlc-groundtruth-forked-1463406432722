'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('LoginCtrl', ['$scope', '$rootScope', '$state', 'authentication',
    function init ($scope, $rootScope, $state, authentication) {

      // Error Message displayed in the event of login error
      $scope.message = $state.params.message;

      // Credentials for logging in
      $scope.credentials = {
        username: '',
        password: ''
      };

      $scope.login = function login (credentials) {
        $scope.errorResponse = '';

        authentication.login(credentials.username, credentials.password)
          .then(function success () {
            // Broadcast login event?
            console.log('login');
            $state.go('classifiers');
          }, function error (err) {
            console.log(err);
            $state.go('login', {message: err.message});
          });
      };
    }
  ]);
