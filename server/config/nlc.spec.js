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

describe('/server/config/nlc', function () {

  beforeEach(function () {

    this.serviceConfig = {
      name : 'test-service',
      credentials : {
        url : 'https://test.com',
        username : 'username',
        password : 'password',
        version : 'v1'
      }
    }

    this.appMock = {
      getService : sinon.stub()
    };
    this.appMock.getService.returns(this.serviceConfig);

    this.cfMock = {
      getAppEnv : sinon.stub()
    };
    this.cfMock.getAppEnv.returns(this.appMock);

    this.overrides = {
        'cfenv' : this.cfMock
    };
  });

  it('should read nlc credentials', function () {

    var nlc = proxyquire('./nlc', this.overrides);
    nlc.id.should.equal(this.serviceConfig.name);
    nlc.url.should.equal(this.serviceConfig.credentials.url);
    nlc.username.should.equal(this.serviceConfig.credentials.username);
    nlc.password.should.equal(this.serviceConfig.credentials.password);
    nlc.version.should.equal(this.serviceConfig.credentials.version);

  });

  it('should return empty object if nlc service not defined', function () {
    this.appMock.getService.returns(undefined);
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.should.deep.equal({});
  });


  it('should default version to v1 if attribute not defined', function () {
    delete this.serviceConfig.credentials.version;
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.id.should.equal(this.serviceConfig.name);
    nlc.url.should.equal(this.serviceConfig.credentials.url);
    nlc.username.should.equal(this.serviceConfig.credentials.username);
    nlc.password.should.equal(this.serviceConfig.credentials.password);
    nlc.version.should.equal('v1');
  });

  it('should grab the first service regardless of name', function grabFirstService() {
    this.serviceConfig.name = 'changed-name';
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.id.should.equal(this.serviceConfig.name);
    nlc.url.should.equal(this.serviceConfig.credentials.url);
    nlc.username.should.equal(this.serviceConfig.credentials.username);
    nlc.password.should.equal(this.serviceConfig.credentials.password);
    nlc.version.should.equal('v1');
  });

  it('should fall back to discover the service from VCAP_SERVICES when not declared', function vcapFallback() {
    var oldVCAP = process.env.VCAP_SERVICES;
    var credentials = { "natural_language_classifier": [ { "name": "burrito_classifier", "label": "natural_language_classifier", "plan": "standard", "credentials": { "url": "https://gateway.watsonplatform.net/natural-language-classifier/api", "username": "burrito-3de5-474d-8f66-41c5db7cc84d", "password": "guacamole" } } ], "cloudantNoSQLDB": [ { "name": "ibmwatson-nlc-cloudant", "label": "cloudantNoSQLDB", "plan": "Shared", "credentials": { "username": "9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix", "password": "burrito", "host": "9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix.cloudant.com", "port": 443, "url": "https://9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix:burrito@9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix.cloudant.com" } } ]};
    process.env.VCAP_SERVICES = JSON.stringify(credentials);

    delete this.serviceConfig;
    delete this.getService;
    delete this.overrides.cfenv;
    var services = JSON.parse(process.env.VCAP_SERVICES);
    if (services.natural_language_classifier instanceof Array &&
      services.natural_language_classifier.length > 0 &&
      services.natural_language_classifier[0].name) {
      console.log("foo");
    }
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.id.should.equal(credentials.natural_language_classifier[0].name);
    nlc.url.should.equal(credentials.natural_language_classifier[0].credentials.url);
    nlc.username.should.equal(credentials.natural_language_classifier[0].credentials.username);
    nlc.password.should.equal(credentials.natural_language_classifier[0].credentials.password);
    nlc.version.should.equal('v1');
    process.env.VCAP_SERVICES = oldVCAP;
  });

  it('should return empty if nlc service is not declared and VCAP_SERVICES is empty array', function vcapEmptyArray() {
    var oldVCAP = process.env.VCAP_SERVICES;
    process.env.VCAP_SERVICES = '{ "natural_language_classifier": [ ], "cloudantNoSQLDB": [ { "name": "ibmwatson-nlc-cloudant", "label": "cloudantNoSQLDB", "plan": "Shared", "credentials": { "username": "9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix", "password": "bfc64c57b6672ccc524aa218ad09215148fd35ab4d54e487a63ab877efface35", "host": "9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix.cloudant.com", "port": 443, "url": "https://9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix:bfc64c57b6672ccc524aa218ad09215148fd35ab4d54e487a63ab877efface35@9009cd8d-TACO-451b-b2c7-641452c58db0-bluemix.cloudant.com" } } ]}';
    this.appMock.getService.returns(undefined);
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.should.deep.equal({});
    process.env.VCAP_SERVICES = oldVCAP;
  });

  it('should return nothing when VCAP_SERVICES is not set', function vcapEmpty() {
    var oldVCAP = process.env.VCAP_SERVICES;
    delete process.env.VCAP_SERVICES;
    this.appMock.getService.returns(undefined);
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.should.deep.equal({});
    process.env.VCAP_SERVICES = oldVCAP;
  });

  it('should return nothing when VCAP_SERVICES is not JSON', function vcapNotJSON() {
    var oldVCAP = process.env.VCAP_SERVICES;
    process.env.VCAP_SERVICES = "NOT A JSON STRING";
    this.appMock.getService.returns(undefined);
    var nlc = proxyquire('./nlc', this.overrides);
    nlc.should.deep.equal({});
    process.env.VCAP_SERVICES = oldVCAP;
  });
});
