'use strict';
/* eslint camelcase:0 */

/**
 * Helper functions for REST API requests.
 */

// external dependencies
var util = require('util');
var rangeparser = require('http-range-parse');
var httpstatus = require('http-status');




function throwError (message) {
    var error = new Error(message);
    error.statusCode = httpstatus.BAD_REQUEST;
    throw error;
}



function getRangeOptions (rangeheader) {

    var range;

    try {
        range = rangeparser(rangeheader);
    }
    catch (err) {
        err.statusCode = httpstatus.BAD_REQUEST;
        throw err;
    }

    if (range.unit !== 'items') {
        throwError('Unsupported range type : ' + range.unit);
    }
    if (range.ranges) {
        throwError('Multiple ranges is unsupported');
    }

    // change items=-5 to be items=0-5
    if (range.suffix && !range.first) {
        range.first = 0;
        range.last = range.suffix;
    }

    return range;
}

function convertToInternal (fields) {
    return fields.map(function useCloudantIds (field) {
        if (field === 'id') {
            return '_id';
        }
        return field;
    });
}

function getListFields (req, options) {
    if (req.query.fields) {
        options.fields = convertToInternal(req.query.fields.split(','));
    }
}

module.exports.listoptions = function listoptions (req) {
    var options = {};

    var range = req.headers.range ?
                    getRangeOptions(req.headers.range) :
                    {};

    // default to starting at 0 if unspecified
    options.skip = range.first ? range.first : 0;
    // default to page size of 100 if unspecified
    options.limit = (range.last === 0 || range.last) ?
        (range.last - options.skip + 1) :
        100;

    // get list of object attributes to fetch
    getListFields(req, options);

    return options;
};

module.exports.verifyObjectsList = function verifyObjectsList (list) {
    if (util.isArray(list) === false) {
        var listerror = new Error('Expected an array');
        listerror.statusCode = httpstatus.BAD_REQUEST;
        throw listerror;
    }
    return list;
};

module.exports.getServiceAuthHeader = function getServiceAuthHeader () {
    return 'Bearer ' + process.env.SERVICE_BEARER_TOKEN;
}
