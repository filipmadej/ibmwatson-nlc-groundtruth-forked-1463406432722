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

// core dependencies
var util = require('util');

// external dependencies
var async = require('async');
var chai = require('chai');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

// local dependencies
var dberrors = require('./errors');

// test dependencies
var mocks = require('../../test/mocks');

var handler ;

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/db/updatehandlers', function () {

  var TENANT = 'test';

  beforeEach( function () {

    this.dbMock = {
      atomic : sinon.stub(),
      '@noCallThru' : true
    };

    this.viewMock = {
      lookupClasses : sinon.stub(),
      '@noCallThru' : true
    };

    handler = proxyquire('./updatehandlers', {
      './views' : this.viewMock,
      '../log' : new mocks.LogMock()
    });
  });

  describe('#addClassesToText()', function () {

    it('should no op if no classes specified', function () {
      handler.addClassesToText(this.dbMock, TENANT, 'test-text-id', undefined, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        this.viewMock.lookupClasses.should.not.have.been.called;
        this.dbMock.atomic.should.not.have.been.called;
      }.bind(this));

      handler.addClassesToText(this.dbMock, TENANT, 'test-text-id', [], function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        this.viewMock.lookupClasses.should.not.have.been.called;
        this.dbMock.atomic.should.not.have.been.called;
      }.bind(this));
    });


    it('should complete successfully', function (done) {
      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, [{id : testClasses[0]}]);

      this.dbMock.atomic.callsArgWith(4, null, {ok : true});

      handler.addClassesToText (this.dbMock, TENANT, 'test-text-id', testClasses, function (err, resp) {
        should.not.exist(err);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.have.been.called;
        done();
      }.bind(this));

    });

    it('should error if invalid class id specified', function (done) {
      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, []);

      this.dbMock.atomic.callsArgWith(4, null, {ok : true});

      handler.addClassesToText (this.dbMock, TENANT, 'test-text-id', testClasses, function (err, resp) {
        should.exist(err);
        err.should.have.property('statusCode', httpstatus.UNPROCESSABLE_ENTITY);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.not.have.been.called;
        done();
      }.bind(this));

    });

    it('should return error returned by cloudant call', function () {

      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, [{id : testClasses[0]}]);

      var errorMessage = 'test-generated';
      this.dbMock.atomic.callsArgWith(4, new Error(errorMessage));

      handler.addClassesToText(this.dbMock, TENANT, 'test-text-id', testClasses, function (err, result) {
        should.exist(err);
        err.should.have.property('message', errorMessage);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.have.been.called;
      }.bind(this));
    });

    it('should create and return DatabaseError when response contains error', function () {

      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, [{id : testClasses[0]}]);

      var statusCode = httpstatus.NOT_FOUND;
      this.dbMock.atomic.callsArgWith(4, null, {error : dberrors.NOT_FOUND, code : statusCode});

      handler.addClassesToText(this.dbMock, TENANT, 'test-text-id', testClasses, function (err, result) {
        should.exist(err);
        err.should.have.property('error', dberrors.NOT_FOUND);
        err.should.have.property('statusCode', statusCode);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.have.been.called;
      }.bind(this));
    });
  });

  describe('#removeClassesFromText()', function () {

    it('should no op if no classe specified', function () {
      handler.removeClassesFromText(this.dbMock, TENANT, 'test-text-id', undefined, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        this.viewMock.lookupClasses.should.not.have.been.called;
        this.dbMock.atomic.should.not.have.been.called;
      }.bind(this));

      handler.removeClassesFromText(this.dbMock, 'test-text-id', [], function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        this.viewMock.lookupClasses.should.not.have.been.called;
        this.dbMock.atomic.should.not.have.been.called;
      }.bind(this));
    });

    it('should complete successfully', function (done) {
      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, [{id : testClasses[0]}]);

      this.dbMock.atomic.callsArgWith(4, null, {ok : true});

      handler.removeClassesFromText (this.dbMock, TENANT, 'test-text-id', testClasses, function (err, resp) {
        should.not.exist(err);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.have.been.called;
        done();
      }.bind(this));

    });

    it('should error if invalid class id specified', function (done) {
      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, []);

      this.dbMock.atomic.callsArgWith(4, null, {ok : true});

      handler.removeClassesFromText (this.dbMock, TENANT, 'test-text-id', testClasses, function (err, resp) {
        should.exist(err);
        err.should.have.property('statusCode', httpstatus.UNPROCESSABLE_ENTITY);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.not.have.been.called;
        done();
      }.bind(this));

    });

    it('should return error returned by cloudant call', function () {

      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, [{id : testClasses[0]}]);

      var errorMessage = 'test-generated';
      this.dbMock.atomic.callsArgWith(4, new Error(errorMessage));

      handler.removeClassesFromText(this.dbMock, TENANT, 'test-text-id', testClasses, function (err, result) {
        should.exist(err);
        err.should.have.property('message', errorMessage);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.have.been.called;
      }.bind(this));
    });

    it('should create and return DatabaseError when response contains error', function () {

      var testClasses = ['test-class-id'];

      this.viewMock.lookupClasses.callsArgWith(3, null, [{id : testClasses[0]}]);

      var statusCode = httpstatus.NOT_FOUND;
      this.dbMock.atomic.callsArgWith(4, null, {error : dberrors.NOT_FOUND, code : statusCode});

      handler.removeClassesFromText(this.dbMock, TENANT, 'test-text-id', testClasses, function (err, result) {
        should.exist(err);
        err.should.have.property('error', dberrors.NOT_FOUND);
        err.should.have.property('statusCode', statusCode);
        this.viewMock.lookupClasses.should.have.been.called;
        this.dbMock.atomic.should.have.been.called;
      }.bind(this));
    });
  });

  describe('#updateTextMetadata ()', function () {

    it('should no op if no metadata specified', function (done) {
      handler.updateTextMetadata (this.dbMock, TENANT, 'test-text-id', undefined, function (err, resp) {
        should.not.exist(err);
        this.dbMock.atomic.should.not.have.been.called;
        done();
      }.bind(this));

    });

    it('should complete successfully', function (done) {
      var metadata = {
        value : 'updated',
        metadata : {
          source : 'public'
        }
      };

      this.dbMock.atomic.callsArgWith(4, null, metadata);

      handler.updateTextMetadata (this.dbMock, TENANT, 'test-text-id', metadata, function (err, resp) {
        should.not.exist(err);
        this.dbMock.atomic.should.have.been.called;
        done();
      }.bind(this));

    });

    it('should return error if included in response from atomic', function (done) {
      var metadata = {
        value : 'updated',
        metadata : {
          source : 'public'
        }
      };

      var error = {
        error : 'not_found',
        code : httpstatus.NOT_FOUND
      };

      this.dbMock.atomic.callsArgWith(4, null, error);

      handler.updateTextMetadata (this.dbMock, TENANT, 'test-text-id', metadata, function (err, resp) {
        should.exist(err);
        err.should.have.property('statusCode', error.code);
        this.dbMock.atomic.should.have.been.called;
        done();
      }.bind(this));

    });


    it('should return error returned by cloudant call', function (done) {

      var metadata = {
        value : 'updated',
        metadata : {
          source : 'public'
        }
      };

      var errorMessage = 'test-generated';
      this.dbMock.atomic.callsArgWith(4, new Error(errorMessage));

      handler.updateTextMetadata(this.dbMock, TENANT, 'test-text-id', metadata, function (err, resp) {
        should.exist(err);
        err.should.have.property('message', errorMessage);
        this.dbMock.atomic.should.have.been.called;
        done();
      }.bind(this));
    });
  });
});
