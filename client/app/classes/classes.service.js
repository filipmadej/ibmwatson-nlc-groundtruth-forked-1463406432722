'use strict';

/**
 * Retrieve the etag metadata in the form of an 'If-Match' Header
 * @prarm {object} cluster - The cluster to get the tag from
 * @returns {object} The If-Match header from the cluster
 */
function getMetadataEtag() {
  return {
    'If-Match': '*'
  };
}

angular.module('ibmwatsonQaGroundtruthUiApp')
  .factory('classes', ['$http', 'endpoints', 'session', function ($http, endpoints, session) {

  function classesEndpoint () {
    return endpoints.classes + '/' + session.tenant + '/classes';
  }

  function query ( /*Object*/ params, /*function*/ callback) {
    $http.get(classesEndpoint(), params)
    .success(function (data, status, headers, config) {
      callback(null, data, status, headers, config);
    })
    .error(function (data, status, headers, config) {
      callback(data, null, status, headers, config);
    });
  }

  function post ( /*Object*/ params, /*function*/ callback) {
    // retrieve etag header
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.post(classesEndpoint(), params, config)
    .success(function (data, status, headers, config) {
      callback(null, data, status, headers, config);
    })
    .error(function (data, status, headers, config) {
      callback(data, null, status, headers, config);
    });
  }

  function remove ( /*String*/ id, /*function*/ callback) {
    // retrieve etag header
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.delete(classesEndpoint() + '/' + id, config)
    .success(function (data, status, headers, config) {
      callback(null, data, status, headers, config);
    })
    .error(function (data, status, headers, config) {
      callback(data, null, status, headers, config);
    });
  }

  function update (/*String*/ id, /*Object*/ params, /*function*/ callback) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.put(classesEndpoint() + '/' + id, params, config)
    .success(function(data, status, headers, config) {
      callback(null, data, status, headers, config);
    })
    .error(function(data, status, headers, config) {
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
