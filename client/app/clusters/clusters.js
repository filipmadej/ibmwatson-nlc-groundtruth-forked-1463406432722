'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
    .config(function($stateProvider) {
        $stateProvider
            .state('clusters', {
                abstract: true,
                url: '/training',
                templateUrl: 'app/clusters/clusters.html',
                controller: 'ClustersCtrl',
                resolve: {
                    access: function(authentication) {
                        return authentication.getCurrentUser();
                    }
                }
            })
            .state('clusters.list', {
                url: '',
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
