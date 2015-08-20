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

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

var wdcMock = new mocks.WDCMock();
var nlcMock = wdcMock.nlcMock;

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

describe('/server/api/classifier', function () {

  var TENANT = 'test-tenant';
  var ENDPOINTBASE = '/api/' + TENANT + '/classifiers';
  var CLASSIFIER = 'nlc-test';
  var LOCATION = ENDPOINTBASE + '/' + CLASSIFIER;

  var error = {
    error : 'test-generated',
    code : 400
  };

  this.timeout(5000);

  before(function (done) {

    this.originalVcapServices = process.env.VCAP_SERVICES;

    process.env.VCAP_SERVICES = vcapTest;

    nlccreds = proxyquire('../../config/nlc',{});

    app = proxyquire('../../app', {
      './config/db/store' : new mocks.StoreMock(),
      'watson-developer-cloud' : wdcMock
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
    process.env.VCAP_SERVICES = this.originalVcapServices;
  });

  beforeEach(function () {
    nlcMock.reset();
  });

  describe('GET /api/:tenantid/classifiers', function () {

    it('should return a 200 response', function (done) {
      request(app)
        .get(ENDPOINTBASE)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.list.should.have.been.calledOnce;
          nlcMock.list.should.have.been.calledWith(null, sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.list.callsArgWith(1, error);
      request(app)
        .get(ENDPOINTBASE)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.list.should.have.been.calledOnce;
          nlcMock.list.should.have.been.calledWith(null, sinon.match.func);
          done(err);
        });
    });

  });

  describe('POST /api/:tenantid/classifiers', function () {

    var data = {
      language : 'en',
      name : 'test',
      training_data : []
    };

    it('should return a 200 response', function (done) {
      request(app)
        .post(ENDPOINTBASE)
        .set('Cookie', [this.sessionCookie])
        .send(data)
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.create.should.have.been.calledOnce;
          nlcMock.create.should.have.been.calledWith(sinon.match(data), sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.create.callsArgWith(1, error);
      request(app)
        .post(ENDPOINTBASE)
        .set('Cookie', [this.sessionCookie])
        .send(data)
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.create.should.have.been.calledOnce;
          nlcMock.create.should.have.been.calledWith(sinon.match(data), sinon.match.func);
          done(err);
        });
    });

  });

  describe('GET /api/:tenantid/classifiers/:id', function () {

    it('should return a 200 response', function (done) {
      request(app)
        .get(LOCATION)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.status.should.have.been.calledOnce;
          nlcMock.status.should.have.been.calledWith(sinon.match({classifier : CLASSIFIER}), sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.status.callsArgWith(1, error);
      request(app)
        .get(LOCATION)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.status.should.have.been.calledOnce;
          nlcMock.status.should.have.been.calledWith(sinon.match({classifier : CLASSIFIER}), sinon.match.func);
          done(err);
        });
    });

  });

  describe('DELETE /api/:tenantid/classifiers/:id', function () {

    it('should return a 200 response', function (done) {
      request(app)
        .delete(LOCATION)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.remove.should.have.been.called;
          nlcMock.remove.should.have.been.calledWith(sinon.match({classifier : CLASSIFIER}), sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.remove.callsArgWith(1, error);
      request(app)
        .delete(LOCATION)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.remove.should.have.been.calledOnce;
          nlcMock.remove.should.have.been.calledWith(sinon.match({classifier : CLASSIFIER}), sinon.match.func);
          done(err);
        });
    });

  });

  describe('POST /api/:tenantid/classifiers/:id/classify', function () {

    var body = {text : 'example text'};

    it('should return a 200 response', function (done) {
      request(app)
        .post(LOCATION + '/classify')
        .set('Cookie', [this.sessionCookie])
        .send(body)
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.classify.should.have.been.called;
          nlcMock.classify.should.have.been.calledWith(
            sinon.match({classifier : CLASSIFIER, text : body.text}),
            sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.classify.callsArgWith(1, error);
      request(app)
        .post(LOCATION + '/classify')
        .set('Cookie', [this.sessionCookie])
        .send(body)
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.classify.should.have.been.calledOnce;
          nlcMock.classify.should.have.been.calledWith(
            sinon.match({classifier : CLASSIFIER, text : body.text}),
            sinon.match.func);
          done(err);
        });
    });

  });
});
