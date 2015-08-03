'use strict';

describe('Service: authentication', function () {

    // load the service's module and mock $cookies
    beforeEach(module('ibmwatsonQaGroundtruthUiApp'));

    // instantiate service
    var authentication, endpoints, $httpBackend;

    //var AUTH_API = 'https://wdctoolslocal.net/auth';

    beforeEach(inject(function ($injector, _authentication_, _endpoints_) {
        authentication = _authentication_;
        endpoints = _endpoints_;

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.when('GET', endpoints.auth)
            .respond(200);
    }));

    it('should exist', function() {
        expect(!!authentication).toBe(true);
    });

    it('should use the \'checkStatus\' function to check whether a user is logged in on the server', function () {
        $httpBackend.expectGET(endpoints.auth);
        authentication.checkStatus();
    });

});
