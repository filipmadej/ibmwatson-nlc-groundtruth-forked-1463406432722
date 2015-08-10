'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .config(function init ($stateProvider) {
    $stateProvider
      .state('classifiers', {
        url: '/classifiers',
        templateUrl: 'app/classifiers/classifiers.html',
        controller: 'ClassifiersCtrl',
        resolve: {
          access: function authenticate (authentication) {
            return authentication.getCurrentUser();
          }
        }
      });
  });
