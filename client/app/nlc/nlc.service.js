'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
    .factory('nlc', ['$http', '$q', '$interval', 'authentication',
        function($http, $q, $interval, authentication) {

            function processTaggedClasses (processedContent, taggedClasses) {
                var found;
                for (var i = 0, len = taggedClasses.length; i < len; i++) {
                    var aClass = taggedClasses[i];
                    found = false;
                    for (var j = 0, totalClassesLength = processedContent.classes.length; j < totalClassesLength; j++) {
                        if (processedContent.classes[j] === aClass) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        processedContent.classes.push(aClass);
                    }
                }
            }

            function processUtterance (processedContent, text, classes) {
                if (text.length === 0) {
                    return;
                }
                for (var i = 0; i < processedContent.text.length; i++) {
                    if (processedContent.text[i].text === text) {
                        updateUtterance(processedContent.utterances[i], classes);
                        return;
                    }
                }
                processedContent.text.push({ text: text, classes: classes });
                //    {'$$hashKey' : 'utterance:' + processedContent.utterances.length, 'seq' : processedContent.utterances.length, 'classes' : classes, 'id' : '', 'label' : text, 'checked' : false}  // jtr -- removed texts
                //);
            }

            function updateUtterance (oldUtterance, classes) {
                for (var i = 0; i < classes.length; i++) {
                    var clazz = classes[i];
                    if (oldUtterance.classes.indexOf(clazz) < 0) {
                        oldUtterance.classes.push(clazz);
                    }
                }
            }

            // take the raw response from the file upload and process it to create a formatted JSON for the front-end
            function processUploadResponse(data) {
                var processedContent = {
                    classes : [],
                    text : []
                };
                for (var i = 0, len = data.length; i < len; i++) {
                    //processRecord(data[i]);
                    processUtterance(processedContent, data[i].text, data[i].classes);
                    processTaggedClasses(processedContent, data[i].classes);
                }
                return processedContent;
            }


            var nlcSvc = {

                /* Get an array of classes */
                getClasses: function() {

                },

                getTexts: function() {

                },

                getClassifiers: function() {
                    return $q(function(resolve, reject) {
                        $http({
                            method: 'GET',
                            url: '/api/classifier/list'
                        }).then(function(response){
                            resolve(response.data);
                        }, function (error) {
                            reject(error);
                        });
                    });
                },

                /* Upload a JSON to NLC service and returns a trained classifier */
                train: function(trainingData) {
                    /*jshint camelcase: false */
                    $http({
                        method: 'POST',
                        url: '/api/classifier/train',
                        data: {
                            language: 'en',
                            name: 'classifier',
                            training_data: trainingData
                        }
                    }).then(function(response) {
                        console.log(response);
                    }, function(error) {
                        console.error(error);
                    });
                },

                /* Check on the status of the trained NLC instance */
                checkStatus : function(id) {
                    return $q(function(resolve, reject) {
                        $http({
                            method: 'GET',
                            url: '/api/classifier/' + id + '/status'
                        }).then(function(response){
                            console.log(response);
                            resolve(response.data);
                        }, function (error) {
                            reject(error);
                        });
                    });
                },

                pollStatus : function(id, handleResponse, time) {
                    var check = function () {
                        if (authentication.isAuthenticated()) {
                            $http({
                                method: 'GET',
                                url: '/api/classifier/' + id +'/status'
                            }).then(function(response){
                                handleResponse(response.data);
                            }, function (error) {
                                console.log(error);
                            });
                        }
                    };
                    check();
                    $interval(check, time);
                },

                /* Send a piece of text to NLC and return a classification */
                classify: function(id, text) {
                    return $q(function(resolve, reject) {
                        $http({
                            method: 'POST',
                            url: '/api/classifier/' + id + '/classify',
                            data: {
                                text: text
                            }
                        }).then(function(response){
                            resolve(response.data);
                        }, function (error) {
                            reject(error);
                        });
                    });
                },

                /* Removes a classifier */
                remove: function(id) {
                    return $q(function(resolve, reject) {
                        $http({
                            method: 'DELETE',
                            url: '/api/classifier/' + id
                        }).then(function(response){
                            resolve(response.data);
                        }, function (error) {
                            reject(error);
                        });
                    });
                },

                /* Process a CSV or JSON file and set up the relevant classes & texts */
                upload: function(fileContent) {
                    return $q(function(resolve, reject) {
                        if (fileContent.length === 0) {
                            reject();
                        } else if (fileContent.charAt(0) === '{') {
                            /*jshint camelcase: false */
                            //resolve(JSON.parse(fileContent).training_data);
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
                            }).then(function(response) {
                                resolve(processUploadResponse(response.data));
                                //resolve(response.data);
                            }, function (error) {
                                reject(error);
                            });
                        }
                    });
                },

                /* export the classes & texts from the UI into a JSON file */
                download: function(utterances, classes) {
                    var i, j, w, index, mappedClasses = [],
                        unmappedClasses = [];
                    var csvString = '';
                    for (i = 0; i < utterances.length; i += 1) {
                        if (utterances[i].classes.length > 0) {
                            csvString += utterances[i].label;
                            for (j = 0; j < utterances[i].classes.length; j += 1) {
                                index = mappedClasses.indexOf(utterances[i].classes[j]);
                                if (index < 0) {
                                    mappedClasses.push(utterances[i].classes[j]);
                                }
                                csvString += ',' + utterances[i].classes[j];
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
                    w = window.open('');
                    w.document.write(csvString);
                }
            };

            // Public API here
            return nlcSvc;
        }
    ]);
