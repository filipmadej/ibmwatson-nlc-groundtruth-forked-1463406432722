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
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

// local dependencies
var dberrors = require('./errors');
var log = require('../log');

// test dependencies
var mocks = require('../../test/mocks');

var viewMock = {
  getDocumentsInTenant : sinon.stub(),
  countDocumentsInTenant : sinon.stub()
};

var dbdelete = proxyquire('./deletes', {
  './views' : viewMock,
  '../log' : new mocks.LogMock()
});

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/db/deletes', function () {

  var TENANT = 'TEST';

  function generateDocuments (count) {
    var data = [];
    for (var i=0; i<count; i++) {
      data.push({
        '_id' : uuid.v1(),
        '_rev' : uuid.v1()
      });
    }

    return data;
  }

  before( function () {
    this.dbMock = new mocks.DBMock();

    this.error = {error : 'test-generated', statusCode : 500};
  });

  beforeEach( function () {
    viewMock.getDocumentsInTenant = sinon.stub();
    viewMock.countDocumentsInTenant = sinon.stub();

    this.dbMock.reset();
  });

  it('should complete successfully', function (done) {
    var count = 10;

    viewMock.getDocumentsInTenant.callsArgWith(3, null, generateDocuments(count));
    viewMock.countDocumentsInTenant.callsArgWith(2, null, 0);

    dbdelete(this.dbMock, TENANT, function (err, result) {
      viewMock.getDocumentsInTenant.should.have.been.called;
      this.dbMock.bulk.should.have.been.called;
      viewMock.countDocumentsInTenant.should.have.been.called;

      var options = this.dbMock.bulk.firstCall.args[0];
      options.should.have.property('docs').that.is.an('array').with.length(count);
      done(err);
    }.bind(this));
  });

  it('should complete after multiple recursive invocations', function (done) {
    var count = 100;

    viewMock.getDocumentsInTenant.onCall(0).callsArgWith(3, null, generateDocuments(1000));
    viewMock.getDocumentsInTenant.onCall(1).callsArgWith(3, null, generateDocuments(100));
    viewMock.countDocumentsInTenant.onCall(0).callsArgWith(2, null, count);
    viewMock.countDocumentsInTenant.onCall(1).callsArgWith(2, null, 0);

    dbdelete(this.dbMock, TENANT, function (err, result) {
      viewMock.getDocumentsInTenant.should.have.been.calledTwice;
      this.dbMock.bulk.should.have.been.calledTwice;
      viewMock.countDocumentsInTenant.should.have.been.calledTwice;

      var firstOptions = this.dbMock.bulk.firstCall.args[0];
      firstOptions.should.have.property('docs').that.is.an('array').with.length(1000);
      var secondOptions = this.dbMock.bulk.secondCall.args[0];
      secondOptions.should.have.property('docs').that.is.an('array').with.length(count);
      done(err);
    }.bind(this));
  });

  it('should pass back error in retrieving documents', function (done) {
    var count = 10;

    viewMock.getDocumentsInTenant.callsArgWith(3, this.error);

    dbdelete(this.dbMock, TENANT, function (err, result) {
      viewMock.getDocumentsInTenant.should.have.been.called;
      this.dbMock.bulk.should.not.have.been.called;
      viewMock.countDocumentsInTenant.should.not.have.been.called;

      should.exist(err);
      err.should.equal(this.error);

      done();
    }.bind(this));
  });

  it('should pass back error in counting documents', function (done) {
    var count = 10;

    viewMock.getDocumentsInTenant.callsArgWith(3, null, generateDocuments(count));
    viewMock.countDocumentsInTenant.callsArgWith(2, this.error);

    dbdelete(this.dbMock, TENANT, function (err, result) {
      viewMock.getDocumentsInTenant.should.have.been.called;
      this.dbMock.bulk.should.have.been.called;
      viewMock.countDocumentsInTenant.should.have.been.called;

      var options = this.dbMock.bulk.firstCall.args[0];
      options.should.have.property('docs').that.is.an('array').with.length(count);

      should.exist(err);
      err.should.equal(this.error);

      done();
    }.bind(this));
  });

});
