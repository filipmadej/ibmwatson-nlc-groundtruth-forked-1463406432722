'use strict';

angular.module('ibmwatsonQaGroundtruthUiApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'app/login/login.html',
                controller: 'LoginCtrl',
                params: {
                    message:''
                },
                access: {
                    requiredLogin: false
                }
            });
    });
