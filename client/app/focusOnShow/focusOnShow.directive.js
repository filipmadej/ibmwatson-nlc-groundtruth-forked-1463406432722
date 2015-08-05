'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
    .directive('showFocus', function($timeout) {
        return function(scope, element, attrs) {
            scope.$watch(attrs.showFocus,
                function(newValue) {
                    $timeout(function() {
                        newValue && element.focus();
                    });
                }, true);
        };
    });
