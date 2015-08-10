'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .directive('showFocus', function init ($timeout) {
    return function focus (scope, element, attrs) {
      scope.$watch(attrs.showFocus,
        function watch (newValue) {
          $timeout(function focus () {
            if (newValue) {
              element.focus();
            }
          });
        }, true);
    };
  });
