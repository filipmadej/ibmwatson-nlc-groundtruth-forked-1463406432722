'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('NavbarCtrl', function init ($scope, $location) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

    $scope.isCollapsed = true;

    $scope.isActive = function isActive (route) {
      return route === $location.path();
    };
  });
