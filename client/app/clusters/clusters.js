'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
    .config(function init ($stateProvider) {
        $stateProvider
            .state('clusters', {
                url: '/training',
                templateUrl: 'app/clusters/clustersList.html',
                controller: 'ClustersListCtrl',
                reloadOnSearch:false,
                resolve: {
                    access: function(authentication) {
                        return authentication.getCurrentUser();
                    }
                }
            });
    });
