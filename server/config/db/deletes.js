'use strict';
/* eslint no-underscore-dangle:0 */

// external dependencies
var _ = require('lodash');
var async = require('async');

// local dependencies
var log = require('../log');
var dbviews = require('./views');

function deleteBatch (db, tenant, callback) {

    async.waterfall([
        function getDocuments (next) {
            var options = {
                skip : 0,
                limit : 1000
            };

            dbviews.getDocumentsInTenant(db, tenant, options, next);
        },
        function prepareDeleteRequest (documents, next) {
            var docs = documents.map(function addDeleted (doc) {
                return {
                    _id : doc._id,
                    _rev : doc._rev,
                    _deleted : true
                };
            });
            next(null, { docs : docs });
        },
        function submitDelete (req, next) {
            db.bulk(req, function checkDeleteResponse (err) {
                next(err);
            });
        },
        function checkForMore (next) {

            dbviews.countDocumentsInTenant(db, tenant, function checkDocs (err, count) {
                if (err) {
                    return next(err);
                }
                next(null, count > 0);
            });
        }
    ], callback);
}

function runDelete (db, tenant, callback) {
    deleteBatch(db, tenant, function nextStep (err, moretodelete) {
        if (err) {
            return callback(err);
        }
        if (moretodelete) {
            return runDelete(db, tenant, callback);
        }
        log.info({ tenant : tenant }, 'All documents deleted');
        return callback();
    });
}

module.exports = function deleteall (db, tenant, callback) {
    log.info({ tenant : tenant }, 'Deleting all documents in tenant');

    runDelete(db, tenant, callback);
};
