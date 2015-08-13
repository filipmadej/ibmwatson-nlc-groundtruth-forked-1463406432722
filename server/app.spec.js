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

var async = require('async');
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// test dependencies
var mocks = require('./test/mocks');

var should = chai.should();
chai.use(sinonChai);

var app;

describe('server/app', function () {

  beforeEach(function () {
    this.httpMock = new mocks.HttpMock();
    this.storeMock = new mocks.StoreMock();
  });

  it('should default to development environment', function (done) {
    this.timeout(5000);

    if (process.env.NODE_ENV) {
      this.originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
    }

    app = proxyquire('./app', {
      'http' : this.httpMock,
      './config/db/store' : this.storeMock,
      'watson-developer-cloud' : new mocks.WDCMock()
    });

    // Need to pause momentarily to let the async function complete
    setTimeout( function () {
      process.env.NODE_ENV.should.equal('development');
      if (this.originalEnv) {
        process.env.NODE_ENV = this.originalEnv;
      }
      done();
    }.bind(this), 500);


  });

  describe('#success', function () {
    beforeEach(function (done) {
      this.timeout(5000);

      app = proxyquire('./app', {
        'http' : this.httpMock,
        './config/db/store' : this.storeMock
      });

      // Need to pause momentarily to let the async function complete
      setTimeout( function () {
        done();
      }, 500);
    });

    it('should start successfully', function () {

      this.storeMock.start.should.have.been.called;
      this.httpMock.createServer.should.have.been.called;
      this.httpMock.serverMock.listen.should.have.been.called;
    });
  });

  describe('#error', function () {

    this.timeout(10000);

    beforeEach(function () {

      this.error = 'test-generated';

      this.logMock = new mocks.LogMock();

      this.originalException = process.listeners('uncaughtException').pop()

      if (this.originalException) {
        process.removeListener('uncaughtException', this.originalException);
      }


    });

    afterEach(function () {
      if (this.originalException) {
        process.listeners('uncaughtException').push(this.originalException);
      }
    });

    it('should not start on db error', function (done) {

      // This error is thrown from first function in async.series(...)
      // As such, it appears the module loading is still in-process
      // and the exception can be caught as if it were synchronous

      this.storeMock.start.callsArgWith(0, {error : 'test-generated'});

      var verify = function () {
        this.storeMock.start.should.have.been.called;
        this.httpMock.createServer.should.have.been.called;
        this.httpMock.serverMock.listen.should.not.have.been.called;
        this.logMock.error.should.have.been.called;
        done();
      }.bind(this);

      // This is just a safeguard in case a race condition
      // causes the exception to be thrown after module
      // loading has completed
      process.once('uncaughtException', verify);

      try {
        app = proxyquire('./app', {
          'http' : this.httpMock,
          './config/db/store' : this.storeMock,
          './config/log' : this.logMock
        });
      } catch(e) {
        verify();
      }

    });


    it('should not start on listen error', function (done) {

      // This error is thrown from a later function in async.series(...)
      // As such, it appears the module loading has completed
      // and the exception cannot be caught from a try/catch

      this.httpMock.serverMock.listen.callsArgWith(2, {error : 'test-generated'});

      var verify = function () {
        this.storeMock.start.should.have.been.called;
        this.httpMock.createServer.should.have.been.called;
        this.httpMock.serverMock.listen.should.have.been.called;
        this.logMock.error.should.have.been.called;
        done();
      }.bind(this);

      process.once('uncaughtException', verify);

      try {
        app = proxyquire('./app', {
          'http' : this.httpMock,
          './config/db/store' : this.storeMock,
          './config/log' : this.logMock
        });
      } catch(e) {
        // This is just a safeguard in case a race condition
        // causes the exception to be thrown as part of
        // module loading
        verify();
      }

    });
  });

});
