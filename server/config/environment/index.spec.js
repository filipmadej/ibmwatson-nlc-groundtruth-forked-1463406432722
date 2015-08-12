'use strict';
/*eslint func-names: 0 */
var util = require('util');
//external dependencies
var proxyquire = require('proxyquire').noPreserveCache();
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

// local dependencies
var env;

describe('server/config/environment', function () {

  before(function () {
    this.originalNodeEnv = process.env.NODE_ENV;
    this.originalCookieSecret = process.env.COOKIE_SECRET;
    this.originalSessionSecret = process.env.SESSION_SECRET;
    this.originalServiceName = process.env.CLASSIFIER_SERVICE_NAME;
  });

  after(function () {
    process.env.NODE_ENV = this.originalNodeEnv;
    process.env.COOKIE_SECRET = this.originalCookieSecret;
    process.env.SESSION_SECRET = this.originalSessionSecret;
    process.env.CLASSIFIER_SERVICE_NAME = this.originalServiceName;
  });

  beforeEach(function () {

    this.envprops = {
      'test-generated' : true
    };

    this.runTest = function runTest (verifyFn) {
      env = proxyquire('./index', {});
      verifyFn.call(this);
    };
  });

  it('should load development environment file when NODE_ENV unspecified', function () {
    delete process.env.NODE_ENV;

    this.runTest(function () {
      env.env.should.equal('development');
    });
  });

  it('should load development environment file', function () {
    process.env.NODE_ENV = 'development';

    this.runTest( function () {
      env.env.should.equal('development');
    });
  });

  it('should load test environment file', function () {
    process.env.NODE_ENV = 'test';

    this.runTest( function () {
      env.env.should.equal('test');
    });
  });

  it('should load production environment file', function () {
    process.env.NODE_ENV = 'production';

    var prodEnv = require('./production');

    this.runTest( function () {
      env.should.have.property('env', 'production');
      env.should.have.property('ip', prodEnv.ip);
      env.should.have.property('port', prodEnv.port);
    });
  });

  it('should load no overrides if NODE_ENV unrecognized', function () {
    process.env.NODE_ENV = 'unspecified';

    this.runTest( function () {
      env.should.have.property('env', 'unspecified');
    });
  });

  it('should default required environment variables', function () {
    process.env.NODE_ENV = 'production';

    delete process.env.COOKIE_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.CLASSIFIER_SERVICE_NAME;

    var prodEnv = require('./index');

    this.runTest( function () {
      env.should.have.deep.property('secrets.cookie', prodEnv.secrets.cookie);
      env.should.have.deep.property('secrets.session', prodEnv.secrets.session);
      env.should.have.property('classifierServiceName', prodEnv.classifierServiceName);
    });
  });


});
