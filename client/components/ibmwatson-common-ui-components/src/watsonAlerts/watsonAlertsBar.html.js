angular.module('watsonAlerts/watsonAlertsBar.html', []).run(['$templateCache', function($templateCache) {
  $templateCache.put('watsonAlerts/watsonAlertsBar.html',
    '<div class="ibm-alert-bar">\n' +
    '	<div ng-repeat="alert in alerts" class="alert alert-{{alert.level}} alert-dismissible ibm-alert ibm-alert--{{alert.level}}" role="alert">\n' +
    '		<button ng-show="alert.dismissable" ng-click="alert.dismiss()" type="button" class="close ibm-alert__close" data-dismiss="alert" aria-label="Close">\n' +
    '			<span class="ibm-icon--close-cancel-error" aria-hidden="true"></span>\n' +
    '		</button>\n' +
    '		<span ng-show="alert.title"><strong>{{alert.title}}</strong> </span>{{alert.text}}<span ng-show="alert.link"> <a href="{{alert.link}}">{{alert.linkText || \'Learn more\'}}</a></span>\n' +
    '	</div>\n' +
    '</div>\n' +
    '');
}]);
