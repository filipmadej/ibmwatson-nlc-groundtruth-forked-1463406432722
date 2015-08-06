'use strict';

angular.module('ibmwatson-common-ui-components',[])
  .directive('watsonFooter', function() {
    return {
      template: '<footer class="footer ibm-footer"><ul class="list-inline ibm-list-inline"><li>&#169; 2015 International Business Machines</li></ul></footer>',
      restrict: 'EA',
      replace: true
    };
  })
  .directive('watsonLoading', function() {
    return {
      template: '<div class="ibm-loading"><div class="ibm-loading-img"></div><p class="ibm-loading-message" ng-if="loadingMessage">{{ loadingMessage }}</p></div>',
      restrict: 'EA',
      replace: true,
      scope : {
        loadingMessage : '=',
      }
    };
  });
