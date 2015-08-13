'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .directive('errorBar', function() {
    return {
      templateUrl: 'app/errorBar/errorBar.html',
      controller: 'ErrorBarCtrl',
      restrict: 'EA',
      replace: true
    };
  });
