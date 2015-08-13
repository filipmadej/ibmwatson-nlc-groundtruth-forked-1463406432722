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
/*eslint func-names: 0, max-nested-callbacks: [2,10], max-statements: [2,15], handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/rest', function () {

  beforeEach(function () {

    this.passportMock = {
      authenticate : sinon.stub()
    };

    this.authenticateSpy = sinon.stub();
    this.authenticateSpy.callsArg(2);
    this.passportMock.authenticate.returns(this.authenticateSpy);

    this.overrides = {
        'passport' : this.passportMock
    };

    this.rest = proxyquire('./rest', this.overrides);
  });

  describe('hideImplementationDetails', function () {
    it('should hide implementation details', function () {

      var obj = {
        '_rev' : '1-1',
        schema : 'obj',
        tenant : 'test',
        password : 'pass',
        foo : 'bar'
      };

      var scrubbed = this.rest.hideImplementationDetails(obj);
      scrubbed.should.not.have.property('_rev');
      scrubbed.should.not.have.property('schema');
      scrubbed.should.not.have.property('tenant');
      scrubbed.should.not.have.property('password');
      scrubbed.should.have.property('foo', obj.foo);
    });

    it('should convert _id to id', function () {

      var obj = {
        '_id' : '1-1',
        foo : 'bar'
      };

      var scrubbed = this.rest.hideImplementationDetails(obj);
      scrubbed.should.not.have.property('_id');
      scrubbed.should.not.property('id', obj._id);
      scrubbed.should.have.property('foo', obj.foo);
    });

  });

  describe('ensureAuthenticated', function () {

    beforeEach(function () {
      this.reqMock = {
        isAuthenticated : sinon.stub()
      };
      this.reqMock.isAuthenticated.returns(true);

      this.resSpy = sinon.spy();

    });
    it('should pass through authenticated request', function (done) {

      this.rest.ensureAuthenticated(this.reqMock, this.resSpy, function () {
        this.reqMock.isAuthenticated.should.have.been.called;
        this.passportMock.authenticate.should.not.have.been.called;
        done();
      }.bind(this));

    });

    it('should call passport on unauthenticated request', function (done) {

      this.reqMock.isAuthenticated.returns(false);

      this.rest.ensureAuthenticated(this.reqMock, this.resSpy, function () {
        this.reqMock.isAuthenticated.should.have.been.called;
        this.passportMock.authenticate.should.have.been.calledWith('basic', sinon.match({session : false}));
        this.authenticateSpy.should.have.been.calledWith(this.reqMock, this.resSpy, sinon.match.func);
        done();
      }.bind(this));

    });
  });

});
