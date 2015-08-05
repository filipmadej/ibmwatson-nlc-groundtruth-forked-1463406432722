'use strict';
/* global jasmine */

describe('Controller: NavigationCtrl', function() {

  var NavigationCtrl, scope, state, authentication;

  var TEST_TENANT_ID = 'TESTTENANTID';

  var TEST_USER = {
    'username': 'testuser@us.ibm.com',
    'tenants': [TEST_TENANT_ID],
    'id': 'user1'
  };

  // load the controller's module and mock dependencies
  beforeEach(function() {
    module('ibmwatson-nlc-groundtruth-app', function($provide) {
      $provide.factory('authentication', function($q) {
        return {
          checkStatus: jasmine.createSpy('checkStatus').andCallFake(function() {
            return $q.when(TEST_USER);
          }),
          getCurrentUser: jasmine.createSpy('getCurrentUser').andCallFake(function() {
            return $q.when(TEST_USER);
          }),
          logout: jasmine.createSpy('logout').andCallFake(function() {
            return $q.when(true);
          })
        };
      });

      state = {
        currentState: 'example',
        go: jasmine.createSpy('go'),
        reload: jasmine.createSpy('reload')
      };
    });
  });

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, _authentication_) {

    authentication = _authentication_;

    scope = $rootScope.$new();

    NavigationCtrl = $controller('NavigationCtrl', {
      $scope: scope,
      $state: state
    });

    // Expect a call to getCurrentUser before anything else happens
    $rootScope.$apply();

    expect(authentication.getCurrentUser).toHaveBeenCalled();

  }));

  it('should not be logged in after logging out', function() {

    scope.logout();
    scope.$apply();
    // User should have been directed to the bluemix login page
    expect(authentication.logout).toHaveBeenCalled();
    expect(scope.isLoggedIn).toBe(false);

    // User should have been directed to the bluemix login page
    expect(state.go).toHaveBeenCalledWith('login',{ message : { level : 'success', text : jasmine.any(String) }});

  });
});
