angular.module('watsonLoading/watsonLoading.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('watsonLoading/watsonLoading.html',
    '<div class="ibm-loading">\n' +
    '  <div class="ibm-loading-img"></div>\n' +
    '  <p class="ibm-loading-message" ng-if="loadingMessage">{{ loadingMessage }}</p>\n' +
    '</div>\n' +
    '');
}]);
