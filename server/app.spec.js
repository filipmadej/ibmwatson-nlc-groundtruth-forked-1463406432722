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

  describe('#success', function () {
    beforeEach(function (done) {
      this.timeout(5000);

      this.httpMock = new mocks.HttpMock();
      this.storeMock = new mocks.StoreMock();

      app = proxyquire('./app', {
        'http' : this.httpMock,
        './config/db/store' : this.storeMock
      });

      // Need to pause momentarily to let the async function complete
      setTimeout( function () {
        done();
      }.bind(this), 500);
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

      this.httpMock = new mocks.HttpMock();
      this.storeMock = new mocks.StoreMock();
      this.logMock = new mocks.LogMock();

      this.originalException = process.listeners('uncaughtException').pop()

      process.removeListener('uncaughtException', this.originalException);


    });

    afterEach(function () {
      process.listeners('uncaughtException').push(this.originalException)
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
