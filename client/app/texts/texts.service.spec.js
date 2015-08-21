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

describe('Service: texts', function() {

  var $httpBackend;
  var TENANT = 'myTenant', EP_TEXTS = 'https://texts';
  var TEXT_ID = 'id123456';

  // load the controller's module
  beforeEach(module('ibmwatson-nlc-groundtruth-app'));

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  beforeEach(function() {
    var endpointsMock = {
      texts: EP_TEXTS
    };

    var sessionMock = {
      tenant: TENANT
    };

    module(function($provide) {
      $provide.constant('endpoints', endpointsMock);
    });

    module(function($provide) {
      $provide.value('session', sessionMock);
    });
  });

  // Initialize the controller and a mock scope
  beforeEach(inject(function($injector) {
    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('GET', EP_TEXTS + '/' + TENANT + '/texts').respond(200);
    $httpBackend.when('POST', EP_TEXTS + '/' + TENANT + '/texts').respond(200);
    $httpBackend.when('DELETE', EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID).respond(200);
    $httpBackend.when('PATCH', EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID).respond(200);
  }));

  it('should call a GET request to the texts endpoint and run a callback function when running the query function', inject(function(texts/*, endpoints, session*/) {
    var success = false;
    $httpBackend.expectGET(EP_TEXTS + '/' + TENANT + '/texts');
    texts.query({param: 'something'}).then(function () {
      success = true;
    }, function error () {
      success = false;
    });
    $httpBackend.flush();
    expect(success).toBeTruthy();
  }));

  it('should call a POST request to the texts endpoint and run a callback function when running the post function', inject(function(texts/*, endpoints, session*/) {
    var success = false;
    $httpBackend.expectPOST(EP_TEXTS + '/' + TENANT + '/texts');
    texts.post({param: 'something'}).then(function () {
      success = true;
    }, function error () {
      success = false;
    });
    $httpBackend.flush();
    expect(success).toBeTruthy();
  }));

  it('should call a DELETE request to the texts endpoint and run a callback function when running the remove function', inject(function(texts/*, endpoints, session*/) {
    var success = false;
    $httpBackend.expectDELETE(EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID);
    texts.remove(TEXT_ID).then(function () {
      success = true;
    }, function error () {
      success = false;
    });
    $httpBackend.flush();
    expect(success).toBeTruthy();
  }));

  it('should call a PATCH request to the texts endpoint and run a callback function when running the replace function', inject(function(texts/*, endpoints, session*/) {
    var success = false;
    $httpBackend.expectPATCH(EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID);
    texts.update(TEXT_ID, {param: 'something'}).then(function () {
      success = true;
    }, function error () {
      success = false;
    });
    $httpBackend.flush();
    expect(success).toBeTruthy();
  }));

  it('should call a POST request to the texts endpoint and run a callback function when running the addClasses function', inject(function(texts/*, endpoints, session*/) {
    var success = false;
    $httpBackend.expectPATCH(EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID);
    texts.addClasses(TEXT_ID, [{param: 'something'}]).then(function () {
      success = true;
    }, function error () {
      success = false;
    });
    $httpBackend.flush();
    expect(success).toBeTruthy();
  }));

  it('should call a DELETE request to the texts endpoint and run a callback function when running the removeClasses function', inject(function(texts/*, endpoints, session*/) {
    var success = false;
    $httpBackend.expectPATCH(EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID);
    texts.removeClasses(TEXT_ID, [{param: 'something'}]).then(function () {
      success = true;
    }, function error () {
      success = false;
    });
    $httpBackend.flush();
    expect(success).toBeTruthy();
  }));
});
