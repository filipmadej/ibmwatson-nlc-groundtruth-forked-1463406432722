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
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

// local dependencies
var dberrors = require('./errors');
var log = require('../log');

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);

function generateCreatedObject (obj) {
  var cloudant = {
    '_id' : uuid.v1(),
    '_rev' : uuid.v1()
  };

  var created = _.merge({}, cloudant, obj);
  return created;
}

describe('/server/config/db/store', function () {

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

  beforeEach( function () {
    this.dbMock = new mocks.DBMock();

    this.cloudantMock = sinon.stub();
    this.cloudantMock.callsArgWith(2, null, this.dbMock);

    this.viewMock = {
      getClassByName : sinon.stub(),
      countClasses : sinon.stub(),
      getTextByValue : sinon.stub(),
      countTexts : sinon.stub(),
      lookupClassesByName : sinon.stub()
    };

    this.fetchMock = {
      getClass : sinon.stub(),
      getClasses : sinon.stub(),
      getText : sinon.stub(),
      getTexts : sinon.stub(),
      getTextsWithClass : sinon.stub()
    };

    this.handlerMock = {
      addClassesToText : sinon.stub(),
      removeClassesFromText : sinon.stub(),
      updateTextMetadata : sinon.stub()
    };

    this.deleteMock = sinon.stub();

    this.store = proxyquire('./store', {
      '../../components/cloudant' : this.cloudantMock,
      './views' : this.viewMock,
      './fetch' : this.fetchMock,
      './deletes' : this.deleteMock,
      './updatehandlers' : this.handlerMock,
      '../log' : new mocks.LogMock()
    });


    this.error = {error : 'test-generated', statusCode : 500};
  });

  describe('#start()', function () {

    it('should start successfully', function (done) {
      this.store.start(done);
    });

    it('should return error on start', function (done) {
      this.cloudantMock.callsArgWith(2, this.error);
      this.store.start(function (err) {
        should.exist(err);
        err.should.equal(this.error);
        done();
      }.bind(this));
    });
  });

  describe('#stop()', function () {

    it('should stop successfully', function () {
      this.store.stop();
    });

  });

  describe('#createClass()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should create class', function (done) {

      var attrs = {
        name : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getClassByName.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArgWith(1, null, created);

      this.store.createClass(TENANT, attrs, function (err, result) {
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match(attrs), sinon.match.func);

        var expected = this.dbMock.insert.lastCall.args[0];
        expected._rev = created._rev;
        result.should.deep.equal(expected);

        done(err);
      }.bind(this));

    });

    it('should return error if class name not unique', function (done) {

      var attrs = {
        name : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getClassByName.callsArgWith(3, null, generateCreatedObject(attrs));

      this.store.createClass(TENANT, attrs, function (err, result) {
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.NON_UNIQUE);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error if error occurred while determining if class name unique', function (done) {

      var attrs = {
        name : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getClassByName.callsArgWith(3, this.error);

      this.store.createClass(TENANT, attrs, function (err, result) {
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error if name attribute not provided', function (done) {

      var attrs = {};

      this.store.createClass(TENANT, attrs, function (err, result) {
        this.viewMock.getClassByName.should.not.have.been.called;
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.REQUIRED_FIELD_MISSING);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error from cloudant on insert', function (done) {

      var attrs = {
        name : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getClassByName.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArgWith(1, this.error);

      this.store.createClass(TENANT, attrs, function (err, result) {
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match(attrs), sinon.match.func);

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

  });

  describe('#getClass()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should get class by passing thru to fetch module', function (done) {

      var id = 'abc-123';

      this.fetchMock.getClass.callsArg(3);

      this.store.getClass(TENANT, id, function () {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        done();
      }.bind(this));

    });

  });


  describe('#getClasses()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should get classes by passing thru to fetch module', function (done) {

      var options = {};

      this.fetchMock.getClasses.callsArg(3);

      this.store.getClasses(TENANT, options, function () {
        this.fetchMock.getClasses.should.have.been.calledWith(this.dbMock, TENANT, options, sinon.match.func);
        done();
      }.bind(this));

    });

  });


  describe('#countClasses()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should count classes by passing thru to fetch module', function (done) {

      this.viewMock.countClasses.callsArg(2);

      this.store.countClasses(TENANT, function () {
        this.viewMock.countClasses.should.have.been.calledWith(this.dbMock, TENANT, sinon.match.func);
        done();
      }.bind(this));

    });

  });

  describe('#replaceClass()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should replace class', function (done) {

      var attrs = {
        id : uuid.v1(),
        name : 'testing'
      };

      var existing = generateCreatedObject(attrs);
      var updated = generateCreatedObject(attrs);

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.viewMock.getClassByName.callsArgWith(3, null, existing);
      this.dbMock.insert.callsArgWith(1, null, updated);

      this.store.replaceClass(TENANT, attrs, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, attrs.id, sinon.match.func);
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({_id : attrs.id, name : attrs.name}), sinon.match.func);

        var expected = this.dbMock.insert.lastCall.args[0];
        expected._rev = updated._rev;
        result.should.deep.equal(expected);

        done(err);
      }.bind(this));

    });

    it('should allow wildcard on rev to replace class', function (done) {

      var attrs = {
        id : uuid.v1(),
        name : 'testing'
      };

      var existing = generateCreatedObject(attrs);
      var updated = generateCreatedObject(attrs);

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.viewMock.getClassByName.callsArgWith(3, null, existing);
      this.dbMock.insert.callsArgWith(1, null, updated);

      this.store.replaceClass(TENANT, attrs, '*', function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, attrs.id, sinon.match.func);
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({_id : attrs.id, name : attrs.name}), sinon.match.func);

        var expected = this.dbMock.insert.lastCall.args[0];
        expected._rev = updated._rev;
        result.should.deep.equal(expected);

        done(err);
      }.bind(this));

    });

    it('should error on invalid rev', function (done) {

      var attrs = {
        id : uuid.v1(),
        name : 'testing'
      };

      var existing = generateCreatedObject(attrs);

      this.fetchMock.getClass.callsArgWith(3, null, existing);

      this.store.replaceClass(TENANT, attrs, uuid.v1(), function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, attrs.id, sinon.match.func);

        should.exist(err);
        err.should.have.property('error', dberrors.CONFLICT);
        err.should.have.property('statusCode', httpstatus.CONFLICT);

        done();
      }.bind(this));

    });

    it('should return error if name attribute not provided', function (done) {

      var attrs = {
        id : uuid.v1()
      };

      this.store.replaceClass(TENANT, attrs, '*', function (err, result) {
        this.fetchMock.getClass.should.not.have.been.called;
        this.viewMock.getClassByName.should.not.have.been.called;
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.REQUIRED_FIELD_MISSING);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error if error occurred while getting current class', function (done) {

      var attrs = {
        id : uuid.v1(),
        name : 'testing'
      };

      this.fetchMock.getClass.callsArgWith(3, this.error);

      this.store.replaceClass(TENANT, attrs, '*', function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, attrs.id, sinon.match.func);
        this.viewMock.getClassByName.should.not.have.been.called;
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error if class name not unique', function (done) {

      var attrs = {
        id : uuid.v1(),
        name : 'testing'
      };

      var existing = generateCreatedObject(attrs);

      var duplicate = generateCreatedObject(attrs);
      duplicate.id = uuid.v1();

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.viewMock.getClassByName.callsArgWith(3, null, duplicate);

      this.store.replaceClass(TENANT, attrs, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, attrs.id, sinon.match.func);
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.NON_UNIQUE);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });


    it('should return error from cloudant on insert', function (done) {

      var attrs = {
        id : uuid.v1(),
        name : 'testing'
      };

      var existing = generateCreatedObject(attrs);

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.viewMock.getClassByName.callsArgWith(3, null, existing);
      this.dbMock.insert.callsArgWith(1, this.error);

      this.store.replaceClass(TENANT, attrs, '*', function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, attrs.id, sinon.match.func);
        this.viewMock.getClassByName.should.have.been.calledWith(this.dbMock, TENANT, attrs.name, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({_id : attrs.id, name : attrs.name}), sinon.match.func);

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

  });

  describe('#deleteClass()', function () {

    function generateTextResults (length, classes) {
      var data = [];
      for (var i=0; i<length; i++) {
        // Make it so some entries don't have class
        // that is being deleted
        var classArray = classes.slice(0);
        if (i%2 === 0) {
          classArray.splice(0, 1);
        }
        var id = uuid.v1();
        var value = ('testtext' + i);
        data.push({
          '_id' : id,
          '_rev' : uuid.v1(),
          'tenant' : TENANT,
          'schema' : 'text',
          'value' : value,
          'classes' : classArray
        });
      }

      return data;
    }

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should delete class', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      var classArray = [id, uuid.v1()];

      var textResults = generateTextResults(10, classArray);
      var bulkResults = textResults.map(function (elem) {
        return {id : elem._id, rev : elem._rev};
      });

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);
      this.fetchMock.getTextsWithClass.callsArgWith(3, null, textResults);
      this.dbMock.bulk.callsArgWith(1, null, bulkResults);

      this.store.deleteClass(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(id, existing._rev, sinon.match.func);
        this.fetchMock.getTextsWithClass.should.have.been.calledWith(this.dbMock, TENANT, sinon.match({class : id}), sinon.match.func);
        this.dbMock.bulk.should.have.been.calledOnce;

        var bulkRequest = this.dbMock.bulk.firstCall.args[0];
        bulkRequest.should.have.property('docs').that.is.an('array').with.length(textResults.length);
        bulkRequest.docs.forEach(function (doc) {
          doc.should.have.property('classes').that.deep.equals([classArray[1]]);
        });

        should.not.exist(err);
        done(err);
      }.bind(this));

    });

    it('should delete class with multiple iterations of reference cleanup', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      var classArray = [id, uuid.v1()];

      var firstTextResults = generateTextResults(100, classArray);
      var secondTextResults = generateTextResults(10, classArray);
      var firstBulkResults = firstTextResults.map(function (elem) {
        return {id : elem._id, rev : elem._rev};
      });
      var secondBulkResults = secondTextResults.map(function (elem) {
        return {id : elem._id, rev : elem._rev};
      });

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);
      this.fetchMock.getTextsWithClass.onCall(0).callsArgWith(3, null, firstTextResults);
      this.fetchMock.getTextsWithClass.onCall(1).callsArgWith(3, null, secondTextResults);
      this.dbMock.bulk.onCall(0).callsArgWith(1, null, firstBulkResults);
      this.dbMock.bulk.onCall(1).callsArgWith(1, null, secondBulkResults);

      this.store.deleteClass(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(id, existing._rev, sinon.match.func);
        this.fetchMock.getTextsWithClass.should.have.been.calledWith(this.dbMock, TENANT, sinon.match({class : id}), sinon.match.func);
        this.dbMock.bulk.should.have.been.calledTwice;

        var firstBulkRequest = this.dbMock.bulk.firstCall.args[0];
        firstBulkRequest.should.have.property('docs').that.is.an('array').with.length(firstTextResults.length);
        var secondBulkRequest = this.dbMock.bulk.secondCall.args[0];
        secondBulkRequest.should.have.property('docs').that.is.an('array').with.length(secondTextResults.length);


        should.not.exist(err);
        done(err);
      }.bind(this));

    });

    it('should delete class that is mapped to no texts', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      var classArray = [id, uuid.v1()];

      var textResults = [];

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);
      this.fetchMock.getTextsWithClass.callsArgWith(3, null, textResults);

      this.store.deleteClass(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(id, existing._rev, sinon.match.func);
        this.fetchMock.getTextsWithClass.should.have.been.calledWith(this.dbMock, TENANT, sinon.match({class : id}), sinon.match.func);
        this.dbMock.bulk.should.not.have.been.calledOnce;

        should.not.exist(err);
        done(err);
      }.bind(this));

    });

    it('should allow wildcard rev', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      var classArray = [id, uuid.v1()];

      var textResults = generateTextResults(10, classArray);
      var bulkResults = textResults.map(function (elem) {
        return {id : elem._id, rev : elem._rev};
      });

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);
      this.fetchMock.getTextsWithClass.callsArgWith(3, null, textResults);
      this.dbMock.bulk.callsArgWith(1, null, bulkResults);

      this.store.deleteClass(TENANT, id, '*', function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(id, existing._rev, sinon.match.func);
        this.fetchMock.getTextsWithClass.should.have.been.calledWith(this.dbMock, TENANT, sinon.match({class : id}), sinon.match.func);
        this.dbMock.bulk.should.have.been.calledOnce;

        var bulkRequest = this.dbMock.bulk.firstCall.args[0];
        bulkRequest.should.have.property('docs').that.is.an('array').with.length(textResults.length);
        bulkRequest.docs.forEach(function (doc) {
          doc.should.have.property('classes').that.deep.equals([classArray[1]]);
        });

        should.not.exist(err);
        done(err);
      }.bind(this));

    });

    it('should return error if error occurred fetching texts with class', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      var classArray = [id, uuid.v1()];

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);
      this.fetchMock.getTextsWithClass.callsArgWith(3, this.error);

      this.store.deleteClass(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(id, existing._rev, sinon.match.func);
        this.fetchMock.getTextsWithClass.should.have.been.calledWith(this.dbMock, TENANT, sinon.match({class : id}), sinon.match.func);
        this.dbMock.bulk.should.not.have.been.calledOnce;

        should.exist(err);
        err.should.equal(this.error);
        done();
      }.bind(this));

    });

    it('should return error if error occurred during cloudant bulk operation', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      var classArray = [id, uuid.v1()];

      var textResults = generateTextResults(10, classArray);

      this.fetchMock.getClass.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);
      this.fetchMock.getTextsWithClass.callsArgWith(3, null, textResults);
      this.dbMock.bulk.callsArgWith(1, this.error);

      this.store.deleteClass(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(id, existing._rev, sinon.match.func);
        this.fetchMock.getTextsWithClass.should.have.been.calledWith(this.dbMock, TENANT, sinon.match({class : id}), sinon.match.func);
        this.dbMock.bulk.should.have.been.calledOnce;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error if unable to get current class', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});

      this.fetchMock.getClass.callsArgWith(3, this.error);

      this.store.deleteClass(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.not.have.been.called;
        this.fetchMock.getTextsWithClass.should.not.have.been.called;
        this.dbMock.bulk.should.not.have.been.calledOnce;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error on invalid rev', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, name : 'testing'});

      this.fetchMock.getClass.callsArgWith(3, null, existing);

      this.store.deleteClass(TENANT, id, uuid.v1(), function (err, result) {
        this.fetchMock.getClass.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.not.have.been.called;
        this.fetchMock.getTextsWithClass.should.not.have.been.called;
        this.dbMock.bulk.should.not.have.been.calledOnce;

        should.exist(err);
        err.should.have.property('error', dberrors.CONFLICT);
        err.should.have.property('statusCode', httpstatus.CONFLICT);

        done();
      }.bind(this));

    });

  });

  describe('#createText()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should create text', function (done) {

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArgWith(1, null, created);

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match(attrs), sinon.match.func);

        var expected = this.dbMock.insert.lastCall.args[0];
        expected._rev = created._rev;
        result.should.deep.equal(expected);

        done(err);
      }.bind(this));

    });

    it('should return error if text value not unique', function (done) {

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getTextByValue.callsArgWith(3, null, generateCreatedObject(attrs));

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.NON_UNIQUE);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error if error occurred while determining if text value unique', function (done) {

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getTextByValue.callsArgWith(3, this.error);

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error if value attribute not provided', function (done) {

      var attrs = {};

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.not.have.been.called;
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.REQUIRED_FIELD_MISSING);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error from cloudant on insert', function (done) {

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArgWith(1, this.error);

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match(attrs), sinon.match.func);

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

  });

  describe('#getText()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should get text by passing thru to fetch module', function (done) {

      var id = 'abc-123';

      this.fetchMock.getText.callsArg(3);

      this.store.getText(TENANT, id, function () {
        this.fetchMock.getText.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        done();
      }.bind(this));

    });

  });


  describe('#getTexts()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should get texts by passing thru to fetch module', function (done) {

      var options = {};

      this.fetchMock.getTexts.callsArg(3);

      this.store.getTexts(TENANT, options, function () {
        this.fetchMock.getTexts.should.have.been.calledWith(this.dbMock, TENANT, options, sinon.match.func);
        done();
      }.bind(this));

    });

  });


  describe('#countTexts()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should count texts by passing thru to fetch module', function (done) {

      this.viewMock.countTexts.callsArg(2);

      this.store.countTexts(TENANT, function () {
        this.viewMock.countTexts.should.have.been.calledWith(this.dbMock, TENANT, sinon.match.func);
        done();
      }.bind(this));

    });

  });

  describe('#updateTextMetadata()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should update text metadata by passing thru to handler module', function (done) {

      var id = uuid.v1();

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);
      created.id = id;

      this.viewMock.getTextByValue.callsArgWith(3, null, created);
      this.handlerMock.updateTextMetadata.callsArg(4);

      this.store.updateTextMetadata(TENANT, id, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.handlerMock.updateTextMetadata.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match(attrs), sinon.match.func);

        done(err);
      }.bind(this));

    });

    it('should return error if text value not unique', function (done) {

      var id = uuid.v1();

      var attrs = {
        value : 'testing'
      };

      var existing = generateCreatedObject(attrs);
      existing.id = id;

      var duplicate = generateCreatedObject(attrs);
      duplicate.id = uuid.v1();

      this.viewMock.getTextByValue.callsArgWith(3, null, duplicate);

      this.store.updateTextMetadata(TENANT, id, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.handlerMock.updateTextMetadata.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.NON_UNIQUE);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error if error occurred while determining if text value unique', function (done) {

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getTextByValue.callsArgWith(3, this.error);

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error if value attribute not provided', function (done) {

      var attrs = {};

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.not.have.been.called;
        this.dbMock.insert.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.REQUIRED_FIELD_MISSING);
        err.should.have.property('statusCode', httpstatus.BAD_REQUEST);

        done();
      }.bind(this));

    });

    it('should return error from cloudant on insert', function (done) {

      var attrs = {
        value : 'testing'
      };

      var created = generateCreatedObject(attrs);

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArgWith(1, this.error);

      this.store.createText(TENANT, attrs, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, attrs.value, sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match(attrs), sinon.match.func);

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

  });

  describe('#addClassesToText()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should add classes to text by passing thru to handler module', function (done) {

      this.handlerMock.addClassesToText.callsArg(4);

      var textid = uuid.v1();
      var classes = [uuid.v1(), uuid.v1()];

      this.store.addClassesToText(TENANT, textid, classes, function () {
        this.handlerMock.addClassesToText.should.have.been.calledWith(this.dbMock, TENANT, textid, classes, sinon.match.func);
        done();
      }.bind(this));

    });

  });

  describe('#removeClassesFromText()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should remove classes from text by passing thru to handler module', function (done) {

      this.handlerMock.removeClassesFromText.callsArg(4);

      var textid = uuid.v1();
      var classes = [uuid.v1(), uuid.v1()];

      this.store.removeClassesFromText(TENANT, textid, classes, function () {
        this.handlerMock.removeClassesFromText.should.have.been.calledWith(this.dbMock, TENANT, textid, classes, sinon.match.func);
        done();
      }.bind(this));

    });

  });

  describe('#deleteClass()', function () {

    function generateTextResults (length, classes) {
      var data = [];
      for (var i=0; i<length; i++) {
        // Make it so some entries don't have class
        // that is being deleted
        var classArray = classes.slice(0);
        if (i%2 === 0) {
          classArray.splice(0, 1);
        }
        var id = uuid.v1();
        var value = ('testtext' + i);
        data.push({
          '_id' : id,
          '_rev' : uuid.v1(),
          'tenant' : TENANT,
          'schema' : 'text',
          'value' : value,
          'classes' : classArray
        });
      }

      return data;
    }

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should delete text', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, value : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      this.fetchMock.getText.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);

      this.store.deleteText(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getText.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(existing._id, existing._rev, sinon.match.func);

        should.not.exist(err);
        done(err);
      }.bind(this));

    });

    it('should allow wildcard rev', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, value : 'testing'});
      var response = {
        ok : true,
        rev : existing._rev
      };

      var headers = {};

      this.fetchMock.getText.callsArgWith(3, null, existing);
      this.dbMock.destroy.callsArgWith(2, null, response, headers);

      this.store.deleteText(TENANT, id, '*', function (err, result) {
        this.fetchMock.getText.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.have.been.calledWith(existing._id, existing._rev, sinon.match.func);

        should.not.exist(err);
        done(err);
      }.bind(this));

    });

    it('should return error if unable to get current text', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, value : 'testing'});

      this.fetchMock.getText.callsArgWith(3, this.error);

      this.store.deleteText(TENANT, id, existing._rev, function (err, result) {
        this.fetchMock.getText.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.not.have.been.called;

        should.exist(err);
        err.should.equal(this.error);

        done();
      }.bind(this));

    });

    it('should return error on invalid rev', function (done) {

      var id = uuid.v1();

      var existing = generateCreatedObject({id : id, value : 'testing'});

      this.fetchMock.getText.callsArgWith(3, null, existing);

      this.store.deleteText(TENANT, id, uuid.v1(), function (err, result) {
        this.fetchMock.getText.should.have.been.calledWith(this.dbMock, TENANT, id, sinon.match.func);
        this.dbMock.destroy.should.not.have.been.called;

        should.exist(err);
        err.should.have.property('error', dberrors.CONFLICT);
        err.should.have.property('statusCode', httpstatus.CONFLICT);

        done();
      }.bind(this));

    });

  });

  describe('#deleteTenant()', function () {

    beforeEach( function (done) {
      this.store.start(done);
    });

    it('should delete tenant by passing thru to deletes module', function (done) {

      this.deleteMock.callsArg(2);

      this.store.deleteTenant(TENANT, function () {
        this.deleteMock.should.have.been.calledWith(this.dbMock, TENANT, sinon.match.func);
        done();
      }.bind(this));

    });

  });

  describe('#processImportEntry()', function () {

    function validateResult (result, textExpectation, classExpectations, textClassExpectations) {
      result.should.not.have.property('error');

      result.should.have.property('classes').that.is.an('array').with.length(classExpectations.length);
      classExpectations.forEach(function (expectation, index) {

        result.classes[index].should.have.property('name', expectation.name);
        result.classes[index].should.have.property('created', expectation.created);
        if (expectation.error) {
          result.classes[index].should.not.have.property('id')
          result.classes[index].should.have.property('error', this.error);
        } else {
          result.classes[index].should.have.property('id').that.is.a('string');
          result.classes[index].should.not.have.property('error');
        }
      }, this);

      result.should.have.property('text').that.is.an('object');
      result.text.should.have.property('id').that.is.a('string');
      result.text.should.have.property('value', textExpectation.value);
      result.text.should.have.property('created', textExpectation.created);
      result.text.should.not.have.property('error');

      result.text.should.have.property('classes').that.is.an('array').with.length(textClassExpectations.length);
      textClassExpectations.forEach(function (expectation, index) {
        result.text.classes[index].should.have.property('name', expectation.name);
        result.text.classes[index].should.have.property('created', expectation.created);
        if (expectation.error) {
          result.text.classes[index].should.not.have.property('id').that.is.a('string');
          result.text.classes[index].should.have.property('error', this.error);
        } else {
          result.text.classes[index].should.have.property('id').that.is.a('string');
          result.text.classes[index].should.not.have.property('error');
        }
      }, this);
    }

    beforeEach( function (done) {
      this.entry = {
        text : 'test-text',
        classes : ['test-class-1', 'test-class-2']
      };

      this.store.start(done);
    });

    it('should create text and all associated classes', function (done) {

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.viewMock.lookupClassesByName.callsArgWith(3, null, []);
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.have.been.calledWith(this.dbMock, TENANT, this.entry.classes, sinon.match.func);
        this.dbMock.insert.callCount.should.equal(1+this.entry.classes.length);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({value : this.entry.text}), sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({name : this.entry.classes[0]}), sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({name : this.entry.classes[1]}), sinon.match.func);

        var classExpectations = [{
          name : this.entry.classes[0],
          created : true
        }, {
          name : this.entry.classes[1],
          created : true
        }];

        validateResult.call(this, result,
                            {value : this.entry.text, created : true},
                            classExpectations,
                            classExpectations);
        done();
      }.bind(this));

    });

    it('should handle creating text with no associated classes', function (done) {

      delete this.entry.classes;

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.not.have.been.called;
        this.dbMock.insert.callCount.should.equal(1);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({value : this.entry.text}), sinon.match.func);

        validateResult.call(this, result,
                            {value : this.entry.text, created : true},
                            [],
                            []);
        done();
      }.bind(this));

    });

    it('should handle creating text with all associated classes already existing', function (done) {

      var existingClasses = this.entry.classes.map(function (elem) {
        var id = uuid.v1();
        return {
          id : id,
          key : [TENANT, elem],
          value : id
        };
      });
      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.viewMock.lookupClassesByName.callsArgWith(3, null, existingClasses);
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.have.been.calledWith(this.dbMock, TENANT, this.entry.classes, sinon.match.func);
        this.dbMock.insert.callCount.should.equal(1);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({value : this.entry.text}), sinon.match.func);

        var textClassExpectations = [{
          name : this.entry.classes[0],
          created : false
        }, {
          name : this.entry.classes[1],
          created : false
        }];

        validateResult.call(this, result,
                            {value : this.entry.text, created : true},
                            [],
                            textClassExpectations);
        done();
      }.bind(this));

    });

    it('should handle creating text with subset of associated classes existing', function (done) {

      var existingClasses = this.entry.classes.map(function (elem) {
        var id = uuid.v1();
        return {
          id : id,
          key : [TENANT, elem],
          value : id
        };
      });
      existingClasses.splice(0, 1);

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.viewMock.lookupClassesByName.callsArgWith(3, null, existingClasses);
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.have.been.calledWith(this.dbMock, TENANT, this.entry.classes, sinon.match.func);
        this.dbMock.insert.callCount.should.equal(1 + (this.entry.classes.length - existingClasses.length));
        this.dbMock.insert.should.have.been.calledWith(sinon.match({name : this.entry.classes[0]}), sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({value : this.entry.text}), sinon.match.func);

        var classExpectations = [{
          name : this.entry.classes[0],
          created : true
        }];

        var textClassExpectations = [{
          name : this.entry.classes[1],
          created : false
        }].concat(classExpectations);

        validateResult.call(this, result,
                            {value : this.entry.text, created : true},
                            classExpectations,
                            textClassExpectations);
        done();
      }.bind(this));

    });

    it('should update existing text with no classes with all new classes', function (done) {

      var id = uuid.v1();
      var textLookup = {
        id : id,
        key : [TENANT, this.entry.text],
        value : id
      };
      var existingText = {
        _id : id,
        _rev : uuid.v1(),
        schema : 'text',
        tenant : TENANT,
        value : this.entry.text,
        classes : []
      };

      this.viewMock.getTextByValue.callsArgWith(3, null, textLookup);
      this.fetchMock.getText.callsArgWith(3, null, existingText);
      this.viewMock.lookupClassesByName.callsArgWith(3, null, []);
      this.handlerMock.addClassesToText.callsArg(4);
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.have.been.calledWith(this.dbMock, TENANT, this.entry.classes, sinon.match.func);
        this.dbMock.insert.callCount.should.equal(this.entry.classes.length);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({name : this.entry.classes[0]}), sinon.match.func);
        this.dbMock.insert.should.have.been.calledWith(sinon.match({name : this.entry.classes[1]}), sinon.match.func);

        var classIdArray = [this.dbMock.insert.firstCall.args[0]._id, this.dbMock.insert.secondCall.args[0]._id];
        this.handlerMock.addClassesToText.should.have.been.calledWith(this.dbMock, TENANT, id, classIdArray, sinon.match.func);

        var classExpectations = [{
          name : this.entry.classes[0],
          created : true
        }, {
          name : this.entry.classes[1],
          created : true
        }];

        validateResult.call(this, result,
                            {value : this.entry.text, created : false},
                            classExpectations,
                            classExpectations);
        done();
      }.bind(this));

    });

    it('should update existing text with prior classes with some new classes', function (done) {

      var id = uuid.v1();
      var textLookup = {
        id : id,
        key : [TENANT, this.entry.text],
        value : id
      };

      var existingClasses = this.entry.classes.map(function (elem) {
        var id = uuid.v1();
        return {
          id : id,
          key : [TENANT, elem],
          value : id
        };
      });
      existingClasses.splice(0, 1);

      var existingText = {
        _id : id,
        _rev : uuid.v1(),
        schema : 'text',
        tenant : TENANT,
        value : this.entry.text,
        classes : [existingClasses[0].id]
      };

      this.viewMock.getTextByValue.callsArgWith(3, null, textLookup);
      this.fetchMock.getText.callsArgWith(3, null, existingText);
      this.viewMock.lookupClassesByName.callsArgWith(3, null, existingClasses);
      this.handlerMock.addClassesToText.callsArg(4);
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.have.been.calledWith(this.dbMock, TENANT, this.entry.classes, sinon.match.func);
        this.dbMock.insert.callCount.should.equal((this.entry.classes.length - existingClasses.length));
        this.dbMock.insert.should.have.been.calledWith(sinon.match({name : this.entry.classes[0]}), sinon.match.func);

        var classIdArray = [this.dbMock.insert.firstCall.args[0]._id];
        this.handlerMock.addClassesToText.should.have.been.calledWith(this.dbMock, TENANT, id, classIdArray, sinon.match.func);

        var classExpectations = [{
          name : this.entry.classes[0],
          created : true
        }];

        validateResult.call(this, result,
                            {value : this.entry.text, created : false},
                            classExpectations,
                            classExpectations);
        done();
      }.bind(this));

    });

    it('should set result.error attribute on error during init work', function (done) {

      this.viewMock.getTextByValue.callsArgWith(3, this.error);
      this.viewMock.lookupClassesByName.callsArgWith(3, null, []);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        this.viewMock.getTextByValue.should.have.been.calledWith(this.dbMock, TENANT, this.entry.text, sinon.match.func);
        this.viewMock.lookupClassesByName.should.have.been.calledWith(this.dbMock, TENANT, this.entry.classes, sinon.match.func);
        this.dbMock.insert.should.not.have.been.called;
        this.handlerMock.addClassesToText.should.not.have.been.called;

        should.not.exist(err);
        result.should.have.property('error', this.error);

        done();
      }.bind(this));

    });

    it('should set error attribute of result.text on text creation error', function (done) {

      delete this.entry.classes;

      this.viewMock.getTextByValue.callsArgWith(3, dberrors.notfound());
      this.dbMock.insert.callsArgWith(1, this.error);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        should.not.exist(err);
        result.should.have.property('text').that.is.an('object');
        result.text.should.have.property('error', this.error);
        result.text.should.have.not.property('id');
        result.text.should.have.property('value', this.entry.text);
        result.text.should.have.property('created', true);
        done();
      }.bind(this));

    });

    it('should set error attribute of result.text on text update error', function (done) {

      var id = uuid.v1();
      var textLookup = {
        id : id,
        key : [TENANT, this.entry.text],
        value : id
      };
      var existingText = {
        _id : id,
        _rev : uuid.v1(),
        schema : 'text',
        tenant : TENANT,
        value : this.entry.text,
        classes : []
      };

      this.viewMock.getTextByValue.callsArgWith(3, null, textLookup);
      this.fetchMock.getText.callsArgWith(3, null, existingText);
      this.viewMock.lookupClassesByName.callsArgWith(3, null, []);
      this.handlerMock.addClassesToText.callsArgWith(4, this.error);
      this.dbMock.insert.callsArg(1);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        should.not.exist(err);
        result.should.have.property('text').that.is.an('object');
        result.text.should.have.property('error', this.error);
        result.text.should.have.property('id');
        result.text.should.have.property('value', this.entry.text);
        result.text.should.have.property('created', false);

        done();
      }.bind(this));

    });

    it('should set error attribute of result.classes for any class unable to be created', function (done) {

      var id = uuid.v1();
      var textLookup = {
        id : id,
        key : [TENANT, this.entry.text],
        value : id
      };
      var existingText = {
        _id : id,
        _rev : uuid.v1(),
        schema : 'text',
        tenant : TENANT,
        value : this.entry.text,
        classes : []
      };

      this.viewMock.getTextByValue.callsArgWith(3, null, textLookup);
      this.fetchMock.getText.callsArgWith(3, null, existingText);
      this.viewMock.lookupClassesByName.callsArgWith(3, null, []);
      this.handlerMock.addClassesToText.callsArg(4);
      this.dbMock.insert.callsArgWith(1, this.error);

      this.store.processImportEntry(TENANT, this.entry, function (err, result) {
        should.not.exist(err);

        var classExpectations = [{
          name : this.entry.classes[0],
          created : true,
          error : this.error
        },{
          name : this.entry.classes[1],
          created : true,
          error : this.error
        }];

        validateResult.call(this, result,
                            {value : this.entry.text, created : false},
                            classExpectations,
                            classExpectations);

        done();
      }.bind(this));

    });

  });

});
