/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .config(function init($stateProvider) {
    $stateProvider
      .state('classifiers', {
        url: '/classifiers',
        templateUrl: 'app/classifiers/classifiers.html',
        controller: 'ClassifiersCtrl',
        resolve: {
          access: function authenticate(authentication) {
            return authentication.getCurrentUser();
          }
        },
        onEnter: ['versions', 'watsonAlerts',
          function onEnter(versions, watsonAlerts) {
            versions.getStatus().then(function(status) {
              if (!versions.informed) {
                switch (status) {
                  case 'old':
                    watsonAlerts.add({
                      level: 'info',
                      title: 'Pssst!',
                      text: 'A new version of this tool is available',
                      dismissable: true
                    });
                    versions.informed = true;
                    break;
                  case 'current':
                    break;
                  case 'development':
                    watsonAlerts.add({
                      level: 'info',
                      title: 'Pssst!',
                      text: 'You\'re using a development version of this tool.',
                      dismissable: true
                    });
                    versions.informed = true;
                    break;
                }
              }
            });
          }
        ]
      });
  });
