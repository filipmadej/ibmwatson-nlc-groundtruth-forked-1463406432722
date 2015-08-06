'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('NavigationCtrl', ['$scope', '$state', '$log', 'authentication',
    function init ($scope, $state, $log, authentication) {

      $scope.isLoggedIn = false;

      function setup (user) {
        $log.debug('setup', user);
        if (!!user) {
          $scope.isLoggedIn = true;
        }
      }

      $scope.logout = function logout () {
        $log.debug('logout');

        authentication.logout().then(function logout () {
          $scope.isLoggedIn = false;
          $state.go('login', {message : {level : 'success', text : 'Logged out'}});
        });
      };

      authentication.getCurrentUser().then(setup, function error () {
        $log.debug('Error getting current user', arguments);
        $state.go('login');
      });

    }
  ]);
