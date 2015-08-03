'use strict';

angular.module('ibmwatsonQaGroundtruthUiApp')
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
