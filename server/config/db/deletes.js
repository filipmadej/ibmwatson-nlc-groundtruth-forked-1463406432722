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
