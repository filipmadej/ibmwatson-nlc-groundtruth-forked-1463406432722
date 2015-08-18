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
          $state.go('login', {alerts : [{text: 'Successfully logged out.', dismissable:true}]});
        });
      };

      authentication.getCurrentUser().then(setup, function error () {
        $log.debug('Error getting current user', arguments);
        $state.go('login');
      });

    }
  ]);
