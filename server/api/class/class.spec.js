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
var proxyquire = require('proxyquire');
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

// local dependencies
var nlccreds = require('../../config/nlc');

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

var storeMock = new mocks.StoreMock();
storeMock['@global'] = true;

var app = proxyquire('../../app', {
  './config/db/store' : storeMock,
  '../../config/db/store' : storeMock,
  'watson-developer-cloud' : new mocks.WDCMock()
});

describe('/server/api/class', function () {

  var TENANT = 'nlc-test';
  var ENDPOINTBASE = '/api/' + TENANT + '/classes';

  var error = {
    error : 'test-generated',
    statusCode : httpstatus.NOT_FOUND
  };

  this.timeout(5000);

  before(function (done) {
    request(app)
      .post('/api/authenticate')
      .send({username : nlccreds.username, password : nlccreds.password})
      .expect(httpstatus.OK)
      .end(function (err, res) {
      this.sessionCookie = res.headers['set-cookie'][0];
      done(err);
    }.bind(this));
  });

  beforeEach(function () {
    storeMock.reset();
  });

  describe('/:tenantid/classes', function () {

    describe('POST', function () {

      it('should fail if no request body specified', function (done) {
        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should pass back error from cloudant', function (done) {
        storeMock.createClass.callsArgWith(2, error);

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .send({ name : 'test-1' })
          .expect('Content-Type', /json/)
          .expect(httpstatus.NOT_FOUND)
          .end(function (err, resp) {
            storeMock.createClass.should.have.been.called;
            done(err);
          });
      });

      it('should create class without error', function (done) {
        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .send({ name : 'test-1' })
          .expect(httpstatus.CREATED)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.have.deep.property('headers.location').that.contains(ENDPOINTBASE);
            storeMock.createClass.should.have.been.called;
            done(err);
          });
      });

      it('should return information about created class', function (done) {
        var classRequest = { name : 'test-2', description : 'testing' };

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .send(classRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.have.deep.property('body.id');
            storeMock.createClass.should.have.been.called;
            done(err);
          });
      });

      it('should hide internal implementation details', function (done) {
        var classRequest = { name : 'test-3' };

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .send(classRequest)
          .expect(httpstatus.CREATED)
          .expect('Content-Type', /json/)
          .end(function (err, resp) {
            resp.should.have.property('body');
            resp.should.not.have.deep.property('body._id');
            resp.should.not.have.deep.property('body._rev');
            storeMock.createClass.should.have.been.called;
            done(err);
          });
      });

    });

    describe('GET', function () {

      it('should pass back error from cloudant', function (done) {
        storeMock.countClasses.callsArgWith(1, error);

        request(app)
          .get(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .expect('Content-Type', /json/)
          .expect(httpstatus.NOT_FOUND)
          .end(function (err, resp) {
            storeMock.getClasses.should.have.been.calledWith(TENANT, sinon.match.object, sinon.match.func);
            storeMock.countClasses.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          });
      });

      it('should fetch classes without error', function (done) {
        request(app)
          .get(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .expect('Content-Type', /json/)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            storeMock.getClasses.should.have.been.calledWith(TENANT, sinon.match.object, sinon.match.func);
            storeMock.countClasses.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          });
      });

      it('should fetch results based on custom parameters', function (done) {
        var fields = [ 'id', 'name' ];
        request(app)
          .get(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .expect('Content-Type', /json/)
          .set('Range', 'items=2-7')
          .query({ fields : fields.join(',') })
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            storeMock.getClasses.should.have.been.calledWith(TENANT,
               sinon.match({skip : 2, limit : 6, fields : ['_id', 'name']}),
               sinon.match.func);
            storeMock.countClasses.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          });
      });

    });

  });

  describe('/classes/:classid', function () {

    var VALID_ID = 'abc-123';

    var VALID_LOCATION = ENDPOINTBASE + '/' + VALID_ID;
    var INVALID_LOCATION = ENDPOINTBASE + '/XXXXXX';

    describe('GET', function () {

      it('should fail to return non-existent class', function (done) {

        storeMock.getClass.callsArgWith(2, error);

        request(app)
          .get(INVALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should fetch created class', function (done) {

        request(app)
          .get(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            storeMock.getClass.should.have.been.calledWith(TENANT, VALID_ID, sinon.match.func);
            done(err);
          });
      });

    });

    describe('PUT', function () {

      it('should fail if no request body specified', function (done) {
        request(app)
          .put(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', 'doesntmatter')
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should fail to replace unknown class', function (done) {
        storeMock.replaceClass.callsArgWith(3, error);

        request(app)
          .put(INVALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', 'doesntmatter')
          .send({name : 'updated'})
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should require an etag', function (done) {
        request(app)
          .put(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .send({name : 'updated'})
          .expect(httpstatus.PRECONDITION_FAILED)
          .end(function (err) {
            storeMock.replaceClass.should.not.have.been.called;
            done(err);
          });
      });

      it('should fail when id in body does not match request', function (done) {

        var replacement = { id : uuid.v1(), name : uuid.v1(), description : uuid.v1() };

        request(app)
          .put(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', '*')
          .send(replacement)
          .expect(httpstatus.BAD_REQUEST)
          .end(function (err) {
            storeMock.replaceClass.should.not.have.been.called;
            done(err);
          });

      });

      it('should successfully replace class without providing id in request body', function (done) {

        var replacement = { name : uuid.v1(), description : uuid.v1() };

        request(app)
          .put(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', uuid.v1())
          .send(replacement)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            storeMock.replaceClass.should.have.been.called;
            done(err);
          });

      });

      it('should successfully replace class when providing valid id in request body', function (done) {

        var replacement = { id : VALID_ID, name : uuid.v1(), description : uuid.v1() };

        request(app)
          .put(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', uuid.v1())
          .send(replacement)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            storeMock.replaceClass.should.have.been.called;
            done(err);
          });

      });

      it('should successfully replace class when using If-Match wildcard', function (done) {

        var replacement = { name : uuid.v1(), description : uuid.v1() };

            request(app)
              .put(VALID_LOCATION)
              .set('Cookie', [this.sessionCookie])
              .set('If-Match', '*')
              .send(replacement)
              .expect(httpstatus.OK)
              .end(function (err, resp) {
                resp.should.have.property('body');
                storeMock.replaceClass.should.have.been.called;
                done(err);
              });

      });

    });

    describe('DELETE', function () {

      it('should fail to delete unknown class', function (done) {
        storeMock.deleteClass.callsArgWith(3, error);

        request(app)
          .del(INVALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', 'doesntmatter')
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should require an etag', function (done) {

        request(app)
          .del(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.PRECONDITION_FAILED)
          .end(function (err) {
            storeMock.deleteClass.should.not.have.been.called;
            done(err);
          });
      });

      it('should successfully delete class', function (done) {
        var etag = uuid.v1();
        request(app)
          .del(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .set('If-Match', etag)
          .expect(httpstatus.NO_CONTENT)
          .end(function (err) {
            storeMock.deleteClass.should.have.been.calledWith(TENANT, VALID_ID, etag, sinon.match.func);
            done(err);
          });
      });

    });

  });

});
