'use strict';

var app = angular.module('ibmwatson-nlc-groundtruth-app', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'xeditable',
    'ngDialog',
    'ng-file-upload',
    'config'
])
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider',
        function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
            $urlRouterProvider
                .otherwise('/classifiers');

            $locationProvider.html5Mode(true);

            // by default, cross-site requests (to our services) should have credentials
            $httpProvider.defaults.withCredentials = true;

            // set up a http interceptor to listen out for 401 (Unauthorizes) responses
            $httpProvider.interceptors.push(['$q', '$location',
                function($q, $location) {
                    return {
                        // If response is 401 (Unauthorized), go to the login URL
                        'responseError': function(response) {
                            if (response.status === 401) {
                                $location.path('/login');
                            }
                            return $q.reject(response);
                        }
                    };
                }
            ]);
        }
    ])
    .run(
        function(editableOptions) {
            editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        },
        ['$rootScope', '$state', '$location', '$log',
            function($rootScope, $state, $location, $log) {
                $rootScope.$on('$stateChangeStart', function(event, nextState) {
                    $log.debug('changing state',nextState.url);
                });


            }
        ])
    .directive('onReadFile', ['$parse',
        function($parse) {
            return {
                restrict: 'A',
                scope: false,
                link: function(scope, element, attrs) {
                    var fn = $parse(attrs.onReadFile);

                    element.on('change', function(onChangeEvent) {
                        var reader = new FileReader();

                        reader.onload = function(onLoadEvent) {
                            scope.$apply(function() {
                                fn(scope, {
                                    $fileContent: onLoadEvent.target.result
                                });
                            });
                        };
                        reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                    });
                }
            };
        }
    ]);

app.controller('AppController', ['$rootScope', '$scope',
    function($rootScope, $scope) {

        // Currently logged in user
        $scope.currentUser = null;

        // Current tenant (service instance)
        $scope.currentTenant = null;

        $scope.setCurrentUser = function setCurrentUser(user){
            $scope.currentUser = user;
        };

        $scope.setCurrentTenant = function setCurrentTenant(tenant){
            $scope.currentTenant = tenant;
        };

        $rootScope.export = function() {
            $rootScope.$broadcast('appAction', {
                name: 'export'
            });
        };

        $rootScope.train = function() {
            $rootScope.$broadcast('appAction', {
                name: 'train'
            });
        };

        $rootScope.getFileContent = function() {
            var files = $scope.files;
            if (files && files.length>0) {
                var reader = new FileReader();
                var text;
                reader.onload = function() {
                    text = reader.result;
                    $scope.files = null;
                    $rootScope.$broadcast('appAction', {name: 'import', data: text});
                };
                reader.readAsText(files[0]);
            }
        };
    }
]);
