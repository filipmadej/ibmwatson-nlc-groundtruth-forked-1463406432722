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
function getMetadataEtag( /*Object*/ cluster) {
    /*var etag = null;

    if (!cluster) {
        return;
    }

    etag = _.get(cluster, 'metadata.etag', '*');

    return {
        'If-Match': etag
    }; */

    return {
        'If-Match': '*'
    };

}

angular.module('ibmwatsonQaGroundtruthUiApp')
    .factory('classes', ['$http', 'endpoints', 'session', function ($http, endpoints, session) {

        function classesEndpoint () {
            // Use hard-coded :projectid of 'default' for now
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

        // function get ( /*String*/ id, /*Object*/ params, /*function*/ callback) {
        //     $http.get(classesEndpoint() + '/' + id, params)
        //         .success(function (data, status, headers, config) {
        //             data = setMetadataEtag(data, headers);
        //             callback(null, data, status, headers, config);
        //         })
        //         .error(function (data, status, headers, config) {
        //             callback(data, null, status, headers, config);
        //         });
        // }

        function post ( /*Object*/ params, /*Object*/ config, /*function*/ callback) {
            // retrieve etag header
            _.set(config, 'headers', getMetadataEtag(null));
            $http.post(classesEndpoint() + '/', params, config)
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
            _.set(config, 'headers', getMetadataEtag(null));
            $http.delete(classesEndpoint() + '/' + id, config)
                .success(function (data, status, headers, config) {
                    callback(null, data, status, headers, config);
                })
                .error(function (data, status, headers, config) {
                    callback(data, null, status, headers, config);
                });
                //TODO: ripple to delete class from texts
        }

        function update (/*String*/ id, /*Object*/ params, /*function*/ callback) {
            var config = {};
            _.set(config, 'headers', getMetadataEtag());
            $http.patch(classesEndpoint() + '/' + id, [{
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
            //'get' : get,
            'query' : query,
            'post' : post,
            'remove' : remove,
            'update' : update
        };
    }]);
