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

var fetch = proxyquire('./fetch', {
  '../log' : new mocks.LogMock()
});

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/db/fetch', function () {

  var TENANT = 'TEST';

  before( function () {
    this.dbMock = new mocks.DBMock();

    this.error = {error : 'test-generated', statusCode : 500};
  });

  beforeEach( function () {
    this.dbMock.reset();
  });


  describe('#getClass()', function () {

    beforeEach(function () {
      this.example = {
        '_id' : uuid.v1(),
        '_rev' : uuid.v1(),
        schema : 'class',
        tenant : TENANT,
        name : 'test',
        description : 'testing'
      };
    });

    it('should retrieve class', function () {

      this.dbMock.get.callsArgWith(1, null, this.example);

      fetch.getClass(this.dbMock, TENANT, this.example_id, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.equal(this.example);
      }.bind(this));

    });

    it('should return error from cloudant', function () {

      this.dbMock.get.callsArgWith(1, this.error);

      fetch.getClass(this.dbMock, TENANT, this.example_id, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.equal(this.error);
      }.bind(this));

    });

    it('should return error if object with wrong schema type is returned', function () {

      this.example.schema = 'fail';

      this.dbMock.get.callsArgWith(1, null, this.example);

      fetch.getClass(this.dbMock, TENANT, this.example_id, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.have.property('message').with.match(/unexpected object type/);
      }.bind(this));

    });

    it('should return error if object with wrong tenant is returned', function () {

      this.example.tenant = 'FAIL';

      this.dbMock.get.callsArgWith(1, null, this.example);

      fetch.getClass(this.dbMock, TENANT, this.example_id, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.have.property('message').with.match(/incorrect tenant/);
      }.bind(this));

    });

  });

  describe('#getText()', function () {

    beforeEach(function () {
      this.example = {
        '_id' : uuid.v1(),
        '_rev' : uuid.v1(),
        schema : 'text',
        tenant : TENANT,
        value : 'test',
        classes : [uuid.v1()]
      };
    });

    it('should retrieve class', function () {

      this.dbMock.get.callsArgWith(1, null, this.example);

      fetch.getText(this.dbMock, TENANT, this.example_id, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.equal(this.example);
      }.bind(this));

    });

    it('should return error from cloudant', function () {

      this.dbMock.get.callsArgWith(1, this.error);

      fetch.getText(this.dbMock, TENANT, this.example_id, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.equal(this.error);
      }.bind(this));

    });

  });

  describe('#getClasses()', function () {

    function generateClassResults (length) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var name = ('testclass' + i);
        data.push({
          '_id' : id,
          '_rev' : uuid.v1(),
          'tenant' : TENANT,
          'schema' : 'class',
          'name' : name
        });
      }

      return data;
    }

    beforeEach(function () {

      this.options = {
        skip : 0,
        limit : 100
      };

      this.results = {
        docs : generateClassResults(2)
      }

    });

    it('should retrieve classes', function () {

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getClasses(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-class');
        options.should.have.property('selector').that.deep.equals({tenant : TENANT, schema : 'class'});
      }.bind(this));

    });

    it('should handle optional fields parameter', function () {

      this.options.fields = ['_id'];

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getClasses(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('fields', this.options.fields);
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-class');
        options.should.have.property('selector').that.deep.equals({tenant : TENANT, schema : 'class'});
      }.bind(this));

    });

    it('should return error from cloudant', function () {

      this.dbMock.find.callsArgWith(1, this.error);

      fetch.getClasses(this.dbMock, TENANT, this.options, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.equal(this.error);
      }.bind(this));

    });

  });

  describe('#getTexts()', function () {

    function generateTextResults (length) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var value = ('testtext' + i);
        data.push({
          '_id' : id,
          '_rev' : uuid.v1(),
          'tenant' : TENANT,
          'schema' : 'text',
          'value' : value,
          'classes' : [uuid.v1()]
        });
      }

      return data;
    }

    beforeEach(function () {

      this.options = {
        skip : 0,
        limit : 100
      };

      this.results = {
        docs : generateTextResults(2)
      }

    });

    it('should retrieve texts', function () {

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getTexts(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-text');
        options.should.have.property('selector').that.deep.equals({tenant : TENANT, schema : 'text'});
      }.bind(this));

    });

    it('should handle optional fields parameter', function () {

      this.options.fields = ['_id'];

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getTexts(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('fields', this.options.fields);
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-text');
        options.should.have.property('selector').that.deep.equals({tenant : TENANT, schema : 'text'});
      }.bind(this));

    });

    it('should handle optional value parameter', function () {

      this.options.value = ['test'];

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getTexts(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('selector').that.deep.equals({tenant : TENANT, schema : 'text', value : { $regex : '.*' + this.options.value + '.*'}});
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-text');
      }.bind(this));

    });

    it('should return error from cloudant', function () {

      this.dbMock.find.callsArgWith(1, this.error);

      fetch.getTexts(this.dbMock, TENANT, this.options, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.equal(this.error);
      }.bind(this));

    });

  });

  describe('#getTextsWithClass()', function () {


    function generateTextResults (length, classid) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var value = ('testtext' + i);
        data.push({
          '_id' : id,
          '_rev' : uuid.v1(),
          'tenant' : TENANT,
          'schema' : 'text',
          'value' : value,
          'classes' : [uuid.v1(), classid]
        });
      }

      return data;
    }

    beforeEach(function () {

      this.options = {
        skip : 0,
        limit : 100,
        class : uuid.v1()
      };

      this.results = {
        docs : generateTextResults(2, this.options.class)
      }

    });

    it('should retrieve texts with given class', function () {

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getTextsWithClass(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-text-with-class');
        options.should.have.property('selector').that.deep.equals({
          tenant : TENANT,
          schema : 'text',
          value : {
            '$gt' : null
          },
          classes : {
              '$elemMatch' : {
                  '$eq' : this.options.class
              }
          }
        });
      }.bind(this));

    });


    it('should default skip/limit parameters', function () {

      delete this.options.skip;
      delete this.options.limit;

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getTextsWithClass(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('skip', 0);
        options.should.have.property('limit', 100);
        options.should.have.property('use_index', 'search-text-with-class');
        options.should.have.property('selector').that.deep.equals({
          tenant : TENANT,
          schema : 'text',
          value : {
            '$gt' : null
          },
          classes : {
              '$elemMatch' : {
                  '$eq' : this.options.class
              }
          }
        });
      }.bind(this));

    });

    it('should handle optional fields parameter', function () {

      this.options.fields = ['_id'];

      this.dbMock.find.callsArgWith(1, null, this.results);

      fetch.getTextsWithClass(this.dbMock, TENANT, this.options, function (err, result) {
        var options = this.dbMock.find.lastCall.args[0];
        should.exist(options);
        options.should.have.property('fields', this.options.fields);
        options.should.have.property('skip', this.options.skip);
        options.should.have.property('limit', this.options.limit);
        options.should.have.property('use_index', 'search-text-with-class');
        options.should.have.property('selector').that.deep.equals({
          tenant : TENANT,
          schema : 'text',
          value : {
            '$gt' : null
          },
          classes : {
              '$elemMatch' : {
                  '$eq' : this.options.class
              }
          }
        });
      }.bind(this));

    });

    it('should return error from cloudant', function () {

      this.dbMock.find.callsArgWith(1, this.error);

      fetch.getTextsWithClass(this.dbMock, TENANT, this.options, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.equal(this.error);
      }.bind(this));

    });

  });

});
