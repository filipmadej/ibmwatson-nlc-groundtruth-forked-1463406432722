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

describe('/server/api/class', function () {

   var TENANT = 'nlc-test';
  var ENDPOINTBASE = '/api/' + TENANT + '/classes';

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
    this.logMock = new mocks.LogMock();

    this.controllerOverrides = {
      '../../config/db/store' : this.storeMock,
      '../../config/socket' : this.socketMock,
      '../../config/log' : this.logMock
    };

    this.controller = proxyquire('./class.controller', this.controllerOverrides);

    this.restMock = {
      ensureAuthenticated : function (req, res, next) {
        next();
      }
    }

    this.app = express();

    this.appOverrides = {
      './class.controller' : this.controller,
      '../../config/rest' : this.restMock
    }

    this.app.use(bodyParser.json());
    this.app.use('/api', proxyquire('./index', this.appOverrides));

    this.agent = request.agent(this.app);

  });

  describe('/:tenantid/classes', function () {

    describe('POST', function () {

      it('should fail if no request body specified', function (done) {
        this.agent
          .post(ENDPOINTBASE)
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should pass back error from cloudant', function (done) {
        this.storeMock.createClass.callsArgWith(2, this.error);

        this.agent
          .post(ENDPOINTBASE)
          .send({ name : 'test-1' })
          .expect('Content-Type', /json/)
          .expect(this.error.statusCode)
          .end(function (err, resp) {
            this.storeMock.createClass.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should create class without error', function (done) {
        this.agent
          .post(ENDPOINTBASE)
          .send({ name : 'test-1' })
          .expect(httpstatus.CREATED)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.have.deep.property('headers.location').that.contains(ENDPOINTBASE);
            this.storeMock.createClass.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should return information about created class', function (done) {
        var classRequest = { name : 'test-2', description : 'testing' };

        this.agent
          .post(ENDPOINTBASE)
          .send(classRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.have.deep.property('body.id');
            this.storeMock.createClass.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should hide internal implementation details', function (done) {
        var classRequest = { name : 'test-3' };

        this.agent
          .post(ENDPOINTBASE)
          .send(classRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.not.have.deep.property('body._id');
            resp.should.not.have.deep.property('body._rev');
            this.storeMock.createClass.should.have.been.called;
            done(err);
          }.bind(this));
      });

    });

    describe('GET', function () {

      it('should pass back error from cloudant', function (done) {
        this.storeMock.countClasses.callsArgWith(1, this.error);

        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .expect(this.error.statusCode)
          .end(function (err, resp) {
            this.storeMock.getClasses.should.have.been.calledWith(TENANT, sinon.match.object, sinon.match.func);
            this.storeMock.countClasses.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

      it('should fetch classes without error', function (done) {
        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.getClasses.should.have.been.calledWith(TENANT, sinon.match.object, sinon.match.func);
            this.storeMock.countClasses.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

      it('should fetch results based on custom parameters', function (done) {
        var fields = [ 'id', 'name' ];
        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .set('Range', 'items=2-7')
          .query({ fields : fields.join(',') })
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.getClasses.should.have.been.calledWith(TENANT,
               sinon.match({skip : 2, limit : 6, fields : ['_id', 'name']}),
               sinon.match.func);
            this.storeMock.countClasses.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

    });

  });

  describe('/classes/:classid', function () {

    before (function () {
      this.notfound = {
        error : 'test-generated',
        statusCode : httpstatus.NOT_FOUND
      };
    });

    var VALID_ID = 'abc-123';

    var VALID_LOCATION = ENDPOINTBASE + '/' + VALID_ID;
    var INVALID_LOCATION = ENDPOINTBASE + '/XXXXXX';

    describe('GET', function () {

      it('should fail to return non-existent class', function (done) {

        this.storeMock.getClass.callsArgWith(2, this.notfound);

        this.agent
          .get(INVALID_LOCATION)
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should fetch created class', function (done) {

        this.agent
          .get(VALID_LOCATION)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.getClass.should.have.been.calledWith(TENANT, VALID_ID, sinon.match.func);
            done(err);
          }.bind(this));
      });

    });

    describe('PUT', function () {

      it('should fail if no request body specified', function (done) {
        this.agent
          .put(VALID_LOCATION)
          .set('If-Match', 'doesntmatter')
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should fail to replace unknown class', function (done) {
        this.storeMock.replaceClass.callsArgWith(3, this.notfound);

        this.agent
          .put(INVALID_LOCATION)
          .set('If-Match', 'doesntmatter')
          .send({name : 'updated'})
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should require an etag', function (done) {
        this.agent
          .put(VALID_LOCATION)
          .send({name : 'updated'})
          .expect(httpstatus.PRECONDITION_FAILED)
          .end(function (err) {
            this.storeMock.replaceClass.should.not.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should fail when id in body does not match request', function (done) {

        var replacement = { id : uuid.v1(), name : uuid.v1(), description : uuid.v1() };

        this.agent
          .put(VALID_LOCATION)
          .set('If-Match', '*')
          .send(replacement)
          .expect(httpstatus.BAD_REQUEST)
          .end(function (err) {
            this.storeMock.replaceClass.should.not.have.been.called;
            done(err);
          }.bind(this));

      });

      it('should successfully replace class without providing id in request body', function (done) {

        var replacement = { name : uuid.v1(), description : uuid.v1() };

        this.agent
          .put(VALID_LOCATION)
          .set('If-Match', uuid.v1())
          .send(replacement)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.replaceClass.should.have.been.called;
            done(err);
          }.bind(this));

      });

      it('should successfully replace class when providing valid id in request body', function (done) {

        var replacement = { id : VALID_ID, name : uuid.v1(), description : uuid.v1() };

        this.agent
          .put(VALID_LOCATION)
          .set('If-Match', uuid.v1())
          .send(replacement)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.replaceClass.should.have.been.called;
            done(err);
          }.bind(this));

      });

      it('should successfully replace class when using If-Match wildcard', function (done) {

        var replacement = { name : uuid.v1(), description : uuid.v1() };

            this.agent
              .put(VALID_LOCATION)
              .set('If-Match', '*')
              .send(replacement)
              .expect(httpstatus.OK)
              .end(function (err, resp) {
                resp.should.have.property('body');
                this.storeMock.replaceClass.should.have.been.called;
                done(err);
              }.bind(this));

      });

    });

    describe('DELETE', function () {

      it('should fail to delete unknown class', function (done) {
        this.storeMock.deleteClass.callsArgWith(3, this.notfound);

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
            this.storeMock.deleteClass.should.not.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should successfully delete class', function (done) {
        var etag = uuid.v1();
        this.agent
          .del(VALID_LOCATION)
          .set('If-Match', etag)
          .expect(httpstatus.NO_CONTENT)
          .end(function (err) {
            this.storeMock.deleteClass.should.have.been.calledWith(TENANT, VALID_ID, etag, sinon.match.func);
            done(err);
          }.bind(this));
      });

    });

  });

});
