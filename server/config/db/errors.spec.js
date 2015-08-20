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
/*eslint func-names: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var httpstatus = require('http-status');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var dberrors = require('./errors');

var should = chai.should();
chai.use(sinonChai);

function verifyError (error, category, code, message) {
    should.exist(error);
    error.should.have.property('error', category);
    error.should.have.property('statusCode', code);
    if (message) {
        error.should.have.property('message', message);
    } else {
        error.should.have.property('message');
    }
}

describe('/server/config/db/errors', function () {

    it('should create a conflict error with default message', function () {
        var error = dberrors.rev();
        verifyError(error, dberrors.CONFLICT, httpstatus.CONFLICT);
    });

    it('should create a conflict error with custom message', function () {
        var message = 'custom';
        var error = dberrors.rev(message);
        verifyError(error, dberrors.CONFLICT, httpstatus.CONFLICT, message);
    });

    it('should create a not found error with default message', function () {
        var error = dberrors.notfound();
        verifyError(error, dberrors.NOT_FOUND, httpstatus.NOT_FOUND);
    });

    it('should create a not found error with custom message', function () {
        var message = 'custom';
        var error = dberrors.notfound(message);
        verifyError(error, dberrors.NOT_FOUND, httpstatus.NOT_FOUND, message);
    });

    it('should create a forbidden error', function () {
        var message = 'custom';
        var error = dberrors.forbidden(message);
        verifyError(error, dberrors.FORBIDDEN, httpstatus.FORBIDDEN);
    });

    it('should create a required field missing error', function () {
        var message = 'custom';
        var error = dberrors.missingrequired(message);
        verifyError(error, dberrors.REQUIRED_FIELD_MISSING, httpstatus.BAD_REQUEST, message);
    });

    it('should create a unexpected object type error', function () {
        var message = 'custom';
        var error = dberrors.unexpectedtype(message);
        verifyError(error, dberrors.UNEXPECTED_OBJECT_TYPE, httpstatus.BAD_REQUEST, message);
    });

    it('should create a invalid error', function () {
        var message = 'custom';
        var error = dberrors.invalid(message);
        verifyError(error, dberrors.INVALID, httpstatus.UNPROCESSABLE_ENTITY, message);
    });

    it('should create a non-unique error', function () {
        var message = 'custom';
        var error = dberrors.nonunique(message);
        verifyError(error, dberrors.NON_UNIQUE, httpstatus.BAD_REQUEST, message);
    });

    it('should create a too many results error', function () {
        var message = 'custom';
        var error = dberrors.toomanyresults(message);
        verifyError(error, dberrors.TOO_MANY_RESULTS, httpstatus.INTERNAL_SERVER_ERROR, message);
    });

    it('should create errors', function () {
        var message = 'custom';

        var conflict = dberrors.asError(dberrors.CONFLICT, message);
        verifyError(conflict, dberrors.CONFLICT, httpstatus.CONFLICT, message);

        var notfound = dberrors.asError(dberrors.NOT_FOUND, message);
        verifyError(notfound, dberrors.NOT_FOUND, httpstatus.NOT_FOUND, message);

        var forbidden = dberrors.asError(dberrors.FORBIDDEN, message);
        verifyError(forbidden, dberrors.FORBIDDEN, httpstatus.FORBIDDEN, message);

        var missingrequired = dberrors.asError(dberrors.REQUIRED_FIELD_MISSING, message);
        verifyError(missingrequired, dberrors.REQUIRED_FIELD_MISSING, httpstatus.BAD_REQUEST, message);

        var unexpectedtype = dberrors.asError(dberrors.UNEXPECTED_OBJECT_TYPE, message);
        verifyError(unexpectedtype, dberrors.UNEXPECTED_OBJECT_TYPE, httpstatus.BAD_REQUEST, message);

        var invalid = dberrors.asError(dberrors.INVALID, message);
        verifyError(invalid, dberrors.INVALID, httpstatus.UNPROCESSABLE_ENTITY, message);

        var nonunique = dberrors.asError(dberrors.NON_UNIQUE, message);
        verifyError(nonunique, dberrors.NON_UNIQUE, httpstatus.BAD_REQUEST, message);

        var toomanyresults = dberrors.asError(dberrors.TOO_MANY_RESULTS, message);
        verifyError(toomanyresults, dberrors.TOO_MANY_RESULTS, httpstatus.INTERNAL_SERVER_ERROR, message);

        var unknown = dberrors.asError('unrecognized', message);
        verifyError(unknown, dberrors.UNKNOWN, httpstatus.INTERNAL_SERVER_ERROR, message);
    });

    it('should create error and override status code', function () {
        var message = 'custom';

        var unexpectedtype = dberrors.asError(dberrors.UNEXPECTED_OBJECT_TYPE, message, httpstatus.INTERNAL_SERVER_ERROR);
        verifyError(unexpectedtype, dberrors.UNEXPECTED_OBJECT_TYPE, httpstatus.INTERNAL_SERVER_ERROR, message);
    });

});
