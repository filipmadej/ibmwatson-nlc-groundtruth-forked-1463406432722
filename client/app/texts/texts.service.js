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
* @returns {object} The If-Match header
*/
function getMetadataEtag() {
  return {
    'If-Match': '*'
  };
}

angular.module('ibmwatson-nlc-groundtruth-app')
.factory('texts', ['$http', '$q', 'endpoints', 'session', function init ($http, $q, endpoints, session) {

  function textsEndpoint () {
    return endpoints.texts + '/' + session.tenant + '/texts';
  }

  function query (/*Object*/ config) {
    config = config || {};
    _.set(config, 'headers.Range', 'items=0-9999');
    return $q(function query (resolve, reject) {
      $http.get(textsEndpoint(), config)
      .then(function success (response) {
        resolve(response.data);
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function post (/*Object*/ params) {
    // retrieve etag header
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    return $q(function post (resolve, reject) {
      $http.post(textsEndpoint(), params, config)
      .then(function success (response) {
        resolve(response.data);
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function remove (/*String*/ id) {
    // retrieve etag header
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    return $q(function remove (resolve, reject) {
      $http.delete(textsEndpoint() + '/' + id, config)
      .then(function success () {
        resolve();
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function removeAll (/*Array*/ ids) {
    var headers = getMetadataEtag();
    _.set(headers, 'Content-Type', 'application/json;charset=utf-8');
    var config = {
      url: textsEndpoint(),
      method: 'DELETE',
      data: ids,
      headers: headers
    };
    return $q(function removeAll (resolve, reject) {
      $http(config).then(function success (data) {
        resolve(data);
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function addClasses (/*String*/ id, /*Object*/ params) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    return $q(function addClasses (resolve, reject) {
      $http.patch(textsEndpoint() + '/' + id, [
        {
          op : 'add',
          path : '/classes',
          value : params
        }
      ], config)
      .then(function success (response) {
        resolve(response.data);
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function removeClasses (/*String*/ id, /*Object*/ params) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    return $q(function removeClasses (resolve, reject) {
      $http.patch(textsEndpoint() + '/' + id, [
        {
          op : 'remove',
          path : '/classes',
          value : params
        }
      ], config)
      .then(function success () {
        resolve();
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function update (/*String*/ id, /*Object*/ params) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    return $q(function update (resolve, reject) {
      $http.patch(textsEndpoint() + '/' + id, [
        {
          op : 'replace',
          path : '/metadata',
          value : params
        }
      ], config)
      .then(function success () {
        resolve();
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  // Public API here
  return {
    'query': query,
    'post': post,
    'addClasses': addClasses,
    'removeClasses': removeClasses,
    'remove': remove,
    'removeAll': removeAll,
    'update': update
  };
}
]);
