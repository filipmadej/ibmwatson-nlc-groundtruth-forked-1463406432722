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
 * Invokes update-handlers on the Cloudant database.
 *
 * @author Andy Stoneberg
 * @module server/config/db/updatehandlers
 */

// core dependency
var util = require('util');

// external dependency
var async = require('async');
var httpstatus = require('http-status');

// local dependency
var dberrors = require('./errors');
var dbviews = require('./views');
var log = require('../log');

function getErrorMessage (op) {
    return util.format('Failed to %s classes on text', op)
}

function handleTextClasses ( db, update, tenantid, textid, classes, callback ) {
    log.debug({
        classes : classes,
        text : textid,
        update : update
    }, 'Updating classes on text');

    if (!classes || classes.length === 0) {
        // nothing to do
        return callback();
    }

    var op = update.split('-')[0];

    async.waterfall([
        function verifyClasses (done) {
            dbviews.lookupClassesById(db, tenantid, classes, function verifyClasses (err, results) {

                var invalid = results.some(function validateClass (cls) {
                    return (classes.indexOf(cls.id) === -1);
                });

                if (invalid || ( results.length !== classes.length ) ) {
                     return done(dberrors.invalid('Invalid class id specified'));
                }

                done(err);
            });
        },
        function applyChanges (done) {
            var parameters = {
              tenant : tenantid,
              classes : classes
            };

            db.atomic('text', update, textid, parameters, function checkResponse (err, resp) {
                if (err) {
                    log.error({ err : err }, getErrorMessage(op));
                    return done(dberrors.asError(err, err.msg, err.code));
                }
                if (resp.error) {
                    log.error({ response : resp }, getErrorMessage(op));
                    return done(dberrors.asError(resp.error, getErrorMessage(op), resp.code));
                }
                return done(null, { operation : { path : 'classes', op : op}, id : textid, classes : classes });
            });
        }
    ], callback);
}


module.exports.addClassesToText = function addClassesToText (db, tenantid, textid, classes, callback) {
    handleTextClasses(db, 'add-classes', tenantid, textid, classes, callback);
};


module.exports.removeClassesFromText = function removeClassesFromText (db, tenantid, textid, classes, callback) {
    handleTextClasses(db, 'remove-classes', tenantid, textid, classes, callback);
};

module.exports.updateTextMetadata = function updateTextMetadata (db, tenantid, textid, metadata, callback) {
    log.debug({
        metadata : metadata,
        text : textid
    }, 'Updating metadata on text');

    if (!metadata) {
        // nothing to do
        return callback();
    }

    var parameters = {
      tenant : tenantid,
      metadata : metadata
    };

    db.atomic('text', 'update-metadata', textid, parameters, function checkResponse (err, resp) {

        var errorMsg = function errorMsg () {
            return util.format('Failed to update metadata on text [%s]', textid)
        }

        if (err) {
            log.error({ err : err }, errorMsg());
            // TODO FIGURE OUT WHY THIS DIDN'T APPEAR TO BE STD NANO ERR
            return callback(dberrors.asError(dberrors.UNKNOWN, err.message, err.statusCode));
        }
        if (resp.error) {
            log.error({ response : resp }, errorMsg());
            return callback(dberrors.asError(resp.error, errorMsg(), resp.code));
        }

        return callback(null, { operation : { path : 'metadata', op : 'replace' }, id : textid, metadata : metadata });
    });
};
