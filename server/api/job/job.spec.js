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

describe('/server/api/job', function () {

  var TENANT = 'nlc-test';
  var JOB = uuid.v1();
  var ENDPOINTBASE = '/api/' + TENANT + '/jobs/' + JOB;

  this.timeout(5000);

  before(function () {

    this.error = {
      error : 'test-generated',
      statusCode : httpstatus.INTERNAL_SERVER_ERROR
    };

  });

  this.timeout(5000);

  beforeEach(function () {

    this.cacheMock = new mocks.CacheMock();

    this.controllerOverrides = {
      './cache' : this.cacheMock
    };

    this.controller = proxyquire('./job.controller', this.controllerOverrides);

    this.restMock = {
      ensureAuthenticated : function (req, res, next) {
        next();
      }
    }

    this.app = express();

    this.appOverrides = {
      './job.controller' : this.controller,
      '../../config/rest' : this.restMock
    }

    this.app.use('/api', proxyquire('./index', this.appOverrides));

    this.agent = request.agent(this.app);

  });

  describe('/:tenantid/jobs/:jobid', function () {

    describe('GET', function () {

      it('should retrieve job info', function (done) {
        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.property('body');
            this.cacheMock.get.should.have.been.calledWith(JOB);
            done(err);
          }.bind(this));
      });

      it('should return 404 if job not found', function (done) {
        this.cacheMock.get.returns(null);

        this.agent
          .get(ENDPOINTBASE)
          .expect('Content-Type', /json/)
          .expect(httpstatus.NOT_FOUND)
          .end(function (err, resp) {
            this.cacheMock.get.should.have.been.calledWith(JOB);
            done(err);
          }.bind(this));
      });

    });

  });

});
