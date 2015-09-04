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

var app = angular.module('ibmwatson-nlc-groundtruth-app', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'xeditable',
    'ngDialog',
    'ngFileUpload',
    'config',
    'angular-multi-check',
    'btford.socket-io',
    'ibmwatson-common-ui-components'
  ])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider',
    function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

      $urlRouterProvider.otherwise('/classifiers');
      $locationProvider.html5Mode(true);

      // set up a http interceptor to listen out for 401 (Unauthorizes) responses
      $httpProvider.interceptors.push(['$q', '$location', function($q, $location) {
        return {
          // If response is 401 (Unauthorized), go to the login URL
          'responseError': function(response) {
            if (response.status === 401) {
              $location.path('/login');
            }
            return $q.reject(response);
          }
        };
      }]);
    }
  ])
  .run(['$rootScope', '$state', '$location', '$log',
    function($rootScope, $state, $location, $log) {
      $rootScope.$on('$stateChangeStart', function(event, nextState) {
        $log.debug('changing state',nextState.url);

      });
      $rootScope.$on('$stateChangeSuccess', function(event, nextState) {
        $log.debug('state change success!',nextState.url);
      });
    }
  ]);

app.controller('AppController', ['$rootScope', '$scope',
  function($rootScope, $scope) {
    // Currently logged in user
    $scope.currentUser = null;

    // Current tenant (service instance)
    $scope.currentTenant = null;

    $scope.setCurrentUser = function setCurrentUser(user){
      $scope.currentUser = user;
    };

    $scope.setCurrentTenant = function setCurrentTenant(tenant){
      $scope.currentTenant = tenant;
    };
  }
]);
