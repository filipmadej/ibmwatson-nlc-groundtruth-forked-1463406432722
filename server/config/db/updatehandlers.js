'use strict';

/**
 * Invokes update-handlers on the Cloudant database.
 *
 * @author Andy Stoneberg
 * @module ibmwatson-nlc-store/lib/db/updatehandlers
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

function getErrorMessage (updatename) {
    var op = updatename.split('-')[0];
    return util.format('Failed to %s classes on text', op)
}

function handleTextClasses ( db, update, textid, classes, callback ) {

    log.debug({
        classes : classes,
        text : textid,
        update : update
    }, 'Updating classes on text');

    if (!classes || classes.length === 0) {
        // nothing to do
        return callback();
    }

    async.series([
        function verifyClasses (done) {
            dbviews.lookupClasses(db, classes, function verifyClasses (err, results) {

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
            var parameters = { classes : classes };

            db.atomic('text', update, textid, parameters, function checkResponse (err, resp) {
                if (err) {
                    log.error({ err : err }, getErrorMessage(update));
                    return done(err);
                }
                if (resp.error) {
                    log.error({ response : resp }, getErrorMessage(update));
                    return done(dberrors.asError(resp.error, getErrorMessage(update), resp.code));
                }
                return done();
            });
        }
    ], callback);
}


module.exports.addClassesToText = function addClassesToText (db, textid, classes, callback) {
    handleTextClasses(db, 'add-classes', textid, classes, callback);
};


module.exports.removeClassesFromText = function removeClassesFromText (db, textid, classes, callback) {
    handleTextClasses(db, 'remove-classes', textid, classes, callback);
};

module.exports.updateTextMetadata = function updateTextMetadata (db, textid, metadata, callback) {
    log.debug({
        metadata : metadata,
        text : textid
    }, 'Updating metadata on text');

    if (!metadata) {
        // nothing to do
        return callback();
    }

    var parameters = { metadata : metadata };

    db.atomic('text', 'update-metadata', textid, parameters, function checkResponse (err, resp) {

        var errorMsg = function errorMsg () {
            return util.format('Failed to update metadata on text [%s]', textid)
        }

        if (err) {
            log.error({ err : err }, errorMsg());
            return callback(err);
        }

        if (resp.error) {
            log.error({ response : resp }, errorMsg());
            return callback(dberrors.asError(resp.error, errorMsg(), resp.code));
        }
        return callback();
    });
};


module.exports.updateClassMetadata = function updateClassMetadata (db, classid, metadata, callback) {
    log.debug({
        metadata : metadata,
        class : classid
    }, 'Updating metadata on class');

    if (!metadata) {
        // nothing to do
        return callback();
    }

    var parameters = { metadata : metadata };

    db.atomic('class', 'update-metadata', classid, parameters, function checkResponse (err, resp) {

        var errorMsg = function errorMsg () {
            return util.format('Failed to update metadata on text [%s]', classid)
        }

        if (err) {
            log.error({ err : err }, errorMsg());
            return callback(err);
        }

        if (resp.error) {
            log.error({ response : resp }, errorMsg());
            return callback(dberrors.asError(resp.error, errorMsg(), resp.code));
        }
        return callback();
    });
};
