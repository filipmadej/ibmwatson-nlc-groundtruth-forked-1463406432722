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
  .factory('versions', ['$http', '$q', '$log', 'endpoints', 'versionInfo',
    function init($http, $q, $log, endpoints, versionInfo) {

      function getCurrent() {
        return $http.get(endpoints.versions,{
          current:'true'
        })
          .then(function getVersionSuccess(response) {
            $log.debug('Got versions', response.data);
            return response.data[0] || {};
          }, function getVersionError(response) {
            $log.debug('Got current Version Error', response);
            return $q.reject('Unable to get current version:' + response.data);
          });
      }

      function isCurrent() {
        return $q(function(resolve, reject) {
          getCurrent().then(function checkCurrent(/*Object*/currentVersion) {
            if (currentVersion.version){
              if(currentVersion.version === versionInfo.version) {
                return resolve(true);
              }else{
                return resolve(false);
              }
            }else{
              reject('Current Version unknown');
            }
          },function(err){
            reject(err.message);
          });
        });
      }

      // Public API here
      return {
        'informed': false,
        'getCurrent': getCurrent,
        'isCurrent': isCurrent
      };

    }
  ]);