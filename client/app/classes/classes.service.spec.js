'use strict';

describe('Controller: ClustersListCtrl', function() {

    var $httpBackend;
    var TENANT = 'myTenant', EP_CLASSES = 'http://classes';

    // load the controller's module
    beforeEach(module('ibmwatson-nlc-groundtruth-app'));

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
    }));

    it('should query some stuff', inject(function(classes/*, endpoints, session*/) {
      $httpBackend.expectGET(EP_CLASSES + '/' + TENANT + '/classes');
      classes.query({param: 'something'}, function(){
        console.log('callbacked');
      });
      $httpBackend.flush();
    }));

});
