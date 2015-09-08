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
  .factory('content', ['$http', '$q', '$log', 'Upload', 'endpoints', 'session',
    function init ($http, $q, $log, Upload, endpoints, session) {

      function contentEndpoint () {
        return endpoints.content + '/' + session.tenant + '/content';
      }

      function getClassNameFromId (array, id) {
        var name = '';
        array.some(function find (element) {
          if (element._id === id) {
            name = element.name;
            return true;
          }
        });
        return name;
      }

      var contentSvc = {

        downloadFile : function downloadFile () {
          return $q(function download (resolve, reject) {
            $http({
              method: 'GET',
              url: contentEndpoint()
            }).then(function success (response) {
              $log.debug('export response: ' + JSON.stringify(response));
              var texts = response.data.texts;
              var classes = response.data.classes;
              var csvString = '';
              texts.forEach(function forEach (text) {
                csvString += '"' + text.value.replace(/"/g, '""') + '"';
                text.classes.forEach(function forEach (clazz) {
                  csvString += ',"' + getClassNameFromId(classes, clazz).replace(/"/g,'""') + '"';
                });
                csvString += '\n';
              });
              classes.forEach(function forEach (clazz) {
                csvString += ',"' + clazz.name.replace(/"/g,'""') + '"';
              });
              csvString += '\n';

              // convert the CSV to a data URL
              // export the data url
              var contentType = 'text/csv;charset=utf-8';
              var outputFile = 'export.csv';

              window.URL = window.URL || window.webkitURL;
              var csvFile = new Blob([csvString], {type: contentType});

              // var uri = 'data:text/csv;charset=utf-8,' + escape(csvString);
              var link = document.createElement('a');
              // link.href = uri;
              link.href = window.URL.createObjectURL(csvFile);

              link.style.visibility = 'hidden';
              link.download = outputFile;
              link.dataset.downloadurl = [contentType, link.download, link.href].join(':');

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              resolve(response.data);
            }).catch(function error (err) {
              reject(err);
            });
          });
        },

        importFiles : function importFiles (files, progressFcn, successFcn) {
          $log.debug('Importing file: ' + JSON.stringify(files));
          var promises = [];
          files.forEach(function forEach (file) {
            promises.push(
              $q(function upload (resolve, reject) {
                if (file.length === 0) {
                  reject();
                } else {
                  Upload.upload({
                    url: contentEndpoint(),
                    file: file
                  })
                  .progress(function progress (evt) {
                    progressFcn(evt);
                  })
                  .success(function success (data) {
                    $log.debug('Succesfully imported file: ' + data);
                    successFcn();
                    resolve(data);
                  }).error(function error (err) {
                    $log.error('Importing file failed: ' + err);
                    reject(err);
                  });
                }
              })
            );
          });
          return $q.all(promises);
        }
      };

      // Public API here
      return contentSvc;
    }
  ]);
