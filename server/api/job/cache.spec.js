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
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('../../test/mocks');

describe('/server/api/job/cache', function () {

  beforeEach(function () {

    this.stdTTL = 1000 * 60 * 5;
    this.completeTTL = 1000 * 60 * 60 * 24;

    this.cacheMock = {
      put : sinon.spy(),
      get : sinon.stub()
    };

    this.cacheMock.get.returns({});

    this.cache = proxyquire('./cache', {
      'memory-cache' : this.cacheMock
    });


  });

  it('should get entry', function () {

    var id = uuid.v1();
    var entry = { ok : true };

    this.cacheMock.get.withArgs(id).returns(entry);

    var result = this.cache.get(id)
    result.should.equal(entry);
  });

  it('should put entry with default time to live', function () {

    var id = uuid.v1();
    var entry = {};

    this.cache.put(id, entry)
    this.cacheMock.put.should.have.been.calledWith(id, entry, this.stdTTL);
  });

  it('should put finished entry with 24hr time to live', function () {

    var id = uuid.v1();
    var completeEntry = {status : this.cache.STATUS.COMPLETE};
    var errorEntry = {status : this.cache.STATUS.ERROR};

    this.cache.put(id, completeEntry)
    this.cacheMock.put.should.have.been.calledWith(id, completeEntry, this.completeTTL);

    this.cache.put(id, errorEntry)
    this.cacheMock.put.should.have.been.calledWith(id, errorEntry, this.completeTTL);
  });

  it('should handle optional info argument', function () {

    var id = uuid.v1();

    this.cache.put(id)
    this.cacheMock.put.should.have.been.calledWith(id, sinon.match.object, this.stdTTL);
  });

  it('should create cache entry with no argument', function () {

    var id = this.cache.entry();
    should.exist(id);
    this.cacheMock.put.should.have.been.calledWith(id, sinon.match({status : this.cache.STATUS.RUNNING}), this.stdTTL);
  });

  it('should create cache entry with provided argument', function () {

    var info = { ok : true };
    var id = this.cache.entry(info);
    should.exist(id);
    info.should.have.property('status', this.cache.STATUS.RUNNING);
    this.cacheMock.put.should.have.been.calledWith(id, info, this.stdTTL);
  });

  it('should create cache entry and preserve status', function () {

    var info = { status : this.cache.STATUS.ERROR };
    var id = this.cache.entry(info);
    should.exist(id);
    info.should.have.property('status', this.cache.STATUS.ERROR);
    this.cacheMock.put.should.have.been.calledWith(id, info, this.completeTTL);
  });

});
