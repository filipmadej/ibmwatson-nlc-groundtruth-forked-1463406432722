'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
    .config(function($stateProvider) {
        $stateProvider
            .state('classifiers', {
                url: '/classifiers',
                templateUrl: 'app/classifiers/classifiers.html',
                controller: 'ClassifiersCtrl',
                resolve: {
                  access: function(authentication) {
                    return authentication.getCurrentUser();
                  }
              }
            });
    });
