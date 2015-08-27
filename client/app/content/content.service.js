'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .factory('content', ['$http', '$q', 'Upload', 'endpoints', 'session',
    function init ($http, $q, Upload, endpoints, session) {

      function contentEndpoint () {
        return endpoints.content + '/' + session.tenant + '/content';
      }

      var contentSvc = {

        downloadFile : function() {
          return $q(function download (resolve, reject) {
            $http({
              method: 'GET',
              url: contentEndpoint()
            }).then(function success (response) {
              resolve(response.data);
            }).catch(function error (err) {
              reject(err);
            });
          });
        },

        uploadFile : function (file, progressFcn, successFcn) {
          console.log('file: ' + JSON.stringify(file));
          return $q(function upload (resolve, reject) {
            if (file.length === 0) {
              reject();
            } else {
              Upload.upload({
                url: contentEndpoint(),
                file: file
              })
              .progress(function(evt){
                progressFcn(evt);
              })
              .success(function(data) {
                console.log('success');
                console.log(data);
                successFcn();
                resolve(data);
              }).error(function(data){
                console.log('error');
                console.log(data);
                reject(data);
              });
            }
          });
        }
      };

      // Public API here
      return contentSvc;
    }
  ]);
