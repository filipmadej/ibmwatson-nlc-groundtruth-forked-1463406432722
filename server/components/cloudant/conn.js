'use strict';

/**
 * Creates a connection to a Cloudant database.
 *
 *  Uses connection details from a bound Bluemix service instance if available, or a
 *   user-provided service otherwise.
 *
 * @author Dale Lane
 * @module ibmwatson-qa-questionstore/lib/db/conn
 */

// external dependencies
var _ = require('lodash');
var cloudant = require('cloudant');
var async = require('async');
// local dependency
var log = require('../../config/log');
var dbinstance = require('./instance');

var dbcache = {};

module.exports = function connect (options, dbname, designs, callback) {

    if (_.isFunction(designs)) {
        callback = designs;
        designs = [];
    }

    if (dbcache[dbname]) {
        log.debug('start called on DB module that is already started');
        return callback(null, dbcache[dbname]);
    }

    if (options) {
        return async.waterfall([
            function connectToCloudant (next) {
                if (options.url) {
                    cloudant.url = options.url;
                }
                cloudant(options, function checkCloudantConn (err, cloudantdb) {
                    next(err, cloudantdb);
                });
            },
            function getDbHandle (driver, next) {
                dbinstance(driver, dbname, designs, next);
            }
        ], function onEnd (err, handle) {
            if (err) {
                return callback(err);
            }
            dbcache[dbname] = handle;
            callback(null, dbcache[dbname]);
        });

    }

    return callback(new Error('Missing required CF environment for Cloudant'));
};
