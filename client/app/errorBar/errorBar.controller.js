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
  .controller('ErrorBarCtrl', ['$scope', '$log', 'errors',
    function init ($scope, $log, errors) {
      $scope.display = false;

      $scope.$watch('errors', function display (newValue, oldValue) {
        $log.debug('change error bar from ' + oldValue + ' to ' + newValue);
        // when a new error comes in, display the error messsage
        if (newValue.length > oldValue.length){
          $scope.display = true;
        }
      }, true);

      $scope.getErrors = function getErrors () {
        $scope.errors = errors.get();
      };

      $scope.getErrors();

    }
  ]);
