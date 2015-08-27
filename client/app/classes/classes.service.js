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
.factory('classes', ['$http', '$q', 'endpoints', 'session', 'texts', function init ($http, $q, endpoints, session, texts) {

  function classesEndpoint () {
    return endpoints.classes + '/' + session.tenant + '/classes';
  }

  function query (/*Object*/ config) {
    config = config || {};
    _.set(config, 'headers.Range', 'items=0-9999');
    return $q(function query (resolve, reject) {
      $http.get(classesEndpoint(), config)
      .then(function success (response) {
        resolve(response.data);
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  function post (/*Object*/ params) {
    var textid = params.textid;
    if (textid) {
      delete params.textid;
    }
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    return $q(function post (resolve, reject) {
      $http.post(classesEndpoint(), params, config)
      .then(function success (response) {
        if (textid) {
          texts.addClasses(textid, [{ id: response.data.id }]).then(function success () {
            resolve(response.data);
          }, function error (err) {
            reject(err);
          });
        } else {
          resolve(response.data);
        }
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
      $http.delete(classesEndpoint() + '/' + id, config)
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
      url: classesEndpoint(),
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

  function update (/*String*/ id, /*Object*/ params) {
    var config = { headers: getMetadataEtag() };
    return $q(function update (resolve, reject) {
      $http.put(classesEndpoint() + '/' + id, params, config)
      .then(function success (response) {
        resolve(response.data);
      })
      .catch(function error (response) {
        reject(response);
      });
    });
  }

  // Public API here
  return {
    'query' : query,
    'post' : post,
    'remove' : remove,
    'removeAll' : removeAll,
    'update' : update
  };

}]);
