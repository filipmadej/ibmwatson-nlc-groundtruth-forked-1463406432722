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
  '../../config/db/store' : storeMock
});

describe('/server/api/tenant', function () {

  var TENANT = 'nlc-test';
  var ENDPOINTBASE = '/api/' + TENANT + '/texts';

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

  describe('/:tenantid', function () {
    describe('DELETE', function () {
      // Currently not exposed via Express
    });
  });

});
