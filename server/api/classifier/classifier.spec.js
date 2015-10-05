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

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

var wdcMock = new mocks.WDCMock();
var nlcMock = wdcMock.nlcMock;

var app, nlccreds;

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

  before(function () {

    // Setup Controller
    this.controllerOverrides = {
      'watson-developer-cloud' : wdcMock
    };

    this.controller = proxyquire('./classifier.controller', this.controllerOverrides);

    // Setup App
    this.app = express();

    // This mock adds NLC credentials to the request
    this.restMock = {
      ensureAuthenticated : function (req, res, next) {

        req.user = {
          username: '85f2085e-9ff4-49b2-9d90-93f68b61b135',
          password: 'wgGb9arQWnqw'
        };
        next();
      }
    };

    this.routeOverrides = {
      './classifier.controller' : this.controller,
      '../../config/rest' : this.restMock
    };

    this.app.use(bodyParser.json());
    this.app.use('/api', proxyquire('./index', this.routeOverrides));

    this.agent = request.agent(this.app);
  });

  beforeEach(function () {
    nlcMock.reset();
  });

  describe('GET /api/:tenantid/classifiers', function () {

    it('should return a 200 response', function (done) {
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
      this.agent
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
