'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
    .config(function ($stateProvider) {
        $stateProvider
            .state('livesystem', {
                url : '/live',
                templateUrl : 'app/livesystem/livesystem.html',
                controller : 'LiveSystemCtrl',
                access : function (authentication) {
                    return authentication.getCurrentUser();
                }
            });
    });
