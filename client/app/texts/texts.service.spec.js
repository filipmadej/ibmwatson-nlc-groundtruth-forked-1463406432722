'use strict';

describe('Service: texts', function() {

    var $httpBackend;
    var TENANT = 'myTenant', EP_TEXTS = 'http://texts';
    var TEXT_ID = 'id123456';

    // load the controller's module
    beforeEach(module('ibmwatson-nlc-groundtruth-app'));

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
      var cbFcnCalled = false;
      $httpBackend.expectGET(EP_TEXTS + '/' + TENANT + '/texts');
      texts.query({param: 'something'}, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));

    it('should call a POST request to the texts endpoint and run a callback function when running the post function', inject(function(texts/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectPOST(EP_TEXTS + '/' + TENANT + '/texts');
      texts.post({param: 'something'}, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));

    it('should call a DELETE request to the texts endpoint and run a callback function when running the remove function', inject(function(texts/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectDELETE(EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID);
      texts.remove(TEXT_ID, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));

    it('should call a PATCH request to the texts endpoint and run a callback function when running the replace function', inject(function(texts/*, endpoints, session*/) {
      var cbFcnCalled = false;
      $httpBackend.expectPATCH(EP_TEXTS + '/' + TENANT + '/texts/' + TEXT_ID);
      texts.update(TEXT_ID, {param: 'something'}, function(){
        cbFcnCalled = true;
      });
      $httpBackend.flush();
      expect(cbFcnCalled).toBeTruthy();
    }));
});
