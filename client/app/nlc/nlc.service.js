'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .factory('nlc', ['$http', '$q', '$log', '$interval', 'authentication',
    function init ($http, $q, $log, $interval, authentication) {

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
              url: '/api/classifier/list'
            }).then(function success (response){
              resolve(response.data);
            }, function fail (error) {
              reject(error);
            });
          });
        },

        /* Upload a JSON to NLC service and returns a trained classifier */
        train: function train (trainingData, language) {
          /*jshint camelcase: false */
          return $q(function post (resolve, reject) {
            $http({
              method: 'POST',
              url: '/api/classifier/train',
              data: {
                language: language,
                name: 'classifier',
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
              url: '/api/classifier/' + id + '/status'
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
                url: '/api/classifier/' + id +'/status'
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
              url: '/api/classifier/' + id + '/classify',
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
              url: '/api/classifier/' + id
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
                url: '/api/import/csv',
                data: fileContent,
                headers: {
                  'Content-Type': 'text/plain',
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
        download: function download (text, classes) {
          var i, index;
          var mappedClasses = [];
          var unmappedClasses = [];
          var csvString = '';
          for (i = 0; i < text.length; i += 1) {
            if (text[i].classes.length > 0) {
              csvString += text[i].label;
              for (var j = 0; j < text[i].classes.length; j += 1) {
                index = mappedClasses.indexOf(text[i].classes[j]);
                if (index < 0) {
                  mappedClasses.push(text[i].classes[j]);
                }
                csvString += ',' + text[i].classes[j];
              }
              csvString += '<br>';
            }
          }
          for (i = 0; i < classes.length; i += 1) {
            index = mappedClasses.indexOf(classes[i].label);
            if (index < 0) {
              unmappedClasses.push(classes[i].label);
            }

          }
          for (i = 0; i < unmappedClasses.length; i += 1) {
            csvString += ',' + unmappedClasses[i];
          }
          var w = window.open('');
          w.document.write(csvString);
        }
      };

      // Public API here
      return nlcSvc;
    }
  ]);
