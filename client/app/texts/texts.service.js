'use strict';

/**
 * Set a metadata field on the cluster to store the etag
 * @param {object} cluster - The cluster to set the tag on
 * @param {function} headers - The header function returned by Angular
 * @returns {object} - a reference to the cluster
 */
function setMetadataEtag( /*Object*/ cluster, /*function*/ headers) {
    var etag = null;

    if (!cluster || typeof headers !== 'function') {
        return cluster;
    }

    etag = headers('etag');

    if (_.isString(etag) && etag.length > 0) {
        _.set(cluster, 'metadata.etag', etag);
    }

    return cluster;
}

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
  .factory('texts', ['$http', 'endpoints', 'session', function($http, endpoints, session) {
    var tenant = session.tenant();

    function textsEndpoint () {
      return endpoints.nlcstore + '/' + tenant + '/texts';
    }

    function query (/*Object*/ params, /*function*/ callback) {
      $http.get(textsEndpoint(), params)
        .success(function(data, status, headers, config) {
          callback(null, data, status, headers, config);
        })
        .error(function(data, status, headers, config) {
          callback(data, null, status, headers, config);
        });
    }

  function post (/*Object*/ params, /*function*/ callback) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.post(textsEndpoint(), params, config)
          .success(function(data, status, headers, config) {
            callback(null, data, status, headers, config);
          })
          .error(function(data, status, headers, config) {
            callback(data, null, status, headers, config);
          });
  }

  function remove (/*String*/ id, /*function*/ callback) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.delete(textsEndpoint() + '/' + id, config)
          .success(function(data, status, headers, config) {
            callback(null, data, status, headers, config);
          })
          .error(function(data, status, headers, config) {
            callback(data, null, status, headers, config);
          });
  }

  function addClasses (/*String*/ id, /*Object*/ params, /*function*/ callback) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.patch(textsEndpoint() + '/' + id, [
      {
        op : 'add',
        path : '/classes',
        value : params
      }
      ], config)
          .success(function(data, status, headers, config) {
            callback(null, data, status, headers, config);
          })
          .error(function(data, status, headers, config) {
            callback(data, null, status, headers, config);
          });
  }

  function removeClasses (/*String*/ id, /*Object*/ params, /*function*/ callback) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.patch(textsEndpoint() + '/' + id, [{
        op : 'remove',
        path : '/classes',
        value : params
      }], config
    ).success(function(data, status, headers, config) {
            callback(null, data, status, headers, config);
        }).error(function(data, status, headers, config) {
            callback(data, null, status, headers, config);
        });
  }

  function update (/*String*/ id, /*Object*/ params, /*function*/ callback) {
    var config = {};
    _.set(config, 'headers', getMetadataEtag());
    $http.patch(textsEndpoint() + '/' + id, [{
        op : 'replace',
        path : '/metadata',
        value : params
      }], config
    ).success(function(data, status, headers, config) {
            callback(null, data, status, headers, config);
        }).error(function(data, status, headers, config) {
            callback(data, null, status, headers, config);
        });
  }

  // Public API here
    return {
      'query': query,
      'post': post,
      'addClasses': addClasses,
      'removeClasses': removeClasses,
      'remove': remove,
      'update': update
    };

  }]);
