'use strict';

describe('Controller: ClustersCtrl', function () {

  // load the controller's module
  beforeEach(module('ibmwatson-nlc-groundtruth-app'));

  var ClustersCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ClustersCtrl = $controller('ClustersCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
