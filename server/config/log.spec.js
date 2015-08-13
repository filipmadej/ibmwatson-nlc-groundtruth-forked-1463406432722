'use strict';
/*eslint func-names: 0, max-nested-callbacks: [2,10], max-statements: [2,15], handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/log', function () {

  before(function () {
    this.originalNodeEnv = process.env.NODE_ENV;
  });

  after(function () {
    if (this.originalNodeEnv) {
      process.env.NODE_ENV = this.originalNodeEnv;
    }
  });

  beforeEach(function () {
    delete process.env.NODE_ENV;

    this.bunyanMock = {
      createLogger : sinon.stub()
    };

    this.overrides = {
        'bunyan' : this.bunyanMock
    };
  });

  it('should configure bunyan', function () {

    var log = proxyquire('./log', this.overrides);
    this.bunyanMock.createLogger.should.have.been.calledWith(sinon.match.object);
    this.bunyanMock.createLogger.lastCall.args[0].streams.should.be.an('array').with.length(1);
    this.bunyanMock.createLogger.lastCall.args[0].streams[0].should.contain({level : 'debug'});

  });

  it('should write info to stdout in production', function () {

    process.env.NODE_ENV = 'production';

    var log = proxyquire('./log', this.overrides);
    this.bunyanMock.createLogger.should.have.been.calledWith(sinon.match.object);
    this.bunyanMock.createLogger.lastCall.args[0].streams.should.be.an('array').with.length(2);
    this.bunyanMock.createLogger.lastCall.args[0].streams[0].should.contain({level : 'debug'});
    this.bunyanMock.createLogger.lastCall.args[0].streams[1].should.contain({level : 'info'});

  });

});
