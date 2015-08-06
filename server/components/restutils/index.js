'use strict';

/**
 * Exposes namespaces to provide common functionality for reading requests and
 * writing responses.
 *
 * @author Andy Stoneberg
 * @module ibmwatson-common-restapi
 */

// local dependencies
var requests = require('./requests');
var responses = require('./responses');

module.exports.req = requests;

module.exports.res = responses;
