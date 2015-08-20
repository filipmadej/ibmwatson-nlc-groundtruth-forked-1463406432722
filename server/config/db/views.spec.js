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

var views = require('./views');

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/db/views', function () {

  var TENANT = 'TEST';

  before( function () {
    this.dbMock = new mocks.DBMock();
  });

  beforeEach( function () {
    this.dbMock.reset();
  });

  describe('#getClasses()', function () {

    function generateClassesResults (length) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var name = ('testclass' + i);
        data.push({
          'id' : id,
          'key' : [
            TENANT,
            name
          ],
          'value' : id,
          'doc' : {
            '_id' : id,
            '_rev' : uuid.v1(),
            'tenant' : TENANT,
            'schema' : 'class',
            'name' : name
          }
        });
      }

      return data;

    }

    it('should return classes', function (done) {

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : generateClassesResults(3)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getClasses(this.dbMock, TENANT, {}, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('startkey').that.deep.equals([TENANT]);
        options.should.have.property('endkey').that.deep.equals([TENANT, []]);
        options.should.have.property('skip', 0);
        options.should.have.property('limit', 10);
        options.should.have.property('reduce', false);
        options.should.have.property('include_docs', true);
        results.should.be.an('array').with.length(data.rows.length);
        results.should.deep.equal([
          {
              id : data.rows[0].doc._id,
              name : data.rows[0].doc.name
          },
          {
              id : data.rows[1].doc._id,
              name : data.rows[1].doc.name
          },
          {
              id : data.rows[2].doc._id,
              name : data.rows[2].doc.name
          }
        ]);
        done();
      }.bind(this));
    });

    it('should allow skip/limit overrides', function (done) {

      var data = {
        'total_rows' : 125,
        'offset' : 10,
        'rows' : generateClassesResults(3)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      var overrides = {
        skip : 10,
        limit : 100
      };

      views.getClasses(this.dbMock, TENANT, overrides, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('skip', overrides.skip);
        options.should.have.property('limit', overrides.limit);
        options.should.have.property('reduce', false);
        options.should.have.property('include_docs', true);
        results.should.be.an('array').with.length(data.rows.length);
        done();
      }.bind(this));
    });

    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.getClasses(this.dbMock, TENANT, {}, function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#countClasses()', function () {

    function generateClassCountResult (count) {
      var result = {
        'rows' : [
          {
            'key' : [TENANT],
            'value' : count
          }
        ]
      };
      return result;
    }

    it('should return count', function (done) {

      var count = 100;

      this.dbMock.view.callsArgWith(3, null, generateClassCountResult(count));

      views.countClasses(this.dbMock, TENANT, function (err, result) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('startkey').that.deep.equals([TENANT]);
        options.should.have.property('endkey').that.deep.equals([TENANT, []]);
        options.should.have.property('group', true);
        options.should.have.property('group_level', 1);
        result.should.equal(count);
        done();
      }.bind(this));
    });

    it('should return 0 if no results found', function (done) {

      this.dbMock.view.callsArgWith(3, null, {rows : []});

      views.countClasses(this.dbMock, TENANT, function (err, result) {
        result.should.equal(0);
        done();
      }.bind(this));
    });


    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.countClasses(this.dbMock, TENANT, function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

describe('#lookupClasses()', function () {

    function generateLookupClassesResults (length) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        data.push({
          'id' : id,
          'key' : [TENANT, id],
          'value' : id
        });
      }

      return data;
    }

    it('should return existing classes', function (done) {

      var data = {
        'total_rows' : 125,
        'offset' : 10,
        'rows' : generateLookupClassesResults(2)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      var ids = ['doesnotexist', data.rows[0].id, data.rows[1].id];

      views.lookupClasses(this.dbMock, TENANT, ids, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('keys').that.deep.equals(ids.map(function (elem) {return [TENANT, elem]}));
        options.should.have.property('reduce', false);
        results.should.deep.equal(data.rows);
        done();
      }.bind(this));
    });

    it('should not require array', function (done) {

      var data = {
        'total_rows' : 125,
        'offset' : 10,
        'rows' : generateLookupClassesResults(1)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.lookupClasses(this.dbMock, TENANT, data.rows[0].id, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('keys').that.deep.equals([[TENANT, data.rows[0].id]]);
        results.should.deep.equal(data.rows);
        done();
      }.bind(this));
    });

    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.lookupClasses(this.dbMock, TENANT, [], function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#getTexts()', function () {

    function generateTextsResults (length) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var value = ('testtext' + i);
        data.push({
          'id' : id,
          'key' : [
            TENANT,
            value
          ],
          'value' : id,
          'doc' : {
            '_id' : id,
            '_rev' : uuid.v1(),
            'tenant' : TENANT,
            'schema' : 'text',
            'value' : value,
            'classes' : [uuid.v1()]
          }
        });
      }

      return data;

    }

    it('should return texts', function (done) {

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : generateTextsResults(3)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getTexts(this.dbMock, TENANT, {}, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('startkey').that.deep.equals([TENANT]);
        options.should.have.property('endkey').that.deep.equals([TENANT, []]);
        options.should.have.property('skip', 0);
        options.should.have.property('limit', 10);
        options.should.have.property('reduce', false);
        options.should.have.property('include_docs', true);
        results.should.be.an('array').with.length(data.rows.length);
        results.should.deep.equal([
          {
              id : data.rows[0].doc._id,
              value : data.rows[0].doc.value,
              classes : data.rows[0].doc.classes
          },
          {
              id : data.rows[1].doc._id,
              value : data.rows[1].doc.value,
              classes : data.rows[1].doc.classes
          },
          {
              id : data.rows[2].doc._id,
              value : data.rows[2].doc.value,
              classes : data.rows[2].doc.classes
          }
        ]);
        done();
      }.bind(this));
    });

    it('should allow skip/limit overrides', function (done) {

      var data = {
        'total_rows' : 125,
        'offset' : 10,
        'rows' : generateTextsResults(3)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      var overrides = {
        skip : 10,
        limit : 100
      };

      views.getTexts(this.dbMock, TENANT, overrides, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('skip', overrides.skip);
        options.should.have.property('limit', overrides.limit);
        options.should.have.property('reduce', false);
        options.should.have.property('include_docs', true);
        results.should.be.an('array').with.length(data.rows.length);
        done();
      }.bind(this));
    });

    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.getTexts(this.dbMock, TENANT, {}, function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#countTexts()', function () {

    function generateTextCountResult (count) {
      var result = {
        'rows' : [
          {
            'key' : [TENANT],
            'value' : count
          }
        ]
      };
      return result;
    }

    it('should return count', function (done) {

      var count = 100;

      this.dbMock.view.callsArgWith(3, null, generateTextCountResult(count));

      views.countTexts(this.dbMock, TENANT, function (err, result) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('startkey').that.deep.equals([TENANT]);
        options.should.have.property('endkey').that.deep.equals([TENANT, []]);
        options.should.have.property('group', true);
        options.should.have.property('group_level', 1);
        result.should.equal(count);
        done();
      }.bind(this));
    });


    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.countTexts(this.dbMock, TENANT, function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#getDocumentsInTenant()', function () {

    function generateTenantDocResults (length) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var value = ('testtext' + i);
        data.push({
          'id' : id,
          'key' : TENANT,
          'value' : {
            '_id' : id,
            '_rev' : uuid.v1()
          }
        });
      }

      return data;

    }

    it('should return docs', function (done) {

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : generateTenantDocResults(3)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getDocumentsInTenant(this.dbMock, TENANT, {}, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('key').that.equals(TENANT);
        options.should.have.property('skip', 0);
        options.should.have.property('limit', 1000);
        options.should.have.property('reduce', false);
        results.should.be.an('array').with.length(data.rows.length);
        results.should.deep.equal([
          {
              _id : data.rows[0].value._id,
              _rev : data.rows[0].value._rev
          },
          {
              _id : data.rows[1].value._id,
              _rev : data.rows[1].value._rev
          },
          {
              _id : data.rows[2].value._id,
              _rev : data.rows[2].value._rev
          }
        ]);
        done();
      }.bind(this));
    });

    it('should allow skip/limit overrides', function (done) {

      var data = {
        'total_rows' : 2150,
        'offset' : 100,
        'rows' : generateTenantDocResults(3)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      var overrides = {
        skip : 100,
        limit : 2000
      };

      views.getDocumentsInTenant(this.dbMock, TENANT, overrides, function (err, results) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('skip', overrides.skip);
        options.should.have.property('limit', overrides.limit);
        options.should.have.property('reduce', false);
        results.should.be.an('array').with.length(data.rows.length);
        done();
      }.bind(this));
    });

    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.getDocumentsInTenant(this.dbMock, TENANT, {}, function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#countDocumentsInTenant()', function () {

    function generateTenantDocCountResult (count) {
      var result = {
        'rows' : [
          {
            'key' : TENANT,
            'value' : count
          }
        ]
      };
      return result;
    }

    it('should return count', function (done) {

      var count = 100;

      this.dbMock.view.callsArgWith(3, null, generateTenantDocCountResult(count));

      views.countDocumentsInTenant(this.dbMock, TENANT, function (err, result) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('key').that.equals(TENANT);
        options.should.have.property('group', true);
        options.should.have.property('reduce', true);
        result.should.equal(count);
        done();
      }.bind(this));
    });


    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.countDocumentsInTenant(this.dbMock, TENANT, function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#getClassByName()', function () {

    function generateClassByNameResults (length, expected) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var name = ((i === 0) ? expected : ('testclass' + i));
        data.push({
          'id' : id,
          'key' : [TENANT, name],
          'value' : id
        });
      }

      return data;

    }

    it('should return single class', function (done) {

      var expectedName = 'testing';

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : generateClassByNameResults(1, expectedName)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getClassByName(this.dbMock, TENANT, expectedName, function (err, result) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('key').that.deep.equals([TENANT, expectedName]);
        options.should.have.property('reduce', false);
        result.should.deep.equal(data.rows[0]);
        done();
      }.bind(this));
    });

    it('should return error if too many results found', function (done) {

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : generateClassByNameResults(2, 'nonunique')
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getClassByName(this.dbMock, TENANT, 'nonunique', function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

    it('should return error if no results found', function (done) {

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : []
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getClassByName(this.dbMock, TENANT, 'doesnotexist', function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.getClassByName(this.dbMock, TENANT, 'testing', function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

  describe('#getTextByValue()', function () {

    function generateTextByValueResults (length, expected) {
      var data = [];
      for (var i=0; i<length; i++) {
        var id = uuid.v1();
        var value = ((i === 0) ? expected : ('testtext' + i));
        data.push({
          'id' : id,
          'key' : [TENANT, value],
          'value' : id
        });
      }

      return data;

    }

    it('should return single text', function (done) {

      var expectedValue = 'testing';

      var data = {
        'total_rows' : 5,
        'offset' : 0,
        'rows' : generateTextByValueResults(1, expectedValue)
      };

      this.dbMock.view.callsArgWith(3, null, data);

      views.getTextByValue(this.dbMock, TENANT, expectedValue, function (err, result) {
        var options = this.dbMock.view.lastCall.args[2];
        should.exist(options);
        options.should.have.property('key').that.deep.equals([TENANT, expectedValue]);
        options.should.have.property('reduce', false);
        result.should.deep.equal(data.rows[0]);
        done();
      }.bind(this));
    });

    it('should return cloudant error', function (done) {

      var error = {error : 'test-generated', statusCode : 500};

      this.dbMock.view.callsArgWith(3, error);

      views.getTextByValue(this.dbMock, TENANT, 'testing', function (err, results) {
        should.not.exist(results);
        should.exist(err);
        done();
      }.bind(this));
    });

  });

});
