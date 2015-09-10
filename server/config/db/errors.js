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
/* eslint no-underscore-dangle:0, camelcase:0  */

// core dependencies
var util = require('util');

// external dependencies
var makeArray = require('make-array');

// local dependencies
var log = require('../log');

var CONFLICT = 'conflict';
var NOT_FOUND = 'not_found';
var FORBIDDEN = 'forbidden';
var REQUIRED_FIELD_MISSING = 'required_field_missing';
var UNEXPECTED_OBJECT_TYPE = 'unexpected_object_type';
var TOO_MANY_RESULTS = 'too_many_results';
var NON_UNIQUE = 'unique_constraint_violated';
var INVALID = 'invalid';
var UNKNOWN = 'unknown';

module.exports.CONFLICT = CONFLICT;
module.exports.NOT_FOUND = NOT_FOUND;
module.exports.FORBIDDEN = FORBIDDEN;
module.exports.REQUIRED_FIELD_MISSING = REQUIRED_FIELD_MISSING;
module.exports.UNEXPECTED_OBJECT_TYPE = UNEXPECTED_OBJECT_TYPE;
module.exports.TOO_MANY_RESULTS = TOO_MANY_RESULTS;
module.exports.NON_UNIQUE = NON_UNIQUE;
module.exports.INVALID = INVALID;
module.exports.UNKNOWN = UNKNOWN;

/**
 * Constructor for a new Error object specific to database operations
 *
 * @param {String} category - type of error
 * @param {String} message - description of error
 * @param {Number} code - http status code to associate with error
 * @returns {void} this is a constructor meant to be called via 'new'
 */
function DatabaseError (category, message, code) {
    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.error = category;
    this.message = message;
    this.statusCode = code;
}
util.inherits(DatabaseError, Error);
module.exports.DatabaseError = DatabaseError;

/**
 * Helper function used when we know a request will be rejected
 *  by Cloudant because of an incorrect rev value.
 * To save time of having to submit request, we create an error
 *  that looks like what we would've got back from Cloudant.
 *
 * @param {String} description details about the error
 * @returns {Error} conflict error
 */
function rev (description) {
    var details = description;
    if (!details) {
        details = 'Document update conflict';
    }
    return new DatabaseError(CONFLICT, details, 409);
}

module.exports.rev = rev;

/**
 * Helper function used when we know a view failed to return
 *  a result because a class does not exist. It creates
 *  an error that looks like what would've been returned
 *  if a single get request had been attempted.
 *
 * @param {String} description details about the error
 * @returns {Error} not-found error
 */
function notfound (description) {
    var details = description;
    if (!details) {
        details = 'Document not found';
    }
    return new DatabaseError(NOT_FOUND, details, 404);
}

module.exports.notfound = notfound;

/**
 * Helper function used when an object is accessed without
 * appropriate permission. It creates an error that looks like something we
 *  would have gotten from Cloudant
 *
 * @param {String} description details about the error
 * @returns {Error} forbidden error
 */
function forbidden (description) {
    return new DatabaseError(FORBIDDEN, description, 403);
}

module.exports.forbidden = forbidden;

/**
 * Helper function used when an object is missing required
 *  fields. It creates an error that looks like something we
 *  would have gotten from Cloudant
 *
 * @param {String} description details about the error
 * @returns {Error} missing-required error
 */
function missingrequired (description) {
    return new DatabaseError(REQUIRED_FIELD_MISSING, description, 400);
}

module.exports.missingrequired = missingrequired;

/**
 * Helper function used when we expect a different schema type
 * than what is returned in a document.  It creates an error that
 * looks like something we would have gotten from Cloudant
 *
 * @param {String} description details about the error
 * @returns {Error} unexpected-object-type error
 */
function unexpectedtype (description) {
    return new DatabaseError(UNEXPECTED_OBJECT_TYPE, description, 400);
}

module.exports.unexpectedtype = unexpectedtype;

/**
 * Helper function used when a document request is
 * invalid per business requirements.   This is a very
 * general error that should only be used if other
 * errors types are not appropriate.  It creates an
 * error that looks like something we would have gotten
 * from Cloudant
 *
 * @param {String} description details about the error
 * @returns {Error} invalid error
 */
function invalid (description) {
    return new DatabaseError(INVALID, description, 422);
}

module.exports.invalid = invalid;

/**
 * Helper function used when a document is being inserted
 * that would violate an implied unique constraint. It
 * creates an error that looks like something we
 * would have gotten from Cloudant
 *
 * @param {String} description details about the error
 * @returns {Error} unique-constraint-violated error
 */
function nonunique (description) {
    return new DatabaseError(NON_UNIQUE, description, 400);
}

module.exports.nonunique = nonunique;

/**
 * Helper function used when we expect a single result but
 * get back multiple. It creates an error that looks like something
 * we would have gotten from Cloudant
 *
 * @param {String} description details about the error
 * @returns {Error} too-many-results error
 */
function toomanyresults (description) {
    return new DatabaseError(TOO_MANY_RESULTS, description, 500);
}

module.exports.toomanyresults = toomanyresults;

/**
 * Helper function used to create a DatabaseError from
 * a known error type. It creates an error that looks like something
 * we would have gotten from Cloudant.  Useful when dealing
 * with update handlers.
 *
 * @param {String} category known error type
 * @param {String} description details about the error
 * @param {Number} code status code to override default (optional)
 * @returns {Error} error corresponding to provided category
 */
module.exports.asError = function asError (category, description, code) {
    var error;
    switch (category) {
        case CONFLICT:
            error = rev(description);
            break;
        case NOT_FOUND:
            error = notfound(description);
            break;
        case FORBIDDEN:
            error = forbidden(description);
            break;
        case REQUIRED_FIELD_MISSING:
            error = missingrequired(description);
            break;
        case UNEXPECTED_OBJECT_TYPE:
            error = unexpectedtype(description);
            break;
        case TOO_MANY_RESULTS:
            error = toomanyresults(description);
            break;
        case NON_UNIQUE:
            error = nonunique(description);
            break;
        case INVALID:
            error = invalid(description);
            break;
        default:
            return new DatabaseError(UNKNOWN, description, 500);
    }

    if (code) {
        error.statusCode = code;
    }

    return error;
};

/**
 * Helper function used to log and return errors in callback
 *  functions.  Just because Cloudant returns does error does
 *  not mean an error should be written to logs.  The most
 *  common situation is with 404.
 *
 * @param {Object} err - error object to handle
 * @param {Number[]} expected - array of status codes that should not log as error
 * @param {String} description - message to log
 * @param {Function} callback - called once the error had been logged
 * @returns {void}
 */
module.exports.handle = function handle (err, expected, description, callback) {
    if  ( makeArray(expected).indexOf(err.statusCode) !== -1) {
        log.debug({ message : err.message, error : err.error }, description);
    } else {
        log.error({ err : err }, description);
    }
    callback(err);
};
