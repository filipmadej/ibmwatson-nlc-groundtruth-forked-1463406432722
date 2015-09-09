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

angular.module('ibmwatson-common-ui-components.watsonAlerts')
  .controller('WatsonAlertsCtrl', ['$scope', 'watsonAlerts',
    function($scope, watsonAlerts) {
      // if the user has not overwritten the array using the alerts attribute, default to using the service
      if (!$scope.alerts) {
        $scope.alerts = watsonAlerts.alerts;
      }
    }
  ])
  .directive('watsonAlertsBar', function() {
    return {
      templateUrl: 'watsonAlerts/watsonAlertsBar.html',
      controller: 'WatsonAlertsCtrl',
      scope: {
        alerts: '=?alerts'
      },
      restrict: 'E',
      replace: true
    };
  });
