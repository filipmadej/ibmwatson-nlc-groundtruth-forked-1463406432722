'use strict';
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var errorLib = require('./index');

var should = chai.should();
chai.use(sinonChai);


describe('/server/components/error/index', function () {


  beforeEach(function () {
    this.reqMock = sinon.spy();

    this.resMock = {
      status : sinon.spy(),
      render : sinon.stub(),
      json : sinon.stub()
    };

  });

  it('should render error page for 404 Not Found', function () {
      this.resMock.render.withArgs(sinon.match.string, sinon.match.func).callsArg(1);

    errorLib['404'](this.reqMock, this.resMock);

    this.resMock.render.should.have.been.calledTwice;
    this.resMock.render.should.have.been.calledWith('404', sinon.match.func);
    this.resMock.render.should.have.been.calledWithExactly('404');
    this.resMock.json.should.not.have.been.called;

  });

  it('should return error JSON if error occurs on render', function () {

    this.resMock.render.withArgs(sinon.match.string, sinon.match.func).callsArgWith(1, {error : 'test-generated'});

    errorLib['404'](this.reqMock, this.resMock);

    var expected = {
      status : 404
    };

    this.resMock.render.should.have.been.calledOnce;
    this.resMock.render.should.have.been.calledWith('404', sinon.match.func);
    this.resMock.json.should.have.been.calledWith(sinon.match(expected), expected.status);

  });

});
