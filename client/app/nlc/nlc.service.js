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
  .factory('nlc', ['$http', '$q', '$log', '$interval', 'authentication', 'endpoints', 'session',
    function init ($http, $q, $log, $interval, authentication, endpoints, session) {

      function classifierEndpoint () {
        return endpoints.classifier + '/' + session.tenant + '/classifiers';
      }

      var nlcSvc = {
        /* Gets a list of all classifiers in the NLC service */
        getClassifiers: function getClassifiers () {
          return $q(function get (resolve, reject) {
            $http({
              method: 'GET',
              url: classifierEndpoint()
            }).then(function success (response){
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        /* Upload a JSON to NLC service and returns a trained classifier */
        train: function train (trainingData, language, name) {
          /*jshint camelcase: false */
          return $q(function post (resolve, reject) {
            $http({
              method: 'POST',
              url: classifierEndpoint(),
              data: {
                language: language,
                name: name,
                training_data: trainingData
              }
            }).then(function success (response) {
              $log.debug(response);
              resolve(response.data);
            }, function fail (error) {
              $log.error(error);
              reject(error);
            });
          });
        },

        /* Check on the status of the trained NLC instance */
        checkStatus : function checkStatus (id) {
          return $q(function get (resolve, reject) {
            $http({
              method: 'GET',
              url: classifierEndpoint() + '/' + id
            }).then(function success (response) {
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        pollStatus : function pollStatus (id, handleResponse, time) {
          var check = function check () {
            if (authentication.isAuthenticated()) {
              $http({
                method: 'GET',
                url: classifierEndpoint() + '/' + id
              }).then(function success (response) {
                handleResponse(response.data);
              }, function fail (error) {
                $log.error(error);
              });
            }
          };
          check();
          return $interval(check, time);
        },

        /* Send a piece of text to NLC and return a classification */
        classify: function classify (id, text) {
          return $q(function post (resolve, reject) {
            $http({
              method: 'POST',
              url: classifierEndpoint() + '/' + id + '/classify',
              data: {
                text: text
              }
            }).then(function success (response) {
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        /* Removes a classifier */
        remove: function remove (id) {
          return $q(function(resolve, reject) {
            $http({
              method: 'DELETE',
              url: classifierEndpoint() + '/' + id
            }).then(function success (response) {
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        }
      };

      // Public API here
      return nlcSvc;
    }
  ]);
