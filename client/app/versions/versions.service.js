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
  .factory('versions', ['$http', '$q', '$log', 'endpoints', 'versionInfo', 'watsonAlerts',
    function init($http, $q, $log, endpoints, versionInfo, watsonAlerts) {

      var informed = false;

      function getCurrent() {
        return $http.get(endpoints.versions,{
          current:'true'
        })
          .then(function getVersionSuccess(response) {
            $log.debug('Got versions', response.data);
            return response.data[0] || {};
          }, function getVersionError(response) {
            $log.debug('Got current version Error', response);
            return $q.reject('Unable to get current version:' + response.data);
          });
      }

      function isCurrent() {
        return $q(function current (resolve, reject) {
          getCurrent().then(function checkCurrent (/*Object*/currentVersion) {
            if (currentVersion.version){
              if(currentVersion.version === versionInfo.version) {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              reject('Current version unknown');
            }
          }, function error (err) {
            reject(err.message);
          });
        });
      }

      function getStatus () {
        return $q(function status (resolve, reject) {
          getCurrent().then(function checkCurrent (/*Object*/currentVersion) {
            if (currentVersion.version) {
              var response = currentVersion;
              if (currentVersion.version > versionInfo.version) {
                response.status = 'old';
              } else if (currentVersion.version === versionInfo.version) {
                response.status = 'current';
              } else {
                response.status = 'development';
              }
              resolve(response);
            } else {
              reject('Current Version unknown');
            }
          }, function error (err) {
            reject(err.message);
          });
        });
      }

      function alert () {
        getStatus().then(function alert (status) {
          if (!informed) {
            switch (status.status) {
              case 'old':
                watsonAlerts.add({
                  level: 'info',
                  title: 'Pssst!',
                  text: 'A new version of this tool is available. Get it from ' + status.download,
                  dismissable: true
                });
                informed = true;
                break;
              case 'current':
                break;
              case 'development':
                watsonAlerts.add({
                  level: 'info',
                  title: 'Pssst!',
                  text: 'You\'re using a development version of this tool.',
                  dismissable: true
                });
                informed = true;
                break;
            }
          }
        });
      }

      // Public API here
      return {
        'informed': informed,
        'getCurrent': getCurrent,
        'isCurrent': isCurrent,
        'getStatus': getStatus,
        'alert': alert
      };

    }
  ]);
