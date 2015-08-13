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
var cookieParser = require('cookie-parser');
var express = require('express');
var session = require('express-session');
var httpstatus = require('http-status');
var passport = require('passport');
var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var nlc = require('./nlc');

var should = chai.should();
chai.use(sinonChai);


describe('/server/config/passport', function () {

  describe('de/serializeUser', function () {

    /*
     * AJS - The structure of the unit tests in this describe block are
     * somewhat hackey.  I could not see a clean/easy way to test the
     * error conditions in the functions passed to de/serializeUser.
     * Therefore, I use spys to get a reference to those functions and
     * run them directly.
     */
    beforeEach(function () {

      this.passportMock = {
        serializeUser : sinon.spy(),
        deserializeUser : sinon.spy(),
        use : sinon.spy(),
        initialize : sinon.spy(),
        session : sinon.spy()
      };

      this.appMock = {
        use : sinon.spy()
      };

      proxyquire('./passport', {
        'passport' : this.passportMock
      })(this.appMock);

      this.serializeFn = this.passportMock.serializeUser.lastCall.args[0];
      this.serializeFn.should.be.a('function');

      this.deserializeFn = this.passportMock.deserializeUser.lastCall.args[0];
      this.deserializeFn.should.be.a('function');

    });

    it('should serialize user', function () {
      var callbackSpy = sinon.spy();
      var user = {username : 'test'};

      this.serializeFn(user, callbackSpy);
      callbackSpy.should.have.been.calledWith(null, user.username);
    });

    it('should error if user not defined during serialization', function () {
      var callbackSpy = sinon.spy();

      this.serializeFn(null, callbackSpy);
      callbackSpy.should.have.been.calledWith(sinon.match.instanceOf(Error));
    });


    it('should deserialize valid user', function () {
      var callbackSpy = sinon.spy();

      this.deserializeFn(nlc.username, callbackSpy);
      callbackSpy.should.have.been.calledWith(null, nlc);
    });

    it('should error if unknown user found', function () {
      var callbackSpy = sinon.spy();

      this.deserializeFn('test', callbackSpy);
      callbackSpy.should.have.been.calledWith(sinon.match.instanceOf(Error));
    });

  });

  describe('strategies', function () {

    before(function () {
      this.app = express();
      this.app.use(bodyParser.json());
      this.app.use(cookieParser());
      this.app.use(session({secret : 'testing'}));

      this.overrides = {};

      proxyquire('./passport', this.overrides)(this.app);

    });

    describe('local strategy', function () {

      before(function () {
        this.app.post('/local', passport.authenticate('local'), function (req, res) {
          res.status(httpstatus.OK).json(req.user);
        });
      });

      it('should succeed with local strategy authentication', function (done) {
        request(this.app)
          .post('/local')
          .send({
            username : nlc.username,
            password : nlc.password
          })
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.deep.property('body.username', nlc.username);
            done(err);
          }.bind(this));
      });

      it('should fail on invalid credentials', function (done) {
        request(this.app)
          .post('/local')
          .send({
            username : nlc.username,
            password : 'notvalid'
          })
          .expect(httpstatus.UNAUTHORIZED, done);
      });

    });

    describe('basic strategy', function () {

      before(function () {
        this.app.post('/basic', passport.authenticate('basic'), function (req, res) {
          res.status(httpstatus.OK).json(req.user);
        });
      });

      it('should succeed with basic strategy authentication', function (done) {
        request(this.app)
          .post('/basic')
          .auth(nlc.username, nlc.password)
          .expect(httpstatus.OK)
          .end(function (err, resp) {
            resp.should.have.deep.property('body.username', nlc.username);
            done(err);
          }.bind(this));
      });

      it('should fail on invalid credentials', function (done) {
        request(this.app)
          .post('/basic')
          .auth(nlc.username, 'invalid')
          .expect(httpstatus.UNAUTHORIZED, done);
      });

    });

  });

});
