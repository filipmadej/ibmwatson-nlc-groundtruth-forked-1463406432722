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
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');
var session = require('express-session');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var BasicStrategy = require('passport-http').BasicStrategy,
    LocalStrategy = require('passport-local').Strategy;

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);


// dummy authenticate function
function authenticate(username, password, callback) {

  if(username === 'username' && password === 'password') {
    return callback(null, {
        username: username,
        password: password
    });
  }

  return callback(null, false, {
      'message': 'Username and password not recognised.'
    });
}

describe('/server/api/authenticate', function () {

  var ENDPOINTBASE = '/api/authenticate';

  this.timeout(5000);

  before(function () {

    this.nlc = {
      id : 'test-id',
      url : 'https://test.com',
      username : 'username',
      password : 'password',
      version : 'v1',
      '@noCallThru' : true
    }

    this.cryptoMock = {
      encrypt:function(string){
        return string + "encryptedhonest"
      },
      decrypt:function(string){
        return string.slice(0,string.length-15);
      }
    };

    this.error = {
      error : 'test-generated',
      statusCode : httpstatus.INTERNAL_SERVER_ERROR
    };

  });

  beforeEach(function () {

    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(session({secret : 'testing'}));

    this.passportLib = proxyquire('passport', {});

    // Dummy Passport Configuration
    this.passportLib.serializeUser(function serializeUser(user, callback) {
        callback(null, user);
    });

    this.passportLib.deserializeUser(function deserializeUser(user, callback) {
      callback(null, user);
    });

    this.passportLib.use(new LocalStrategy(authenticate));
    this.passportLib.use(new BasicStrategy(authenticate));
    this.app.use(this.passportLib.initialize());
    this.app.use(this.passportLib.session());

    this.controllerOverrides = {
      'passport' : this.passportLib
    };

    this.controller = proxyquire('./authenticate.controller', this.controllerOverrides);

    this.appOverrides = {
      'passport' : this.passportLib,
      './authenticate.controller' : this.controller
    }

    this.app.use('/api/authenticate', proxyquire('./index', this.appOverrides));
  });

  describe('GET /api/authenticate', function () {

    it('should respond with a 401 response if the user is not authenticated', function (done) {
      request(this.app)
        .get(ENDPOINTBASE)
        .expect(httpstatus.UNAUTHORIZED, done);
    });

    it('should respond with a 401 response if the session cookie is invalid', function (done) {

      request(this.app)
        .get(ENDPOINTBASE)
        .set('Cookie', ['connect.sid=s:AWWn3-T1GJ1N5fpXVh0OYTnbSVcEVeG5.7skWD6cJUPyNIyd/Tk+/+P7wK3L31Tys70Z3zDiKAbI'])
        .expect(httpstatus.UNAUTHORIZED, done);
    });

    it('should respond with a 200 response if the user is authenticated', function (done) {
      var sessionCookie;
      async.series([
        function (next) {
          request(this.app)
            .post(ENDPOINTBASE)
            .send({username : this.nlc.username, password : this.nlc.password})
            .expect(httpstatus.OK)
            .end(function (err, res) {
            sessionCookie = res.headers['set-cookie'][0];
            next(err);
          });
        }.bind(this),
        function (next) {
          request(this.app)
            .get(ENDPOINTBASE)
            .set('Cookie', [sessionCookie])
            .expect(httpstatus.OK, next);
        }.bind(this)
      ], done);
    });
  });

  describe('POST /api/authenticate', function () {

    it('should respond with a 200 response if the user provides the correct credentials', function (done) {

      request(this.app)
        .post(ENDPOINTBASE)
        .send({username : this.nlc.username, password : this.nlc.password})
        .expect(httpstatus.OK)
        .end(function (err, res) {
          should.exist(res.headers['set-cookie'][0]);
          res.headers['set-cookie'][0].should.match(/^connect\.sid/);
          done(err);
        });
    });

    it('should respond with a 400 response if the user provides the incorrect credentials', function (done) {
      request(this.app)
        .post(ENDPOINTBASE)
        .send({username : this.nlc.username, password : 'wrongpasswordfool'})
        .expect(httpstatus.BAD_REQUEST, done);
    });

    it('should respond with a 400 response if the user provides the credentials in header', function (done) {
      request(this.app)
        .post(ENDPOINTBASE)
        .auth(this.nlc.username, this.nlc.password)
        .expect(httpstatus.BAD_REQUEST, done);
    });

    it('should return error from passport strategy', function (done) {

      var passportStub = sinon.stub(this.passportLib, 'authenticate', function (strategy, callback) {
        return function (req, res, next) {
          callback({error : 'test-generated'});
        }
      });

      request(this.app)
        .post(ENDPOINTBASE)
        .auth(this.nlc.username, this.nlc.password)
        .expect(httpstatus.INTERNAL_SERVER_ERROR)
        .end(function (err, resp) {
          this.passportLib.authenticate.restore();
          done(err);
        }.bind(this));
    });

    it('should return error from request login', function (done) {

      var passportStub = sinon.stub(this.passportLib, 'authenticate', function (strategy, callback) {
        return function (req, res, next) {
          var loginStub = sinon.stub(req, 'logIn');
          loginStub.callsArgWith(1, {error : 'test-generated'});
          callback(null, {username : 'test-user'});
        }
      });

      request(this.app)
        .post(ENDPOINTBASE)
        .auth(this.nlc.username, this.nlc.password)
        .expect(httpstatus.INTERNAL_SERVER_ERROR)
        .end(function (err, resp) {
          this.passportLib.authenticate.restore();
          done(err);
        }.bind(this));
    });
  });

  describe('POST /api/authenticate/logout', function (done) {

    var LOGOUT_LOCATION = ENDPOINTBASE + '/logout';

    it('should respond with a 400 if user not logged in', function (done) {

      request(this.app)
        .post(LOGOUT_LOCATION)
        .expect(httpstatus.BAD_REQUEST, done);

    });

    it('should respond with a 200 and log out user if already logged in', function (done) {

      var sessionCookie;

      async.series([
        function (next) {
          request(this.app)
            .post(ENDPOINTBASE)
            .send({username : this.nlc.username, password : this.nlc.password})
            .expect(httpstatus.OK)
            .end(function (err, res) {
              sessionCookie = res.headers['set-cookie'][0];
              next(err);
            });
        }.bind(this),
        function (next) {
          request(this.app)
            .get(ENDPOINTBASE)
            .set('Cookie', [sessionCookie])
            .expect(httpstatus.OK, next);
        }.bind(this),
        function (next) {
          request(this.app)
            .post(LOGOUT_LOCATION)
            .set('Cookie', [sessionCookie])
            .expect(httpstatus.OK)
            .end(function (err, res) {
              next(err);
            });
        }.bind(this),
        function (next) {
          request(this.app)
            .get(ENDPOINTBASE)
            .set('Cookie', [sessionCookie])
            .expect(httpstatus.UNAUTHORIZED, next);
        }.bind(this)
      ], done);

    });
  });

});
