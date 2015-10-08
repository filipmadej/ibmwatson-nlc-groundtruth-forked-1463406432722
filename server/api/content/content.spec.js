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
var express = require('express');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

describe('/server/api/content', function () {

  var TENANT = 'test-tenant';
  var ENDPOINTBASE = '/api/' + TENANT + '/content';

  this.timeout(5000);

  before(function () {

    this.error = {
      error : 'test-generated',
      statusCode : httpstatus.INTERNAL_SERVER_ERROR
    };

  });

  beforeEach(function () {

    this.storeMock = new mocks.StoreMock();
    this.socketMock = new mocks.SocketIoMock();
    this.logMock = new mocks.LogMock();

    this.asyncLib = {
        queue : sinon.stub()
    };

    this.queueMock = {
      push : sinon.stub()
    };

    this.queueMock.push.callsArgWith(1, null, {});

    this.asyncLib.queue.returns(this.queueMock);

    this.controllerOverrides = {
      'async' : this.asyncLib,
      '../../config/db/store' : this.storeMock,
      '../../config/socket' : this.socketMock
    };

    this.controller = proxyquire('./content.controller', this.controllerOverrides);

    this.restMock = {
      ensureAuthenticated : function (req, res, next) {
        next();
      }
    }

    this.app = express();

    this.appOverrides = {
      './content.controller' : this.controller,
      '../../config/rest' : this.restMock
    }

    this.app.use('/api', proxyquire('./index', this.appOverrides));
  });

  describe('GET /api/:tenantid/content', function () {

    it('should return a 200 response', function (done) {
      request(this.app)
        .get(ENDPOINTBASE)
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          resp.should.have.deep.property('body.texts');
          resp.should.have.deep.property('body.classes');
          done(err);
        });
    });

    it('should pass back a cloudant error', function (done) {
      this.storeMock.getTexts.callsArgWith(2, this.error);

      request(this.app)
        .get(ENDPOINTBASE)
        .expect(httpstatus.INTERNAL_SERVER_ERROR, done);
    });

  });

  describe('POST /api/:tenantid/content', function () {

    before( function () {
      this.jsonfile = __dirname + '/../../test/data/upload.json';
      this.csvfile = __dirname + '/../../test/data/upload.csv';
      this.txtfile = __dirname + '/../../test/data/upload.txt';
      this.data = require(this.jsonfile).training_data;

      this.processedClasses = [{id : uuid.v1(), name : uuid.v1(), created : true}];

      this.processedEntry = {
        classes : this.processedClasses,
        text : {id : uuid.v1(), value : uuid.v1(), created : true, classes : this.processedClasses}
      };
    });

    it('should return a 202 response for valid json', function (done) {
      request(this.app)
        .post(ENDPOINTBASE)
        .attach('file', this.jsonfile)
        .expect(httpstatus.ACCEPTED)
        .end(function (err, resp) {
          done(err);
        });
    });

    it('should return a 202 response for valid csv', function (done) {
      request(this.app)
        .post(ENDPOINTBASE)
        .attach('file', this.csvfile)
        .expect(httpstatus.ACCEPTED)
        .end(function (err, resp) {
          done(err);
        });
    });

    it('should error if files attribute not found on req', function (done) {

      var errorController = proxyquire('./content.controller', this.controllerOverrides);

      var multerMock = sinon.stub();
      multerMock.returns(function (req, res, next) {
        next();
      });

      var errorApp = express();
      var errorAppOverrides = this.appOverrides;
      errorAppOverrides.multer = multerMock;
      errorApp.use('/api', proxyquire('./index', errorAppOverrides));

      request(errorApp)
        .post(ENDPOINTBASE)
        .attach('file', this.jsonfile)
        .expect(httpstatus.INTERNAL_SERVER_ERROR, done);
    });

    it('should error if file not uploaded', function (done) {

      request(this.app)
        .post(ENDPOINTBASE)
        .send({})
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          done(err);
        });
    });

    it('should error if file not json or csv', function (done) {

      request(this.app)
        .post(ENDPOINTBASE)
        .attach('file', this.txtfile)
        .expect(httpstatus.BAD_REQUEST, done);
    });

    describe('csv #transform()', function () {

      beforeEach(function (done) {

        this.fsMock = {
          readFile : sinon.stub()
        };
        this.fsMock.readFile.callsArgWith(2, null, 'text1,class1');

        this.csvMock = {
          fromString : sinon.stub(),
          transform : sinon.stub(),
          on : sinon.stub()
        };

        this.csvMock.fromString.returns(this.csvMock);
        this.csvMock.transform.returns(this.csvMock);
        this.csvMock.on.returns(this.csvMock);

        this.csvControllerOverrides = this.controllerOverrides;
        this.csvControllerOverrides.fs = this.fsMock;
        this.csvControllerOverrides['fast-csv'] = this.csvMock;
        delete this.csvControllerOverrides.async;

        this.csvController = proxyquire('./content.controller', this.csvControllerOverrides);

        this.csvApp = express();
        this.csvAppOverrides = this.appOverrides;
        this.csvAppOverrides['./content.controller'] = this.csvController;
        this.csvApp.use('/api', proxyquire('./index', this.csvAppOverrides));

        async.waterfall([
          function (next) {
            request(this.csvApp)
              .post(ENDPOINTBASE)
              .attach('file', this.csvfile)
              .expect(httpstatus.ACCEPTED)
              .end(function (err, resp) {
                next(err, resp.headers.location);
              });
          }.bind(this),
          function (location, next) {
            var result = {};
            async.until(
              function () {
                return this.csvMock.transform.callCount > 0;
              }.bind(this),
              function (callback) {
                setTimeout(function () {
                  callback()
                }, 250);
              }.bind(this),
              function (err) {
                next(err);
              }
            );
          }.bind(this)
        ], function (err) {
            this.csvMock.fromString.should.have.been.called;
            this.csvMock.transform.should.have.been.called;
            this.transformFn = this.csvMock.transform.lastCall.args[0];
            should.exist(this.transformFn);
            done(err);
        }.bind(this));

      });

      it('should successfully process line', function () {
        var data = ['text', 'class'];
        var result = this.transformFn(data.slice(0));
        result.should.have.property('text', data[0]);
        result.should.have.property('classes').that.deep.equals([data[1]]);
      });

      it('should ignore empty strings', function () {
        var data = ['text', 'class', '', ''];
        var result = this.transformFn(data.slice(0));
        result.should.have.property('text', data[0]);
        result.should.have.property('classes').that.deep.equals([data[1]]);
      });
    });

    describe('#processFileContent()', function () {

      beforeEach(function () {

        this.processControllerOverrides = this.controllerOverrides;
        delete this.processControllerOverrides.async;

        this.processController = proxyquire('./content.controller', this.processControllerOverrides);

        this.processApp = express();
        this.processAppOverrides = this.appOverrides;
        this.processAppOverrides['./content.controller'] = this.processController;
        this.processApp.use('/api', proxyquire('./index', this.processAppOverrides));
        this.processApp.use('/api', proxyquire('../job', {
          '../../config/rest' : this.restMock
        }));

      });

      function processTestRunner (app, expectedStatus, verifyFn, callback) {
        async.waterfall([
          function (next) {
            request(app)
              .post(ENDPOINTBASE)
              .attach('file', this.jsonfile)
              .expect(httpstatus.ACCEPTED)
              .end(function (err, resp) {
                next(err, resp.headers.location);
              });
          }.bind(this),
          function (location, next) {
            var result = {};

            async.until(
              function () {
                return result.status === expectedStatus;
              }.bind(this),
              function (callback) {
                request(app)
                  .get(location)
                  .expect(httpstatus.OK)
                  .end(function (err, resp) {
                    result = resp.body;
                    callback(err)
                  });
              }.bind(this),
              function (err) {
                next(err, result);
              }
            );
          }.bind(this),
          function (result, next) {
            result.should.have.property('status', expectedStatus);
            verifyFn.call(this, result)
            next();
          }.bind(this)
        ], callback);
      }

      it('should successfully process newly created text', function (done) {

        this.storeMock.processImportEntry.callsArgWith(2, null, this.processedEntry);

        var verify = function (result) {
          result.should.have.property('success', this.data.length);
          result.should.have.property('error', 0);

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });

      it('should successfully process existing text', function (done) {

        this.processedExistingEntry = {
          classes : this.processedClasses,
          text : {id : uuid.v1(), value : uuid.v1()}
        };

        this.storeMock.processImportEntry.callsArgWith(2, null, this.processedExistingEntry);

        var verify = function (result) {
          result.should.have.property('success', this.data.length);
          result.should.have.property('error', 0);

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });


      it('should handle no classes on existing text', function (done) {

        this.processedNoClassEntry = {
          classes : [],
          text : {id : uuid.v1(), value : uuid.v1()}
        };

        this.storeMock.processImportEntry.callsArgWith(2, null, this.processedNoClassEntry);

        var verify = function (result) {
          result.should.have.property('success', this.data.length);
          result.should.have.property('error', 0);

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });

      it('should process all data even if processing error occurs', function (done) {

        this.storeMock.processImportEntry.callsArgWith(2, this.error);

        var verify = function (result) {
          result.should.have.property('success', 0);
          result.should.have.property('error', this.data.length);

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });

    it('should set status to error if unable to read file', function (done) {

      var fsMock = {
        readFile : sinon.stub()
      };

      var readError = {message : 'test - unable to read file'}

      fsMock.readFile.callsArgWith(2, readError);

      var errorControllerOverrides = this.controllerOverrides;
      errorControllerOverrides.fs = fsMock;


      var errorController = proxyquire('./content.controller', errorControllerOverrides);

      var errorApp = express();
      var errorAppOverrides = this.appOverrides;
      errorAppOverrides['./content.controller'] = errorController;
      errorApp.use('/api', proxyquire('./index', errorAppOverrides));
      errorApp.use('/api', proxyquire('../job', {
        '../../config/rest' : this.restMock
      }));

      processTestRunner.call(this, errorApp, 'error', function () {}, done);

    });

      it('should set status to error on unhandled error', function (done) {

        var asyncMock = {
          forEachSeries : sinon.stub()
        };

        asyncMock.forEachSeries.callsArgWith(2, this.error);

        var errorControllerOverrides = this.controllerOverrides;
        errorControllerOverrides.async = asyncMock;

        var  errorController = proxyquire('./content.controller', errorControllerOverrides);

        var errorApp = express();
        var errorAppOverrides = this.appOverrides;
        errorAppOverrides['./content.controller'] = errorController;
        errorApp.use('/api', proxyquire('./index', errorAppOverrides));
        errorApp.use('/api', proxyquire('../job', {
          '../../config/rest' : this.restMock
        }));

        this.storeMock.processImportEntry.callsArgWith(2, this.error);

        processTestRunner.call(this, errorApp, 'error', function () {}, done);

      });

      it('should handle error as top-level attribute on result', function (done) {

        this.processedErrorEntry = {
          error : this.error
        };

        this.storeMock.processImportEntry.callsArgWith(2, null, this.processedErrorEntry);

        var verify = function (result) {
          result.should.have.property('success', 0);
          result.should.have.property('error', this.data.length);

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });

      it('should only count 1 error per entry', function (done) {

        this.processedErrorClasses = [{id : uuid.v1(), name : uuid.v1(), created : true, error : this.error},
                                     {id : uuid.v1(), name : uuid.v1(), created : true, error : this.error},
                                      {id : uuid.v1(), name : uuid.v1(), created : true, error : this.error}];

        this.processedErrorEntry = {
          classes : this.processedErrorClasses,
          text : {id : uuid.v1(), value : uuid.v1(), classes : this.processedErrorClasses}
        };

        this.storeMock.processImportEntry.onCall(0).callsArgWith(2, null, this.processedEntry);
        this.storeMock.processImportEntry.callsArgWith(2, null, this.processedErrorEntry);

        var verify = function (result) {
          result.should.have.property('success', 1);
          result.should.have.property('error', (this.data.length - 1));

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });

      it('should handle error on created text', function (done) {

        this.processedErrorEntry = {
          classes : this.processedClasses,
          text : {id : uuid.v1(), value : uuid.v1(), created : true, classes : this.processedClasses, error : this.error}
        };

        this.storeMock.processImportEntry.onCall(0).callsArgWith(2, null, this.processedEntry);
        this.storeMock.processImportEntry.callsArgWith(2, null, this.processedErrorEntry);

        var verify = function (result) {
          result.should.have.property('success', 1);
          result.should.have.property('error', (this.data.length - 1));

          this.storeMock.processImportEntry.callCount.should.equal(this.data.length);
        };

        processTestRunner.call(this, this.processApp, 'complete', verify, done);

      });

    });

  });

});
