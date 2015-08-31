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
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

var app, nlccreds;

var vcapTest = '{\
    "natural_language_classifier": [ \
        { \
        "name": "ibmwatson-nlc-classifier", \
        "label": "natural_language_classifier", \
        "plan": "standard", \
        "credentials": { \
          "url": "https://gateway.watsonplatform.net/natural-language-classifier/api", \
          "username": "85f2085e-9ff4-49b2-9d90-93f68b61b135", \
          "password": "wgGb9arQWnqw" \
        } \
      } \
     ] \
  }';

describe('/server/api/text', function () {

  var TENANT = 'nlc-test';
  var ENDPOINTBASE = '/api/' + TENANT + '/texts';

  var error = {
    error : 'test-generated',
    statusCode : httpstatus.NOT_FOUND
  };

  this.timeout(5000);

  before(function (done) {

    this.originalVcapServices = process.env.VCAP_SERVICES;

    process.env.VCAP_SERVICES = vcapTest;


    this.storeMock = new mocks.StoreMock();
    this.storeMock['@global'] = true;

    this.socketMock = new mocks.SocketUtilMock();
    this.socketMock['@global'] = true;

    nlccreds = proxyquire('../../config/nlc',{});

    app = proxyquire('../../app', {
      './config/db/store' : this.storeMock,
      '../../config/db/store' : this.storeMock,
      './config/socket' : this.socketMock,
      '../../config/socket' : this.socketMock,
      'watson-developer-cloud' : new mocks.WDCMock(),
    });

    request(app)
      .post('/api/authenticate')
      .send({username : nlccreds.username, password : nlccreds.password})
      .expect(httpstatus.OK)
      .end(function (err, res) {
        this.sessionCookie = res.headers['set-cookie'][0];
        done(err);
      }.bind(this));
  });

  after(function () {
    if (this.originalVcapServices) {
      process.env.VCAP_SERVICES = this.originalVcapServices;
    }
  });

  beforeEach(function () {
    this.storeMock.reset();
    this.socketMock.reset();
  });

  describe('/:tenantid/texts', function () {

   describe('POST', function () {

      it('should fail if no request body specified', function (done) {
        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.BAD_REQUEST, done);
      });

      it('should pass back error from cloudant', function (done) {
        this.storeMock.createText.callsArgWith(2, error);

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .send({ value : 'test-1' })
          .expect('Content-Type', /json/)
          .expect(httpstatus.NOT_FOUND)
          .end(function (err, resp) {
            this.storeMock.createText.should.have.been.called;
            this.socketMock.send.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should create text without error', function (done) {
        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .send({ value : 'test-1' })
          .expect(httpstatus.CREATED)
          .end(function (err, resp) {
            this.storeMock.createText.should.have.been.called;
            done(err);
          }.bind(this));
      });

      it('should return information about created text', function (done) {
        var textRequest = { value : 'test-2' };

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
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

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
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

        request(app)
          .post(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
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
        this.storeMock.countTexts.callsArgWith(1, error);

        request(app)
          .get(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
          .expect('Content-Type', /json/)
          .expect(httpstatus.NOT_FOUND)
          .end(function (err, resp) {
            this.storeMock.getTexts.should.have.been.calledWith(TENANT, sinon.match.object, sinon.match.func);
            this.storeMock.countTexts.should.have.been.calledWith(TENANT, sinon.match.func);
            done(err);
          }.bind(this));
      });

      it('should fetch texts without error', function (done) {
        request(app)
          .get(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
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
        request(app)
          .get(ENDPOINTBASE)
          .set('Cookie', [this.sessionCookie])
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

  });

 describe('/texts/:textid', function () {

    var VALID_ID = 'abc-123';

    var VALID_LOCATION = ENDPOINTBASE + '/' + VALID_ID;
    var INVALID_LOCATION = ENDPOINTBASE + '/XXXXXX';

    describe('GET', function () {

      it('should fail to return non-existent text', function (done) {
        this.storeMock.getText.callsArgWith(2, error);

        request(app)
          .get(INVALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.NOT_FOUND, done);
      });

      it('should fetch created text', function (done) {

        request(app)
          .get(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.storeMock.getText.should.have.been.calledWith(TENANT, VALID_ID, sinon.match.func);
            done(err);
          }.bind(this));
      });

    });

    describe('PATCH', function () {

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
          request(app)
            .patch(VALID_LOCATION)
            .set('Cookie', [this.sessionCookie])
            .send(op)
            .expect('Content-Type', /json/)
            .expect(httpstatus.UNPROCESSABLE_ENTITY)
            .end(function (err, resp) {
              resp.should.have.deep.property('body.error', 'invalid');
              next(err);
            });
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
          request(app)
            .patch(VALID_LOCATION)
            .set('Cookie', [this.sessionCookie])
            .send(req)
            .expect('Content-Type', /json/)
            .expect(httpstatus.UNPROCESSABLE_ENTITY)
            .end(function (err, resp) {
              resp.should.have.deep.property('body.error', 'invalid');
              this.storeMock.addClassesToText.should.not.have.been.called;
              this.storeMock.removeClassesFromText.should.not.have.been.called;
              next(err);
            }.bind(this));
        }.bind(this), done);
      });

      it('should modify classes in a text', function (done) {
        async.series([
          function addClassesToText (next) {
            var patch = [
              {
                op : 'add',
                path : '/classes',
                value : [
                  { id : uuid.v1() },
                  { id : uuid.v1() },
                  { id : uuid.v1() }
                ]
              }
            ];
            request(app)
              .patch(VALID_LOCATION)
              .set('Cookie', [this.sessionCookie])
              .send(patch)
              .expect(httpstatus.NO_CONTENT)
              .end(function (err) {
                this.storeMock.addClassesToText.should.have.been.calledWith(TENANT, VALID_ID,
                   [patch[0].value[0].id, patch[0].value[1].id, patch[0].value[2].id],
                   sinon.match.func);
                next(err);
              }.bind(this));
          }.bind(this),
          function removeClassesFromText (next) {
            var patch = [
              {
                op : 'remove',
                path : '/classes',
                value : [
                  { id : uuid.v1() },
                  { id : uuid.v1() }
                ]
              }
            ];
            request(app)
              .patch(VALID_LOCATION)
              .set('Cookie', [this.sessionCookie])
              .send(patch)
              .expect(httpstatus.NO_CONTENT)
              .end(function (err) {
                this.storeMock.removeClassesFromText.should.have.been.calledWith(TENANT, VALID_ID,
                   [patch[0].value[0].id, patch[0].value[1].id],
                   sinon.match.func);
                next(err);
              }.bind(this));
          }.bind(this),
          function changeClassesInText (next) {
            var patch = [
              {
                op : 'remove',
                path : '/classes',
                value : [
                  { id : uuid.v1() }
                ]
              },
              {
                op : 'add',
                path : '/classes',
                value : [
                  { id : uuid.v1() },
                  { id : uuid.v1() }
                ]
              }
            ];
            request(app)
              .patch(VALID_LOCATION)
              .set('Cookie', [this.sessionCookie])
              .send(patch)
              .expect(httpstatus.NO_CONTENT)
              .end(function (err) {
                this.storeMock.addClassesToText.should.have.been.calledWith(TENANT, VALID_ID,
                   [patch[1].value[0].id, patch[1].value[1].id],
                   sinon.match.func);
                this.storeMock.removeClassesFromText.should.have.been.calledWith(TENANT, VALID_ID,
                   [patch[0].value[0].id],
                   sinon.match.func);
                next(err);
              }.bind(this));
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
          request(app)
            .patch(VALID_LOCATION)
            .set('Cookie', [this.sessionCookie])
            .send(req)
            .expect('Content-Type', /json/)
            .expect(httpstatus.UNPROCESSABLE_ENTITY)
            .end(function (err, resp) {
              resp.should.have.deep.property('body.error', 'invalid');
              this.storeMock.updateTextMetadata.should.not.have.been.called;
              next(err);
            }.bind(this));
        }.bind(this), done);
      });

      it('should modify metadata of a text', function (done) {
        var patch = [
          {
            op : 'replace',
            path : '/metadata',
            value : {
              value : uuid.v1(),
              metadata : { foo : 'bar' }
            }

          }
        ];
        request(app)
          .patch(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
          .send(patch)
          .expect(httpstatus.NO_CONTENT)
          .end(function (err) {
            this.storeMock.updateTextMetadata.should.have.been.calledWith(TENANT, VALID_ID, sinon.match(patch[0].value), sinon.match.func);
            done(err);
          }.bind(this));
      });

    });

    describe('DELETE', function () {

      it('should fail to delete unknown text', function (done) {
        this.storeMock.deleteText.callsArgWith(3, error);

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
            this.storeMock.deleteText.should.not.have.been.called;
            done(err);
          }.bind(this));

      });

      it('should successfully delete text', function (done) {
        var etag = uuid.v1();
        request(app)
          .del(VALID_LOCATION)
          .set('Cookie', [this.sessionCookie])
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
