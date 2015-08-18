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

describe('Service: classes', function() {

    var $httpBackend;
    var TENANT = 'myTenant', EP_CLASSES = 'http://classes';
    var CLASS_ID = 'id123456';

    // load the controller's module
    beforeEach(module('ibmwatson-nlc-groundtruth-app'));

    // Defer resolution of state transitions so we can test this in isolation
    beforeEach(module(function($urlRouterProvider) {
      $urlRouterProvider.deferIntercept();
    }));

    beforeEach(function() {
      var endpointsMock = {
            classes: EP_CLASSES
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

      $httpBackend.when('GET', EP_CLASSES + '/' + TENANT + '/classes').respond(200);
      $httpBackend.when('POST', EP_CLASSES + '/' + TENANT + '/classes').respond(200);
      $httpBackend.when('DELETE', EP_CLASSES + '/' + TENANT + '/classes/' + CLASS_ID).respond(200);
      $httpBackend.when('PUT', EP_CLASSES + '/' + TENANT + '/classes/' + CLASS_ID).respond(200);
    }));

    it('should call a GET request to the classes endpoint and run a callback function when running the query function', inject(function(classes/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectGET(EP_CLASSES + '/' + TENANT + '/classes');
      classes.query({param: 'something'}, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));

    it('should call a POST request to the classes endpoint and run a callback function when running the post function', inject(function(classes/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectPOST(EP_CLASSES + '/' + TENANT + '/classes');
      classes.post({param: 'something'}, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));

    it('should call a DELETE request to the classes endpoint and run a callback function when running the remove function', inject(function(classes/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectDELETE(EP_CLASSES + '/' + TENANT + '/classes/' + CLASS_ID);
      classes.remove(CLASS_ID, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));

    it('should call a PUT request to the classes endpoint and run a callback function when running the replace function', inject(function(classes/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectPUT(EP_CLASSES + '/' + TENANT + '/classes/' + CLASS_ID);
      classes.update(CLASS_ID, {param: 'something'}, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));
});
