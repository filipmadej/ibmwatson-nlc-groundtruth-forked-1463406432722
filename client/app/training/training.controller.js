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

// --- pending ---
// placement of view all?
// add color coding of tags in class filter collection
// add metadata fields (starting with description) after persistent stores working for primary use cases
// add tooltips
// add hot keys

angular.module('ibmwatson-nlc-groundtruth-app')
  .controller('TrainingController', ['$scope', '$state', '$http', '$q', '$log', '$window', 'ngDialog', 'classes', 'texts', 'nlc', 'watsonAlerts', 'socket', 'content',
    function init ($scope, $state, $http, $q, $log, $window, ngDialog, classes, texts, nlc, watsonAlerts, socket, content) {

      // -------------------------------------------------------------------------
      // Window functions
      // -------------------------------------------------------------------------

      $scope.initializeWindow = function() {
          angular.element($window).bind('resize', $scope.setTableHeights);
          $scope.setTableHeights();
      };

      $scope.setTableHeights = function() {
          var contentHeight = $(window).height() - 350;
          $('.trainingList').css('height', contentHeight);
      };

      // -------------------------------------------------------------------------
      // Socket functions
      // -------------------------------------------------------------------------

      socket.on('init', function init (data) {
        $log.debug('socket:init ' + JSON.stringify(data));
      });

      socket.on('class:delete', function deleteClass (data) {
        $log.debug('socket:class:delete ' + JSON.stringify(data));
        var clazz = $scope.getFromId($scope.classes, data.id);
        if (data.err) {
          var msg;
          if (clazz) {
            msg = 'Error deleting ' + clazz.label + ' class. Please refresh the page and try again.';
          } else {
            msg = 'Error deleting class with id ' + data.id + '. Please refresh the page and try again.';
          }
          watsonAlerts.add({ level: 'error', text: msg });
        } else if (clazz){
          $scope.classes.splice($scope.classes.indexOf(clazz), 1);
          $scope.texts.forEach(function forEach (text) {
            var index = text.classes.indexOf(clazz.label);
            if (index >= 0) {
              text.classes.splice(index, 1);
            }
          });
        }
      });

      socket.on('text:delete', function deleteText (data) {
        $log.debug('socket:text:delete ' + JSON.stringify(data));
        var text = $scope.getFromId($scope.texts, data.id);
        if (data.err) {
          var msg;
          if (text) {
            msg = 'Error deleting "' + text.label + '" text. Please refresh the page and try again.';
          } else {
            msg = 'Error deleting text with id ' + data.id + '. Please refresh the page and try again.';
          }
          msg += 'Error message: ' + data.err;
          watsonAlerts.add({ level: 'error', text: msg });
        } else if (text){
          $scope.texts.splice($scope.texts.indexOf(text), 1);
        }
      });

      socket.on('class:create', function createClass (data) {
        $log.debug('socket:class:create ' + JSON.stringify(data));
        if (data.err) {
          var msg = 'Error adding ' + data.attributes.name + ' class. Error message: ' + JSON.stringify(data.err.message);
          watsonAlerts.add({ level: 'error', text: msg });
        } else {
          var element = data.attributes;
          element.$$hashKey = element.id;
          element.seq = $scope.sequenceNumber++;
          element.label = element.name;
          element.edit = false;
          element.checked = false;
          element.selected = false;
          $scope.classes.push(element);
        }
      });

      socket.on('text:create', function createText (data) {
        $log.debug('socket:text:create ' + JSON.stringify(data));
        if (data.err) {
          var msg = 'Error adding "' + data.attributes.value + '" text. Error message: ' + JSON.stringify(data.err.message);
          watsonAlerts.add({ level: 'error', text: msg });
        } else {
          var element = data.attributes;
          element.$$hashKey = element.id;
          element.seq = $scope.sequenceNumber++;
          element.label = element.value;
          element.classes = element.classes || [];
          element.classes.forEach(function forEach (clazz, index, array) {
            if (clazz.name) {
              array[index] = clazz.name;
            } else {
              array[index] = $scope.getFromId($scope.classes, clazz).label;
            }
          });
          element.edit = false;
          element.checked = false;
          $scope.texts.push(element);
        }
      });

      socket.on('text:update:classes:add', function addClasses (data) {
        $log.debug('socket:text:update:classes:add ' + JSON.stringify(data));
        var text = $scope.getFromId($scope.texts, data.id);
        var successClasses = [];
        var errorClasses = [];
        data.classes.forEach(function forEach (clazz) {
          if (clazz.err) {
            errorClasses.push(clazz);
          } else {
            successClasses.push($scope.getFromId($scope.classes, clazz).label);
          }
        });
        if (errorClasses.length > 0) {
          watsonAlerts.add({ level: 'error', text: 'Failed to add the following classes to the "' + text.label + '" text: ' + JSON.stringify(errorClasses) });
        }
        if (data.err) {
          watsonAlerts.add({ level: 'error', text: 'Failed to add the following classes to the "' + text.label + '" text: ' + JSON.stringify(data.classes) });
        } else {
          text.classes = text.classes.concat(successClasses);
        }
      });

      socket.on('text:update:classes:remove', function removeClasses (data) {
        $log.debug('socket:text:update:classes:remove ' + JSON.stringify(data));
        var text = $scope.getFromId($scope.texts, data.id);
        var successClasses = [];
        var errorClasses = [];
        data.classes.forEach(function forEach (clazz) {
          if (clazz.err) {
            errorClasses.push(clazz);
          } else {
            successClasses.push($scope.getFromId($scope.classes, clazz).label);
          }
        });
        if (errorClasses.length > 0) {
          watsonAlerts.add({ level: 'error', text: 'Failed to remove the following classes to the "' + text.label + '" text: ' + JSON.stringify(errorClasses) });
        }
        if (data.err) {
          watsonAlerts.add({ level: 'error', text: 'Failed to remove the following classes to the "' + text.label + '" text: ' + JSON.stringify(data.classes) });
        } else {
          successClasses.forEach(function forEach (clazz) {
            text.classes.splice(text.classes.indexOf(clazz), 1);
          });
        }
      });

      socket.on('text:update:metadata:replace', function replaceMetadata (data) {
        $log.debug('socket:text:update:metadata:replace ' + JSON.stringify(data));
        var text = $scope.getFromId($scope.texts, data.id);
        var newLabel = data.value;
        if (data.err) {
          watsonAlerts.add({ level: 'error', text: 'Failed to change the label of the "' + text.label + '" text to ' + newLabel });
        } else {
          text.label = newLabel;
          window.document.getElementById(text.$$hashKey).value = newLabel;
        }
      });

      socket.on('class:update', function updateClass (data) {
        $log.debug('socket:class:update ' + JSON.stringify(data));
        var clazz = $scope.getFromId($scope.classes, data.id);
        var oldLabel = clazz.label;
        var newLabel = data.name;
        if (data.err) {
          watsonAlerts.add({ level: 'error', text: 'Failed to change the ' + oldLabel + ' class to ' + newLabel });
        } else {
          clazz.label = newLabel;
          window.document.getElementById(clazz.$$hashKey).value = newLabel;
        }

        $scope.texts.forEach(function forEach (text) {
          var index = text.classes.indexOf(oldLabel);
          if (index >= 0) {
            text.classes[index] = newLabel;
          }
        });
      });

      $scope.$on('$destroy', function () {
        socket.removeAllListeners();
      });

      // -------------------------------------------------------------------------
      // Load functions
      // -------------------------------------------------------------------------

      $scope.loadClasses = function loadClasses () {
        var deferred = $q.defer();
        classes.query({}).then(function success (data) {
          data.forEach(function forEach (element) {
            element.$$hashKey = element.id;
            element.seq = $scope.sequenceNumber++;
            element.label = element.name;
            element.edit = false;
            element.checked = false;
            element.selected = false;
          });
          deferred.resolve(data);
          $scope.loading.classes = false;
          $scope.classes = data;
        }, function error (err) {
          if (err) {
            $log.error('error getting classes: ' + JSON.stringify(err));
            deferred.reject(err);
          }
        });
        return deferred.promise;
      };

      $scope.loadTexts = function loadTexts () {
        var deferred = $q.defer();
        texts.query({}).then(function success (data) {
          data.forEach(function forEach (element) {
            element.$$hashKey = element.id;
            element.seq = $scope.sequenceNumber++;
            element.label = element.value;
            element.classes = element.classes || [];
            for (var i = 0, len = element.classes.length; i < len; i++) {
              var clazz = $scope.getFromId($scope.classes, element.classes[i]);
              if (clazz) {
                element.classes[i] = clazz.label;
              }
            }
            element.edit = false;
            element.checked = false;
          });
          deferred.resolve(data);
          $scope.loading.texts = false;
          $scope.texts = data;
        }, function error (err) {
          if (err) {
            $log.error('error loading texts: ' + JSON.stringify(err));
            deferred.reject(err);
          }
        });
        return deferred.promise;
      };

      // -------------------------------------------------------------------------
      // Scope variables
      // -------------------------------------------------------------------------

      // Page Loading Variables
      $scope.loading = {
        classes : true,
        texts: true,
        savingClassifier: false
      };

      // sequence number for class and text elements
      $scope.sequenceNumber = 0;

      // language options
      $scope.languageOptions = [
        // { label: 'Arabic', value: 'ar-ar' },
        // { label: 'Brazilian Portuguese', value: 'pt-br' },
        { label: 'English', value: 'en' }//,
        // { label: 'French', value: 'fr' },
        // { label: 'Italian', value: 'it' },
        // { label: 'Japanese', value: 'ja' },
        // { label: 'Spanish', value: 'es' }
      ];
      $scope.languageOption = $scope.languageOptions[0];

      // training related elements
      $scope.showTrainConfirm = false;
      $scope.newClassifier = { name: '' }; // for some reason the ng-model needed to be talking to an object

      // class related elements
      $scope.classes = [];
      $scope.newClassString = '';
      $scope.classOrderOptions = [
        { label: 'Newest First', value: 'newest' },
        { label: 'Oldest First', value: 'oldest' },
        { label: 'Alphabetical', value: 'alpha' },
        { label: 'Most Texts', value: 'most' },
        { label: 'Fewest Texts', value: 'fewest' }
      ];
      $scope.classOrderOption = $scope.classOrderOptions[0];

      // text related elements
      $scope.texts = [];
      $scope.newTextString = '';
      $scope.newTagStrings = [];
      $scope.textOrderOptions = [
        { label: 'Newest First', value: 'newest' },
        { label: 'Oldest First', value: 'oldest' },
        { label: 'Alphabetical', value: 'alpha' },
        { label: 'Most Classes', value: 'most' },
        { label: 'Fewest Classes', value: 'fewest' }
      ];
      $scope.textOrderOption = $scope.textOrderOptions[0];

      // import elements
      $scope.importing = false;
      $scope.importProgress = 0;
      $scope.files = [];

      // load the classes and texts to initialize the page
      $scope.loadClasses().then(function afterLoadClasses () {
        return $scope.loadTexts();
      }, function error (err) {
        $log.error('error loading classes: ' + JSON.stringify(err));
        watsonAlerts.add({ level: 'error', text: 'Error loading classes from database. Please refresh to try again.' });
      }).then(function afterLoadTexts () {
        $log.debug('success loading classes and texts');
      }, function error (err) {
        $log.error('error loading texts: ' + JSON.stringify(err));
        watsonAlerts.add({ level: 'error', text: 'Error loading texts from database. Please refresh to try again.' });
      });

      // -------------------------------------------------------------------------
      // Array operations
      // -------------------------------------------------------------------------

      // set ['checked'] to <bool> for all objects in an array
      $scope.checkAll = function checkAll (array, bool) {
        array.forEach(function forEach (element) {
          element.checked = bool;
        });
      };

      // return an array of 'checked' objects
      $scope.getChecked = function getChecked (array) {
        return _.filter(array, function filter (element) {
          return element.checked;
        });
      };

      // return a class or text with a given label
      $scope.getFromLabel = function getFromLabel (array, label) {
        var idx = -1;
        array.some(function find (element, index) {
          if (element.label === label) {
            idx = index;
            return true;
          }
        });
        return idx < 0 ? null : array[idx];
      };

      // return a class or text with a given id
      $scope.getFromId = function getFromId (array, id) {
        var idx = -1;
        array.some(function find (element, index) {
          if (element.id === id) {
            idx = index;
            return true;
          }
        });
        return idx < 0 ? null : array[idx];
      };

      // determine if the array contains the label
      $scope.containsLabel = function containsLabel (array, label) {
        return array.some(function find (element) {
          return element.label === label;
        });
      };

      // gets the classes or texts array
      $scope.getScopeArray = function getScopeArray (type) {
        switch (type) {
          case 'class':
            return $scope.classes;
          case 'text':
            return $scope.texts;
        }
      };

      // -------------------------------------------------------------------------
      // Class select functions
      // -------------------------------------------------------------------------

      // return an array of selected classes
      $scope.getSelectedClasses = function getSelectedClasses () {
        return _.filter($scope.classes, function filter (clazz) {
          return clazz.selected;
        });
      };

      // toggle whether a class is selected or not
      $scope.selectClass = function selectClass (clazz) {
        clazz.selected = !clazz.selected;
      };

      // -------------------------------------------------------------------------
      // Ordering functions
      // -------------------------------------------------------------------------

      // set function for the variable controlling the list's sort
      $scope.setClassOrderOption = function setClassOrderOption (option) {
        $scope.classOrderOption = option;
      };

      // a switch to determine the value used for the list's sort
      $scope.classOrder = function classOrder (clazz) {
        switch ($scope.classOrderOption.value) {
          case 'newest':
            return -clazz.seq;
          case 'oldest':
            return clazz.seq;
          case 'alpha':
            return clazz.label;
          case 'most':
            return -$scope.numberTextsInClass(clazz);
          case 'fewest':
            return $scope.numberTextsInClass(clazz);
          default:
            return -clazz.seq;
        }
      };

      // set function for the variable controlling the list's sort
      $scope.setTextOrderOption = function setTextOrderOption (option) {
        $scope.textOrderOption = option;
      };

      // a switch to determine the value used for the list's sort
      $scope.textOrder = function textOrder (text) {
        switch ($scope.textOrderOption.value) {
          case 'newest':
            return -text.seq;
          case 'oldest':
            return text.seq;
          case 'alpha':
            return text.label;
          case 'most':
            return -$scope.classesForText(text).length;
          case 'fewest':
            return $scope.classesForText(text).length;
          default:
            return -text.seq;
        }
      };

      // -------------------------------------------------------------------------
      // Editing functions
      // -------------------------------------------------------------------------

      // toggle 'edit' attribute of <object>
      $scope.editField = function editField (object) {
        if (!object.edit) {
          object.edit = true;
        } else {
          dismissEditField(object);
        }
      };

      // set the edit attribute of a given object to false. Used for toggline edit-mode for classes and texts
      function dismissEditField (object) {
        var field = window.document.getElementById(object.$$hashKey);
        field.value = object.label;
        object.edit = false;
      }

      // check the keyup event to see if the user has pressed 'esc' key. If so, dismiss the editing field
      $scope.keyUpCancelEditing = function keyUpCancelEditing (object, event) {
        if (event.keyCode === 27) {
          dismissEditField(object);
        }
      };

      // changes the label of the object unless the label already exists
      $scope.changeLabel = function changeLabel (type, object) {
        var oldLabel = object.label;
        var newLabel = window.document.getElementById(object.$$hashKey).value;
        dismissEditField(object);
        if (newLabel === '' || newLabel === oldLabel) {
          return $q.when();
        } else {
          var allObjects = $scope.getScopeArray(type);
          if ($scope.containsLabel(allObjects, newLabel)) {
            var msg;
            if (type === 'class') {
              msg = inform('The ' + newLabel + ' class already exists.');
            } else {
              msg = inform('The "' + newLabel + '" text already exists.');
            }
            ngDialog.open({template: msg, plain: true});
            return $q.when();
          } else {
            switch (type) {
              case 'class':
                return classes.update(object.id, { name: newLabel });
              case 'text':
                return texts.update(object.id, { value: newLabel });
            }
          }
        }
      };

      // -------------------------------------------------------------------------
      // Counting functions
      // -------------------------------------------------------------------------

      // Counts the number of texts that have a given <clazz> tagged
      $scope.numberTextsInClass = function numberTextsInClass (clazz) {
        var n = 0;
        $scope.texts.forEach(function forEach (text) {
          if (text.classes.indexOf(clazz.label) >= 0) {
            n++;
          }
        });
        return n;
      };

      // return all classes tagged in text <text>
      $scope.classesForText = function classesForText (text) {
        var classes = [];
        text.classes.forEach(function forEach (clazz) {
          classes.push($scope.getFromLabel($scope.classes, clazz));
        });
        return classes;
      };

      // -------------------------------------------------------------------------
      // Create functions
      // -------------------------------------------------------------------------

      // adds a new object
      // type can be 'class' or 'text'
      // optional can contain a text id for a new class to be added to
      $scope.add = function add (type, label, optional) {
        $scope.newClassString = '';
        $scope.newTextString = '';
        if (!label) {
          return $q.when();
        }
        // if an object already exists with this label
        var existingObject = $scope.getFromLabel($scope.getScopeArray(type), label);
        if (existingObject) {
          var msg;
          if (type === 'class') {
            msg = inform('The ' + existingObject.label + ' class already exists.');
          } else {
            msg = inform('The "' + existingObject.label + '" text already exists.');
          }
          ngDialog.open({template: msg, plain: true});
          return $q.when();
        } else {
          switch (type) {
            case 'class' :
              if (optional) {
                return classes.post({ name: label, textid: optional });
              } else {
                return classes.post({ name: label });
              }
            case 'text' :
              var checkedClasses = $scope.getChecked($scope.classes);
              if (checkedClasses.length > 0) {
                var classIds = [];
                checkedClasses.forEach(function forEach (clazz) {
                  classIds.push(clazz.id);
                });
                return texts.post({ value: label, classes: classIds });
              } else {
                return texts.post({ value : label });
              }
          }
        }
      };

      // -------------------------------------------------------------------------
      // Delete functions
      // -------------------------------------------------------------------------

      // prepare to delete class <clazz> if operation is confirmed
      $scope.deleteClass = function deleteClass (clazz) {
        var label;
        if (clazz.label.length > 40) {
          label = clazz.label.substring(0, 40) + '...';
        } else {
          label = clazz.label;
        }

        var msg;
        if ($scope.numberTextsInClass(clazz) === 0) {
          msg = question('Delete ' + label + ' class?', 'Delete');
        } else {
          msg = question($scope.numberTextsInClass(clazz) + ' text(s) are tagged with the ' + label + ' class. If you delete this class, it will be removed from those texts.', 'Delete');
        }
        return ngDialog.openConfirm({template: msg, plain: true
        }).then(function remove () {
          return $scope.deleteClasses([clazz]);
        }, function cancel () {
          return $q.when();
        });
      };

      // prepare to delete text <text> if operation is confirmed
      $scope.deleteText = function deleteText (text) {
        var label;
        if (text.label.length > 60) {
          label = text.label.substring(0, 60) + '...';
        } else {
          label = text.label;
        }

        var msg = question('Do you want to delete the "' + label + '" text?', 'Delete');
        return ngDialog.openConfirm({template: msg, plain: true
        }).then(function remove () {
          return $scope.deleteTexts([text]);
        }, function cancel () {
          return $q.when();
        });
      };

      // prepare to delete all currently checked classes if operation is confirmed
      $scope.deleteCheckedClasses = function deleteCheckedClasses () {
        var checkedClasses = $scope.getChecked($scope.classes);
        var textsInUse = 0;
        var classesInUse = [];

        checkedClasses.forEach(function forEach (clazz) {
          var taggedTexts = $scope.numberTextsInClass(clazz);
          if (taggedTexts > 0) {
            textsInUse += taggedTexts;
            classesInUse.push(clazz);
          }
        });

        var msg;
        if (classesInUse.length === 1) {
          msg = question('You are about to delete ' + checkedClasses.length + ' class(es). ' + textsInUse + ' text(s) are tagged with the ' + classesInUse[0].name + ' class. If you delete this class, the tags will be deleted from those texts.', 'Delete');
        } else if (classesInUse.length > 1) {
          msg = question('You are about to delete ' + checkedClasses.length + ' class(es). ' + textsInUse + ' text(s) are tagged with ' + classesInUse.length + ' different checked classes. If you delete these classes, the tags will be deleted from those texts.', 'Delete');
        } else {
          msg = question('Are you sure that you want to delete the ' + checkedClasses.length + ' class(es) that you have checked?', 'Delete');
        }

        ngDialog.openConfirm({template: msg, plain: true
        }).then(function remove () {
          return $scope.deleteClasses(checkedClasses);
        }, function cancel () {
          return $q.when();
        });
      };

      // prepare to delete all currently checked texts if operation is confirmed
      $scope.deleteCheckedTexts = function deleteCheckedTexts () {
        var checkedTexts = $scope.getChecked($scope.texts);
        var msg = question('Are you sure that you want to delete the ' + checkedTexts.length + ' text(s) that you have checked?', 'Delete');
        ngDialog.openConfirm({template: msg, plain: true
        }).then(function remove () {
          return $scope.deleteTexts(checkedTexts);
        }, function cancel () {
          return $q.when();
        });
      };

      // delete all class in <classesArray>
      $scope.deleteClasses = function deleteClasses (classesArray) {
        var ids = [];
        classesArray.forEach(function forEach (clazz) {
          ids.push(clazz.id);
        });
        return classes.removeAll(ids);
      };

      // delete all texts in <textsArray>
      $scope.deleteTexts = function deleteTexts (textsArray) {
        var ids = [];
        textsArray.forEach(function forEach (text) {
          ids.push(text.id);
        });
        return texts.removeAll(ids);
      };

      // -------------------------------------------------------------------------
      // Filtering functions
      // -------------------------------------------------------------------------

      // return array of classes filtered by label substring match with newClassString field
      // (this matches interactive behavior of text filter so not just based on leading characters e.g.)
      $scope.filteredClasses = function filteredClasses () {
        if (!$scope.newClassString) {
          return $scope.classes;
        }
        return _.filter($scope.classes, function filter (clazz) {
          return clazz.label.toLowerCase().indexOf($scope.newClassString.toLowerCase()) >= 0;
        });
      };

      // return array of texts filtered by class inclusion and further filtered by label substring match with newTextString field
      $scope.filteredTexts = function filteredTexts () {
        var selectedClasses = $scope.getSelectedClasses();
        var textsFilteredByClasses = [];
        if (selectedClasses.length === 0) {
          // no class filters present
          textsFilteredByClasses = $scope.texts;
        } else {
          // filter first by class inclusion
          for (var i = 0, textsLen = $scope.texts.length; i < textsLen; i++) {
            var text = $scope.texts[i];
            for (var j = 0, classesLen = selectedClasses.length; j < classesLen; j++) {
              if (text.classes.indexOf(selectedClasses[j].label) >= 0) {
                textsFilteredByClasses.push(text);
                break;
              }
            }
          }
        }
        // filter further by newTextString string if not empty
        if ($scope.newTextString) {
          return _.filter(textsFilteredByClasses, function filter (text) {
            return text.label.toLowerCase().indexOf($scope.newTextString.toLowerCase()) >= 0;
          });
        } else {
          return textsFilteredByClasses;
        }
      };

      // -------------------------------------------------------------------------
      // Tagging functions
      // -------------------------------------------------------------------------

      // return boolean indicating whether text <text> has any class tags
      $scope.isTagged = function isTagged (text) {
        return text.classes.length > 0;
      };

      // remove class tag with label <label> from text <text> if confirmed
      $scope.removeTag = function removeTag (text, label) {
        var msg;
        var index = text.classes.indexOf(label);
        if (index >= 0) {
          msg = question('Remove the ' + label + ' class from this text?', 'Remove');
          ngDialog.openConfirm({template: msg, plain: true
          }).then(function remove () {
            var clazz = $scope.getFromLabel($scope.classes, label);
            return texts.removeClasses(text.id, [{id: clazz.id}]);
          }, function cancel () {
            return $q.when();
          });
        } else {
          msg = inform('This text is not classified with the ' + label + ' class.');
          ngDialog.open({template: msg, plain: true});
          return $q.when();
        }
      };

      // mark text <text> as being tagged or dismiss tag field if already being tagged
      $scope.beginTaggingText = function beginTaggingText (text) {
        if (!text.beingTagged) {
          $scope.newTagStrings[text.$$hashKey] = '';
          text.beingTagged = true;
        } else {
          text.beingTagged = false;
        }
      };

      // handle keyup events from new tag field
      $scope.newTagFieldKeyUp = function newTagFieldKeyUp (event, text) {
        var keyCode = event.keyCode;
        switch (keyCode) {
          case 13:
            return $scope.tagText($scope.newTagStrings[text.$$hashKey], text);
          case 27:
            $scope.newTagStrings[text.$$hashKey] = '';
            text.beingTagged = false;
            return $q.when();
        }
      };

      $scope.tagTextByLabels = function tagTextByLabels (text, classesArray) {
        var classObjects = [];
        classesArray.forEach(function forEach (clazz) {
          var classObj = $scope.getFromLabel($scope.classes, clazz);
          if (classObj) {
            classObjects.push(classObj);
          }
        });
        if (classObjects.length > 0) {
          return $scope.tagTexts([text], classObjects);
        } else {
          return $q.when();
        }
      };

      // add a class tag with label <classLabel> to text <text>
      $scope.tagText = function tagText (classLabel, text) {
        $scope.newTagStrings[text.$$hashKey] = '';
        text.beingTagged = false;

        var msg;
        if (classLabel) {
          var classObj = $scope.getFromLabel($scope.classes, classLabel);
          if (!classObj) {
            msg = question('The ' + classLabel + ' class doesn\'t yet exist. Do you want to create it?', 'Create');
            ngDialog.openConfirm({template: msg, plain: true
            }).then(function create () {
              return $scope.add('class', classLabel, text.id);
            }, function cancel () {
              return $q.when();
            });
          } else {
            if (text.classes.indexOf(classLabel) >= 0) {
              msg = inform('This text has already been tagged with the ' + classLabel + ' class.');
              ngDialog.open({template: msg, plain: true});
              return $q.when();
            }
            return $scope.tagTexts([text], [classObj]);
          }
        } else {
          return $q.when();
        }
      };

      // prepare to add class tags for all checked classes to all checked texts
      $scope.tagCheckedTexts = function tagCheckedTexts () {
        if (!$scope.getChecked($scope.classes).length) {
          var msg = inform('Please select one or more classes first');
          ngDialog.open({template: msg, plain: true});
          return $q.when();
        }
        return $scope.tagTexts($scope.getChecked($scope.texts), $scope.getChecked($scope.classes));
      };

      // add class tags in array <classesArray> to all texts in array <textsArray>
      $scope.tagTexts = function tagTexts (textArray, classes) {
        var promises = [];
        textArray.forEach(function forEach (text) {
          var classIds = [];
          classes.forEach(function forEach (clazz) {
            if (text.classes.indexOf(clazz.label) < 0) {
              // text.classes.push(clazz.label);
              classIds.push({ id: clazz.id });
            }
          });
          if (classIds.length > 0) {
            promises.push(texts.addClasses(text.id, classIds));
          }
        });
        return $q.all(promises);
      };

      // -------------------------------------------------------------------------
      // Dialog functions
      // -------------------------------------------------------------------------

      // construct html for ngDialog used to inform string <aString>
      function inform (aString) {
        var contents = '<div>' + aString + '</div>';
        contents += '<br>';
        contents += '<form class="ngdialog-buttons">';
        contents += '<input type="submit" value="OK" class="ngdialog-button ngdialog-button-primary" ng-click="closeThisDialog(' + 'Cancel' + ')">';
        contents += '</form>';
        return contents;
      }

      // construct html for ngDialog used to ask question in string <aString>
      function question (aString, confirmStr) {
        var contents = '<div>' + aString + '</div>';
        contents += '<br>';
        contents += '<form class="ngdialog-buttons" ng-submit="confirm(' + 'OK' + ')">';
        contents += '<input type="submit" value="'+(confirmStr || 'OK')+'" class="ngdialog-button ngdialog-button-primary" ng-click="confirm('+ 'OK'+ ')">';
        contents += '<input type="button" value="Cancel" class="ngdialog-button ngdialog-button-secondary" ng-click="closeThisDialog(' + 'Cancel' + ')">';
        contents += '</form>';
        return contents;
      }

      // -------------------------------------------------------------------------
      // Train functions
      // -------------------------------------------------------------------------

      $scope.train = function train () {
        var i, msg;
        var unclassified = 0;
        var validationIssues = 0;

        // var trainingData = $scope.toCsv();

        function createTrainingData () {
          // create training data
          var trainingData = [];
          $scope.texts.forEach(function forEach (text) {
            if (text.classes.length > 0) {
              trainingData.push({
                text: text.label,
                classes: text.classes
              });
            }
          });
          return trainingData;
        }

        function submitTrainingData (trainingData) {
          $scope.loading.savingClassifier = true;
          // send to NLC service and then navigate to classifiers page
          nlc.train(trainingData, $scope.languageOption.value, $scope.newClassifier.name).then(function success () {
            $scope.showTrainConfirm = false;
            $state.go('classifiers');
          }, function error (err) {
            $scope.loading.savingClassifier = false;
            $scope.showTrainConfirm = false;
            watsonAlerts.add({ level: 'error', text: err.message });
          });
        }

        // validation - should this be server side, or at least a part of the service?
        for (i = 0; i < $scope.texts.length; i++) {
          // check to see if any of the texts have no classes tagged.
          if ($scope.texts[i].classes.length === 0) {
            unclassified++;
            continue;
          }
          // if the text's label is too long, stop the training from occuring, but inform the user first.
          if ($scope.texts[i].label.length > 1024) {
            validationIssues++;
            var stringFragment = $scope.texts[i].label.substring(0, 60) + ' ...';
            msg = inform('"' + stringFragment + '" is longer than 1024 characters. Please shorten or remove it before starting training.');
            ngDialog.open({template: msg, plain: true});
            return $q.when();
          }
        }

        // if some invalid characters have been used, do not allow the training to go ahead.
        // Inform the user using a dialog box and closr the box when they confirm they have read it.
        for (i = 0; i < $scope.classes.length; i++) {
          if ($scope.numberTextsInClass($scope.classes[i]) > 0 && !$scope.classes[i].label.match('^[a-zA-Z0-9_-]*$')) {
            validationIssues++;
            msg = inform('The ' + $scope.classes[i].label + ' class has invalid characters. Class values can include only alphanumeric characters (A-Z, a-z, 0-9), underscores, and dashes.');
            ngDialog.open({template: msg, plain: true});
            return $q.when();
          }
        }

        // if some texts do not have a class tagged, check that the user still wants to train.
        if (unclassified > 0) {
          validationIssues++;
          msg = question(unclassified + ' texts are not classified. You can find them by sorting by "Fewest Classes". They will not be included in training. Continue?');
          ngDialog.openConfirm({
            template: msg, plain: true
          }).then(function() {
            // if the user presses 'ok', then train, otherwise the dialog will be closed
            submitTrainingData(createTrainingData());
          });
        }

        // if no validation issues have been found, create and submit the training data
        if (!validationIssues){
          submitTrainingData(createTrainingData());
        }
      };

      // set language by dropdown selection
      $scope.setLanguageOption = function setLanguageOption (option) {
        $scope.languageOption = option;
      };

      // -------------------------------------------------------------------------
      // Import/export functions
      // -------------------------------------------------------------------------

      $scope.exportToFile = function exportToFile () {
        return content.downloadFile();
      };

      function importProgress (evt) {
        $scope.import = true;
        $scope.importProgress = parseInt(100 * evt.loaded / evt.total);
      }

      function importSuccess () {
        $scope.importing = false;
        $scope.importProgress = 0;
      }

      $scope.importFiles = function importFiles () {
        var files = $scope.files;
        if (files.length === 0) {
          return $q.when();
        } else {
          return content.importFiles(files, importProgress, importSuccess);
        }
      };

    }
  ]);
