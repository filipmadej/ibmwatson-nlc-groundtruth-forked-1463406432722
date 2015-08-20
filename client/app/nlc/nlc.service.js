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
  .factory('nlc', ['$http', '$q', '$log', '$interval', 'authentication', 'endpoints', 'session',
    function init ($http, $q, $log, $interval, authentication, endpoints, session) {

      function classifierEndpoint () {
        return endpoints.classifier + '/' + session.tenant + '/classifiers';
      }

      function importEndpoint () {
        return endpoints.classifier + '/' + session.tenant + '/import';
      }

      function processClasses (processedContent, classes) {
        classes.forEach(function forEach (clazz) {
          if (processedContent.classes.indexOf(clazz) < 0) {
            processedContent.classes.push(clazz);
          }
        });
      }

      function updateText (text, classes) {
        classes.forEach(function forEach (clazz) {
          if (text.classes.indexOf(clazz) < 0) {
            text.classes.push(clazz);
          }
        });
      }

      function processText (processedContent, text, classes) {
        if (!text || text.length === 0) {
          return;
        }
        for (var i = 0; i < processedContent.text.length; i++) {
          if (processedContent.text[i].text === text) {
            updateText(processedContent.text[i], classes);
            return;
          }
        }
        processedContent.text.push({ text: text, classes: classes });
      }

      // take the raw response from the file upload and process it to create a formatted JSON for the front-end
      function processUploadResponse (data) {
        var processedContent = {
          classes : [],
          text : []
        };
        data.forEach(function forEach (d) {
          processText(processedContent, d.text, d.classes);
          processClasses(processedContent, d.classes);
        });
        return processedContent;
      }

      var nlcSvc = {
        /* Gets a list of all classifiers in the NLC service */
        getClassifiers: function getClassifiers () {
          return $q(function get (resolve, reject) {
            $http({
              method: 'GET',
              url: classifierEndpoint()
            }).then(function success (response){
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        /* Upload a JSON to NLC service and returns a trained classifier */
        train: function train (trainingData, language, name) {
          /*jshint camelcase: false */
          return $q(function post (resolve, reject) {
            $http({
              method: 'POST',
              url: classifierEndpoint(),
              data: {
                language: language,
                name: name,
                training_data: trainingData
              }
            }).then(function success (response) {
              $log.debug(response);
              resolve(response.data);
            }, function fail (error) {
              $log.error(error);
              reject(error);
            });
          });
        },

        /* Check on the status of the trained NLC instance */
        checkStatus : function checkStatus (id) {
          return $q(function get (resolve, reject) {
            $http({
              method: 'GET',
              url: classifierEndpoint() + '/' + id
            }).then(function success (response) {
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        pollStatus : function pollStatus (id, handleResponse, time) {
          var check = function check () {
            if (authentication.isAuthenticated()) {
              $http({
                method: 'GET',
                url: classifierEndpoint() + '/' + id
              }).then(function success (response) {
                handleResponse(response.data);
              }, function fail (error) {
                $log.error(error);
              });
            }
          };
          check();
          $interval(check, time);
        },

        /* Send a piece of text to NLC and return a classification */
        classify: function classify (id, text) {
          return $q(function post (resolve, reject) {
            $http({
              method: 'POST',
              url: classifierEndpoint() + '/' + id + '/classify',
              data: {
                text: text
              }
            }).then(function success (response) {
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        /* Removes a classifier */
        remove: function remove (id) {
          return $q(function(resolve, reject) {
            $http({
              method: 'DELETE',
              url: classifierEndpoint() + '/' + id
            }).then(function success (response) {
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        /* Process a CSV or JSON file and set up the relevant classes & texts */
        upload: function upload (fileContent) {
          return $q(function upload (resolve, reject) {
            if (!fileContent || fileContent.length === 0) {
              reject();
            } else if (fileContent.charAt(0) === '{') {
              /*jshint camelcase: false */
              resolve(processUploadResponse(JSON.parse(fileContent).training_data));
            } else {
              $http({
                method: 'POST',
                url: importEndpoint(),
                data: fileContent,
                headers: {
                  'Content-Type': 'text/csv;charset=utf-8',
                  'Accept': 'application/json'
                }
              }).then(function success (response) {
                resolve(processUploadResponse(response.data));
              }, function fail (error) {
                reject(error);
              });
            }
          });
        },

        /* export the classes & texts from the UI into a JSON file */
        download: function download (texts, classes) {
          var csvString = '';
          texts.forEach(function forEach (text) {
            csvString += '"' + text.label.replace(/"/g, '""') + '"';
            text.classes.forEach(function forEach (clazz) {
              csvString += ',' + clazz;
            });
            csvString += '\n';
          });
          classes.forEach(function forEach (clazz) {
            csvString += ',' + clazz.label;
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

          // var w = window.open('');
          // w.document.write(csvString);
        }
      };

      // Public API here
      return nlcSvc;
    }
  ]);
