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

var objects = require('./objects');

describe('/server/config/db/objects', function () {

  var TENANT = 'TEST';


  describe('#prepareClassInfo()', function () {
    it('should return object with only supported properties', function () {

      var attrs = {
        name : 'test',
        description : 'testing',
        ignored : true
      };

      var sanitized = objects.prepareClassInfo(TENANT, attrs);
      sanitized.should.have.property('name', attrs.name);
      sanitized.should.have.property('description', attrs.description);
      sanitized.should.have.property('_id');
      sanitized.should.have.property('schema', 'class');
      sanitized.should.not.have.property('ignored');
    });

    it('should use id if provided', function () {

      var attrs = {
        id : 'test-id',
        _id : 'ignored',
        name : 'test',
        description : 'testing',
        ignored : true
      };

      var sanitized = objects.prepareClassInfo(TENANT, attrs);
      sanitized.should.have.property('name', attrs.name);
      sanitized.should.have.property('description', attrs.description);
      sanitized.should.have.property('_id', attrs.id);
      sanitized.should.have.property('schema', 'class');
      sanitized.should.not.have.property('ignored');
    });

  });

  describe('#prepareTextInfo()', function () {
    it('should return object with only supported properties', function () {

      var attrs = {
        value : 'testing',
        classes : ['class'],
        ignored : true
      };

      var sanitized = objects.prepareTextInfo(TENANT, attrs);
      sanitized.should.have.property('value', attrs.value);
      sanitized.should.have.property('classes', attrs.classes);
      sanitized.should.have.property('_id');
      sanitized.should.have.property('schema', 'text');
      sanitized.should.not.have.property('ignored');
    });

    it('should use id if provided', function () {

      var attrs = {
        id : 'test-id',
        _id : 'ignored',
        value : 'testing',
        classes : ['class'],
        ignored : true
      };

      var sanitized = objects.prepareTextInfo(TENANT, attrs);
      sanitized.should.have.property('value', attrs.value);
      sanitized.should.have.property('classes', attrs.classes);
      sanitized.should.have.property('_id', attrs.id);
      sanitized.should.have.property('schema', 'text');
      sanitized.should.not.have.property('ignored');
    });

    it('should not require classes', function () {

      var attrs = {
        value : 'testing'
      };

      var sanitized = objects.prepareTextInfo(TENANT, attrs);
      sanitized.should.have.property('value', attrs.value);
      sanitized.should.not.have.property('classes');
    });

  });

});
