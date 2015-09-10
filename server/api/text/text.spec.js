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
var _ = require('lodash');
var async = require('async');
var bodyParser = require('body-parser');
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

describe('/server/api/text', function () {

  var TENANT = 'nlc-test';
  var ENDPOINTBASE = '/api/' + TENANT + '/texts';

  this.timeout(5000);

  before(function () {

    this.error = {
      error : 'test-generated',
      statusCode : httpstatus.INTERNAL_SERVER_ERROR
    };

  });

  this.timeout(5000);

  beforeEach(function () {

    this.storeMock = new mocks.StoreMock();
    this.socketMock = new mocks.SocketUtilMock();
    this.cacheMock = new mocks.CacheMock();
    this.logMock = new mocks.LogMock();

    this.controllerOverrides = {
      '../../config/db/store' : this.storeMock,
      '../../config/socket' : this.socketMock,
      '../job/cache' : this.cacheMock
    };

    this.controller = proxyquire('./text.controller', this.controllerOverrides);

    this.restMock = {
      ensureAuthenticated : function (req, res, next) {
        next();
      }
    }

    this.app = express();

    this.appOverrides = {
      './text.controller' : this.controller,
      '../../config/rest' : this.restMock
    }

    this.app.use(bodyParser.json());
    this.app.use('/api', proxyquire('./index', this.appOverrides));

    this.agent = request.agent(this.app);

  });


  describe('/:tenantid/texts', function () {

    describe('POST', function () {

      it('should fail if no request body specified', function (done) {
        this.agent
          .post(ENDPOINTBASE)
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should pass back error from cloudant', function (done) {
        this.storeMock.createText.callsArgWith(2, this.error);

        this.agent
          .post(ENDPOINTBASE)
          .send({ value : 'test-1' })
          .expect('Content-Type', /json/)
          .expect(this.error.statusCode)
          .end(function (err, resp) {
            this.storeMock.createText.should.have.been.called;
            this.socketMock.send.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should create text without error', function (done) {
        this.agent
          .post(ENDPOINTBASE)
          .send({ value : 'test-1' })
          .expect(httpstatus.CREATED)
          .end(function (err, resp) {
            this.storeMock.createText.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should return information about created text', function (done) {
        var textRequest = { value : 'test-2' };

        this.agent
          .post(ENDPOINTBASE)
          .send(textRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.have.deep.property('body.id');
            resp.should.have.deep.property('headers.etag');
            resp.should.have.deep.property('headers.location').that.contains(ENDPOINTBASE);
            done(err);
          });
      });

      it('should hide internal implementation details', function (done) {
        var textRequest = { value : 'test-3' };

        this.agent
          .post(ENDPOINTBASE)
          .send(textRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.not.have.deep.property('body._id');
            resp.should.not.have.deep.property('body._rev');
            done(err);
          });
      });

      it('should persist optional classes attribute', function (done) {
        var textRequest = { value : 'test-4', classes : ['class1'] };

        this.agent
          .post(ENDPOINTBASE)
          .send(textRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            done(err);
          });
      });

    });

    describe('GET', function () {

      it('should pass back error from cloudant', function (done) {
        this.storeMock.countTexts.callsArgWith(1, this.error);

        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .expect(this.error.statusCode)
          .end(function (err, resp) {
            this.storeMock.getTexts.should.have.been.calledWith(TENANT, sinon.match.object, sinon.match.func);
            this.storeMock.countTexts.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

      it('should fetch texts without error', function (done) {
        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.getTexts.should.have.been.calledWith(TENANT,
                                                                sinon.match.object,
                                                                sinon.match.func);
            this.storeMock.countTexts.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

      it('should fetch results based on custom parameters', function (done) {
        var fields = [ 'id', 'value' ];

        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .set('Range', 'items=2-7')
          .query({ fields : fields.join(',') })
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.getTexts.should.have.been.calledWith(TENANT,
                                                                sinon.match({skip : 2, limit : 6, fields : ['_id', 'value']}),
                                                                sinon.match.func);
            this.storeMock.countTexts.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

    });

    describe('DELETE', function () {

      function deleteTestRunner (app, body, expectedStatus, verifyFn, callback) {
        async.waterfall([
          function (next) {
            request(app)
              .delete(ENDPOINTBASE)
              .send(body)
              .expect(httpstatus.ACCEPTED)
              .end(function (err, resp) {
                next(err, resp.headers.location);
              });
          }.bind(this),
          function (location, next) {
            var result = {};
            var jobid = location.substr(location.lastIndexOf('/') + 1);
            async.until(
              function () {
                var status;
                if (this.cacheMock.put.lastCall) {
                  status = this.cacheMock.put.lastCall.args[1].status;
                }

                return status === expectedStatus;
              }.bind(this),
              function (nexttry) {
                setTimeout(function () {
                  nexttry();
                }, 250);
              }.bind(this),
              next
            );
          }.bind(this),
          function (next) {
            var result = this.cacheMock.put.lastCall.args[1];
            result.should.have.property('status', expectedStatus);
            verifyFn.call(this, result)
            next();
          }.bind(this)
        ], callback);

      }

      beforeEach(function () {
        this.ids = [uuid.v1(), uuid.v1()];
      });

      it('should fail if no request body specified', function (done) {
        this.agent
          .delete(ENDPOINTBASE)
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should fail if empty array specified', function (done) {
        this.agent
          .delete(ENDPOINTBASE)
          .send([])
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should delete texts', function (done) {
          var verify = function (result) {
            result.should.have.property('error', 0);
            result.should.have.property('success', 2);
          };

          deleteTestRunner.call(this, this.app, this.ids, 'complete', verify, done);
      });

      it('should handle when some deletes fail', function (done) {
        this.storeMock.deleteText.onCall(0).callsArgWith(3,this.error);
        this.storeMock.deleteText.callsArgWith(3, null, {});

        var verify = function (result) {
          result.should.have.property('error', 1);
          result.should.have.property('success', 1);
        };

        deleteTestRunner.call(this, this.app, this.ids, 'complete', verify, done);
      });

    });

  });

  describe('/texts/:textid', function () {

    var VALID_ID = 'abc-123';

    var VALID_LOCATION = ENDPOINTBASE + '/' + VALID_ID;
    var INVALID_LOCATION = ENDPOINTBASE + '/XXXXXX';

    before (function () {
      this.notfound = {
        error : 'test-generated',
        statusCode : httpstatus.NOT_FOUND
      };
    });

    describe('GET', function () {

      it('should fail to return non-existent text', function (done) {
        this.storeMock.getText.callsArgWith(2, this.notfound);

        this.agent
          .get(INVALID_LOCATION)
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should fetch created text', function (done) {

        this.agent
          .get(VALID_LOCATION)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
          resp.should.have.property('body');
          this.storeMock.getText.should.have.been.calledWith(TENANT, VALID_ID, sinon.match.func);
          done(err);
        }.bind(this));
      });

    });

    describe('PATCH', function () {

      function patchTestRunner (app, op, expectedStatus, verifyFn, callback) {
        async.waterfall([
          function (next) {
            request(app)
              .patch(VALID_LOCATION)
              .send(op)
              .expect(httpstatus.ACCEPTED)
              .end(function (err, resp) {
                next(err, resp.headers.location);
              });
          }.bind(this),
          function (location, next) {
            var result = {};
            var jobid = location.substr(location.lastIndexOf('/') + 1);
            async.until(
              function () {
                var status;
                if (this.cacheMock.put.lastCall) {
                  status = this.cacheMock.put.lastCall.args[1].status;
                }

                return status === expectedStatus;
              }.bind(this),
              function (nexttry) {
                setTimeout(function () {
                  nexttry();
                }, 250);
              }.bind(this),
              next
            );
          }.bind(this),
          function (next) {
            var result = this.cacheMock.put.lastCall.args[1];
            result.should.have.property('status', expectedStatus);
            verifyFn.call(this, result)
            next();
          }.bind(this)
        ], callback);
      }

      it('should reject unsupported operations', function (done) {

        var invalidOps = [
          {},
          { op : 'jiggle' },
          { op : 'jiggle', path : '/classes' },
          { op : 'add' },
          { op : 'add', path : 'flip' },
          { op : 'jiggle', path : '/metadata' },
        ];

        async.each(invalidOps,
                   function (op, next) {

          var verify = function (result) {
            result.should.have.property('error', 1);
            result.should.have.property('success', 0);
          };

          patchTestRunner.call(this, this.app, op, 'complete', verify, next);
        }.bind(this), done);
      });

      it('should error if class is invalid', function (done) {

        var invalidRequests = [
          {
            op : 'add',
            path : '/classes',
            value : [
              {}
            ]
          },
          {
            op : 'add',
            path : '/classes',
            value : [
              { id : undefined }
            ]
          },
          {
            op : 'remove',
            path : '/classes',
            value : [
              {}
            ]
          },
          {
            op : 'remove',
            path : '/classes',
            value : [
              { id : undefined }
            ]
          }
        ];

        async.each(invalidRequests,
                   function (req, next) {

          var verify = function (result) {
            this.storeMock.addClassesToText.should.not.have.been.called;
            this.storeMock.removeClassesFromText.should.not.have.been.called;

            result.should.have.property('error', 1);
            result.should.have.property('success', 0);
          };

          patchTestRunner.call(this, this.app, req, 'complete', verify, next);
        }.bind(this), done);

      });

      it('should modify classes in a text', function (done) {

        var classesToAdd = [
          { id : uuid.v1() },
          { id : uuid.v1() },
          { id : uuid.v1() }
        ];

        var classesToRemove = [
          classesToAdd[0],
          classesToAdd[1]
        ];

        var addHandlerResult = {
          operation : {
            path : 'classes',
            op : 'add'
          },
          id : VALID_ID,
          classes : classesToAdd.map(function extractId (elem) { return elem.id })
        };

        var removeHandlerResult = {
          operation : {
            path : 'classes',
            op : 'remove'
          },
          id : VALID_ID,
          classes : classesToRemove.map(function extractId (elem) { return elem.id })
        };

        this.storeMock.addClassesToText.callsArgWith(3, null, addHandlerResult);
        this.storeMock.removeClassesFromText.callsArgWith(3, null, removeHandlerResult);

        async.series([
          function addClassesToText (next) {
            var patch = [
              {
                op : 'add',
                path : '/classes',
                value : classesToAdd
              }
            ];

            var verify = function (result) {
              this.storeMock.addClassesToText.should.have.been.calledWith(TENANT,
                VALID_ID,
                [patch[0].value[0].id, patch[0].value[1].id, patch[0].value[2].id],
                sinon.match.func);

              result.should.have.property('error', 0);
              result.should.have.property('success', 1);
            };

            patchTestRunner.call(this, this.app, patch, 'complete', verify, next);
          }.bind(this),
          function removeClassesFromText (next) {
            var patch = [
              {
                op : 'remove',
                path : '/classes',
                value : classesToRemove
              }
            ];

            var verify = function (result) {
              this.storeMock.removeClassesFromText.should.have.been.calledWith(TENANT,
                VALID_ID,
                [patch[0].value[0].id, patch[0].value[1].id],
                sinon.match.func);

              result.should.have.property('error', 0);
              result.should.have.property('success', 1);
            };

            patchTestRunner.call(this, this.app, patch, 'complete', verify, next);
          }.bind(this),
          function changeClassesInText (next) {

            var changeAdd = [
              { id : uuid.v1() },
              { id : uuid.v1() }
            ];

            var changeRemove = [
              { id : uuid.v1() },
            ];

            var changeAddHandlerResult = {
              operation : {
                path : 'classes',
                op : 'add'
              },
              id : VALID_ID,
              classes : changeAdd.map(function extractId (elem) { return elem.id })
            };

            var changeRemoveHandlerResult = {
              operation : {
                path : 'classes',
                op : 'remove'
              },
              id : VALID_ID,
              classes : changeRemove.map(function extractId (elem) { return elem.id })
            };

            this.storeMock.addClassesToText.callsArgWith(3, null, changeAddHandlerResult);
            this.storeMock.removeClassesFromText.callsArgWith(3, null, changeRemoveHandlerResult);

            var patch = [
              {
                op : 'remove',
                path : '/classes',
                value : changeRemove
              },
              {
                op : 'add',
                path : '/classes',
                value : changeAdd
              }
            ];
            var verify = function (result) {
              this.storeMock.addClassesToText.should.have.been.calledWith(TENANT,
                VALID_ID,
                [patch[1].value[0].id, patch[1].value[1].id],
                sinon.match.func);
              this.storeMock.removeClassesFromText.should.have.been.calledWith(TENANT,
                VALID_ID,
                [patch[0].value[0].id],
                sinon.match.func);

              result.should.have.property('error', 0);
              result.should.have.property('success', 2);
            };

            patchTestRunner.call(this, this.app, patch, 'complete', verify, next);
          }.bind(this)
        ], done);
      });

      it('should error if metadata is invalid', function (done) {

        var invalidRequests = [
          {
            op : 'replace',
            path : '/metadata',
            value : [
              {}
            ]
          },
          {
            op : 'replace',
            path : '/metadata',
            value : [
              { id : undefined }
            ]
          },
          {
            op : 'replace',
            path : '/metadata',
            value : [
              { foo : 'value', bar : 'unsupported' }
            ]
          }
        ];

        async.each(invalidRequests,
                   function (req, next) {

          var verify = function (result) {
            this.storeMock.updateTextMetadata.should.not.have.been.called;

            result.should.have.property('error', 1);
            result.should.have.property('success', 0);
          };

          patchTestRunner.call(this, this.app, req, 'complete', verify, next);
        }.bind(this), done);
      });

      it('should modify metadata of a text', function (done) {

        var metadata = { foo : 'bar' };

        var metadataHandlerResult = {
          operation : {
            path : 'metadata',
            op : 'replace'
          },
          id : VALID_ID,
          metadata : metadata
        };

        this.storeMock.updateTextMetadata.callsArgWith(3, null, metadataHandlerResult);

        var patch = [
          {
            op : 'replace',
            path : '/metadata',
            value : {
              value : uuid.v1(),
              metadata : metadata
            }

          }
        ];

        var verify = function (result) {
          this.storeMock.updateTextMetadata.should.have.been.calledWith(TENANT,
            VALID_ID,
            sinon.match(patch[0].value),
            sinon.match.func);

          result.should.have.property('error', 0);
          result.should.have.property('success', 1);
        };

        patchTestRunner.call(this, this.app, patch, 'complete', verify, done);

      });

    });

    describe('DELETE', function () {

      before (function () {
        this.notfound = {
          error : 'test-generated',
          statusCode : httpstatus.NOT_FOUND
        };
      });

      it('should fail to delete unknown text', function (done) {
        this.storeMock.deleteText.callsArgWith(3, this.notfound);

        this.agent
          .del(INVALID_LOCATION)
          .set('If-Match', 'doesntmatter')
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should require an etag', function (done) {

        this.agent
          .del(VALID_LOCATION)
          .expect(httpstatus.PRECONDITION_FAILED)
          .end(function (err) {
            this.storeMock.deleteText.should.not.have.been.called;
            done(err);
          }.bind(this));

      });

      it('should successfully delete text', function (done) {
        var etag = uuid.v1();

        this.agent
          .del(VALID_LOCATION)
          .set('If-Match', etag)
          .expect(httpstatus.NO_CONTENT)
          .end(function (err) {
          this.storeMock.deleteText.should.have.been.calledWith(TENANT, VALID_ID, etag, sinon.match.func);
          done(err);
        }.bind(this));
      });

    });

  });

});
