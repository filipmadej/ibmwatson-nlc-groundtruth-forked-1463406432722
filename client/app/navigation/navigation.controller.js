'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('NavigationCtrl', ['$scope', '$state', '$log', 'authentication',
    function ($scope, $state, $log, authentication) {

      $scope.isLoggedIn = false;

      function setup(user) {
        $log.debug('setup', user);
        if (!!user) {
          $scope.isLoggedIn = true;
        }
      }

      $scope.logout = function () {
        $log.debug('logout');

        authentication.logout().then(function () {

          $scope.isLoggedIn = false;

          $state.go('login',{message : {level : 'success', text : 'Logged out'}});
        });
      };

      authentication.getCurrentUser().then(setup,function () {
        // /var message = null;
        $log.debug('Error getting current user',arguments);
        // if (response.status === 401) {
        //   //User is not logged in
        //   message = {
        //     level : 'info',
        //     text : 'Please log in'
        //   };
        // } else {
        //   $log.error('Unable to get logged in user',response);
        //   message = {
        //     level : 'danger',
        //     text : 'Problem getting user info'
        //   };
        // }

        $state.go('login');
      });

    }
  ]);
