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

/**
 * Retrieve the etag metadata in the form of an 'If-Match' Header
 * @returns {object} The If-Match header from the cluster
 */
function getMetadataEtag() {
  return {
    'If-Match': '*'
  };
}

angular.module('ibmwatson-nlc-groundtruth-app')
  .factory('classes', ['$http', 'endpoints', 'session', function init ($http, endpoints, session) {

    function classesEndpoint () {
      return endpoints.classes + '/' + session.tenant + '/classes';
    }

    function query (/*Object*/ params, /*function*/ callback) {
      $http.get(classesEndpoint(), params)
        .success(function success (data, status, headers, config) {
          callback(null, data, status, headers, config);
        })
        .error(function error (data, status, headers, config) {
          callback(data, null, status, headers, config);
        });
    }

    function post (/*Object*/ params, /*function*/ callback) {
      // retrieve etag header
      var config = {};
      _.set(config, 'headers', getMetadataEtag());
      $http.post(classesEndpoint(), params, config)
        .success(function success (data, status, headers, config) {
          callback(null, data, status, headers, config);
        })
        .error(function error (data, status, headers, config) {
          callback(data, null, status, headers, config);
        });
    }

    function remove (/*String*/ id, /*function*/ callback) {
      // retrieve etag header
      var config = {};
      _.set(config, 'headers', getMetadataEtag());
      $http.delete(classesEndpoint() + '/' + id, config)
        .success(function success (data, status, headers, config) {
          callback(null, data, status, headers, config);
        })
        .error(function error (data, status, headers, config) {
          callback(data, null, status, headers, config);
        });
    }

    function update (/*String*/ id, /*Object*/ params, /*function*/ callback) {
      var config = {};
      _.set(config, 'headers', getMetadataEtag());
      $http.put(classesEndpoint() + '/' + id, params, config)
        .success(function success (data, status, headers, config) {
          callback(null, data, status, headers, config);
        })
        .error(function error (data, status, headers, config) {
          callback(data, null, status, headers, config);
        });
    }

    // Public API here
    return {
      'query' : query,
      'post' : post,
      'remove' : remove,
      'update' : update
    };

  }]);
