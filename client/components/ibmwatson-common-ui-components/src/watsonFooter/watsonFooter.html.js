angular.module('watsonFooter/watsonFooter.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('watsonFooter/watsonFooter.html',
    '<footer class="footer ibm-footer">\n' +
    '  <ul class="list-inline ibm-list-inline">\n' +
    '    <li>&#169; 2015 International Business Machines</li>\n' +
    '  </ul>\n' +
    '</footer>\n' +
    '');
}]);
