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
  .controller('LoginCtrl', ['$scope', '$rootScope', '$state', '$log', 'authentication', 'watsonAlerts',
    function init ($scope, $rootScope, $state, $log, authentication, watsonAlerts) {

      // Any messages to be displayed
      if($state.params.alerts && _.isArray($state.params.alerts)){
        for (var i = 0; i < $state.params.alerts.length; i++) {
          watsonAlerts.add($state.params.alerts[i]);
        }
      }

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
            $log.debug('successful login');
            $state.go('classifiers');
          }, function error (err) {
            $log.debug('failed login: ' + JSON.stringify(err));
            $state.go('login', {alerts: [{level:'error',text:err.message}]}, {reload:true, notify: true});
          });
      };
    }
  ]);
