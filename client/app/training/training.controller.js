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
  .controller('TrainingCtrl', ['$scope', '$state', '$http', '$q', '$log', 'ngDialog', 'classes', 'texts', 'nlc', 'errors',
    function init ($scope, $state, $http, $q, $log, ngDialog, classes, texts, nlc, errors) {

      // Page Loading Variables
      $scope.loading = {
        classes : true,
        texts: true,
        savingClassifier: false
      };

      // -------------------------------------------------------------------------
      // Load functions
      // -------------------------------------------------------------------------

      $scope.loadClasses = function loadClasses () {
        var deferred = $q.defer();
        classes.query({}, function query (err, data) {
          if (err) {
            $log.error('error getting classes: ' + JSON.stringify(err));
            deferred.reject(err);
            return deferred.promise;
          }
          data.forEach(function forEach (element) {
            element.$$hashKey = data.id;
            element.seq = $scope.sequenceNumber++;
            element.label = element.name;
            element.edit = false;
            element.checked = false;
            element.selected = false;
          });
          deferred.resolve(data);
          $scope.loading.classes = false;
          $scope.classes = data;
        });
        return deferred.promise;
      };

      $scope.loadTexts = function loadTexts () {
        var deferred = $q.defer();
        texts.query({}, function query (err, data) {
          if (err) {
            $log.error('error loading texts: ' + JSON.stringify(err));
            deferred.reject(err);
            return deferred.promise;
          }
          data.forEach(function forEach (element) {
            element.$$hashKey = data.id;
            element.seq = $scope.sequenceNumber++;
            element.label = element.value;
            element.classes = element.classes || [];
            for (var i = 0, len = element.classes.length; i < len; i++) {
              element.classes[i] = $scope.getFromId($scope.classes, element.classes[i]).label;
            }
            element.edit = false;
            element.checked = false;
          });
          deferred.resolve(data);
          $scope.loading.texts = false;
          $scope.texts = data;
        });
        return deferred.promise;
      };

      // -----------------------------------------------------------------------------------

      // sequence number for class and text elements
      $scope.sequenceNumber = 0;

      // language options
      $scope.languageOptions = [
        { label: 'Brazilian Portuguese', value: 'pt-br' },
        { label: 'English', value: 'en' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Spanish', value: 'es' }
      ];
      $scope.languageOption = $scope.languageOptions[1];

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

      // load the classes and texts to initialize the page
      $scope.loadClasses().then(function afterLoadClasses () {
        return $scope.loadTexts();
      }, function error (err) {
        $log.error('error loading classes: ' + JSON.stringify(err));
      }).then(function afterLoadTexts () {
        $log.debug('success loading classes and texts');
      }, function error (err) {
        $log.error('error loading texts: ' + JSON.stringify(err));
      });

      // watch for appActions from the UI
      $scope.$on('appAction', function watch (event, args) {
        var name = args.name, data = args.data;
        switch (name) {
          case 'import':
            $scope.importFile(data);
            break;
          case 'export':
            $scope.exportToFile();
            break;
          case 'train':
            $scope.train();
            break;
          default:
            ngDialog.open({
              template: $scope.inform(name + ' not yet handled by training controller.'),
              plain: true
            });
        }
      });

      // ---------------------------------------------------------------------------------------------
      //
      // ------------------------------------ array sets/gets ----------------------------------------
      //
      // ---------------------------------------------------------------------------------------------

      // set ['checked'] to `bool` for all objects in an array
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

      // return an array of selected classes
      $scope.getSelected = function getSelected () {
        return _.filter($scope.classes, function filter (c) {
          return c.selected;
        });
      };

      // return a class or text with a given label
      $scope.getFromLabel = function(array, label) {
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
      $scope.getFromId = function(array, id) {
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

      $scope.getScopeArray = function(type) {
        switch(type) {
          case 'class':
          return $scope.classes;
          case 'text':
          return $scope.texts;
        }
      };

      // ---------------------------------------------------------------------------------------------
      //
      // ----------------------------------- classes & texts ------------------------------------
      //
      // ---------------------------------------------------------------------------------------------

      // set function for the variable controlling the list's sort
      $scope.setClassOrderOption = function (option) {
        // needs wrapping inside a $scope function to be accessible in HTML
        $scope.classOrderOption = option;
      };

      // a switch to determine the value used for the list's sort
      $scope.classOrder = function (aClass) {
        switch ($scope.classOrderOption.value) {
          case 'newest':
          return -aClass.seq;
          case 'oldest':
          return aClass.seq;
          case 'alpha':
          return aClass.label;
          case 'most':
          return -$scope.numberTextsInClass(aClass);
          case 'fewest':
          return $scope.numberTextsInClass(aClass);
          default:
          return -aClass.seq;
        }
      };

      // set function for the variable controlling the list's sort
      $scope.setTextOrderOption = function (option){
        // needs wrapping inside a $scope function to be accessible in HTML
        $scope.textOrderOption = option;
      };

      // a switch to determine the value used for the list's sort
      $scope.textOrder = function (anText) {
        switch ($scope.textOrderOption.value) {
          case 'newest':
          return -anText.seq;
          case 'oldest':
          return anText.seq;
          case 'alpha':
          return anText.label;
          case 'most':
          return -$scope.classesForText(anText).length;
          case 'fewest':
          return $scope.classesForText(anText).length;
          default:
          return -anText.seq;
        }
      };

      // ---------------------------------------------------------------------------------------------

      // handle a click on a class row in the classes table
      $scope.selectClass = function (aClass) {
        if (!aClass.edit) {
          aClass.selected = !aClass.selected;
        }
      };

      // ---------------------------------------------------------------------------------------------

      // toggle 'edit' attribute of <classOrText>
      $scope.editField = function (classOrText) {
        if (!classOrText.edit) {
          classOrText.edit = true;
        }
        else {
          $scope.dismissEditField(classOrText);
        }
      };

      // ---------------------------------------------------------------------------------------------

      // set the edit attibute of a given object to false. Used for toggline edit-mode for classes and texts
      $scope.dismissEditField = function(classOrText) {
        var field;
        field = window.document.getElementById(classOrText.$$hashKey);
        field.value = classOrText.label;
        classOrText.edit = false;
      };

      // ---------------------------------------------------------------------------------------------

      // check the keyup event to see if the user has pressed 'esc' key. If so, dismiss the editing field
      $scope.keyUpCancelEditing = function(classOrText, event) {
        if (event.keyCode === 27) {
          $scope.dismissEditField(classOrText);
        }
      };

      // ---------------------------------------------------------------------------------------------

      $scope.changeLabel = function(type, object) {
        var msg, oldLabel = object.label, field, newLabel;
        field = window.document.getElementById(object.$$hashKey);
        newLabel = field.value;
        if (newLabel === '' || newLabel === oldLabel) {
          field.value = oldLabel;  // required so that empty value doesn't stick in text field
          object.edit = false;
        } else {
          var allObjects = $scope.getScopeArray(type);
          if ($scope.containsLabel(allObjects, newLabel)) {
            msg = $scope.inform('The ' + type + ' "' + newLabel + '" already exists.');
            ngDialog.open({template: msg, plain: true});
          } else {
            object.edit = false;  // turn editing back off before saving state
            object.label = newLabel;
            field.value = newLabel;
            switch (type) {
              case 'class':
              $scope.classLabelChanged(object, oldLabel, newLabel);
              break;
              case 'text':
              $scope.textLabelChanged(object, oldLabel, newLabel);
              break;
            }
          }
        }
      };

      // ---------------------------------------------------------------------------------------------

      // propagate label <newLabel> to all texts tagged with label <oldLabel>
      $scope.classLabelChanged = function (object, oldLabel, newLabel) {
        $scope.texts.forEach(function forEach (text) {
          var index = text.classes.indexOf(oldLabel);
          if (index >= 0) {
            text.classes[index] = newLabel;
          }
        });

        classes.update(object.id, { name: newLabel }, function (err) {
          if (err) {
            $log.error('error changing class label from ' + oldLabel + ' to ' + newLabel);
            // TODO: need to revert other changes?
          } else {
            $log.debug('success changing class label from ' + oldLabel + ' to ' + newLabel);
          }
        });
      };

      // persist the change to the text label
      $scope.textLabelChanged = function (object, oldLabel, newLabel) {
        texts.update(object.id, { value: newLabel }, function (err) {
          if (err) {
            $log.error('error changing text label from ' + oldLabel + ' to ' + newLabel);
          } else {
            $log.debug('success changing text label from ' + oldLabel + ' to ' + newLabel);
          }
        });
      };

      // ---------------------------------------------------------------------------------------------

      // Counts the number of texts that have a given <aClass> tagged
      $scope.numberTextsInClass = function (aClass) {
        var i, n = 0;
        for (i = 0; i < $scope.texts.length; i += 1) {
          if ($scope.texts[i].classes.indexOf(aClass.label) >= 0) {
            n++;
          }
        }
        return n;
      };

      // ------------------------------------------------------------------------------------------------

      // return all classes tagged in text <anText>
      $scope.classesForText = function (anText) {
        var i, classes = [];
        for (i = 0; i < anText.classes.length; i++) {
          classes.push($scope.getFromLabel($scope.classes, anText.classes[i]));
        }
        return classes;
      };

      // ---------------------------------------------------------------------------------------------

      $scope.add = function (type, label) {
        $scope.newClassString = '';
        $scope.newTextString = '';
        var deferred = $q.defer();
        if (!label) {
          deferred.resolve();
          return deferred.promise;
        }
        // if an object already exists with this label
        var existingObject = $scope.getFromLabel($scope.getScopeArray(type), label);
        if (existingObject) {
          var msg = $scope.inform('The ' + type + ' "' + existingObject.label + '" already exists.');
          ngDialog.open({template: msg, plain: true});
          deferred.resolve();
          return deferred.promise();
        } else {
          var id = '';
          switch (type) {
            case 'class' :
            classes.post({ name : label }, function post (err, data) {
              if (err) {
                deferred.reject(err);
              } else {
                id = data.id;
                var newClass = {'$$hashKey' : id, 'id' : id, 'seq' : $scope.sequenceNumber++, 'label' : label, 'edit' : false, 'checked' : false, 'selected': false};
                $scope.classes.push(newClass);
                $scope.newClassString = '';
                deferred.resolve(newClass);
              }
            });
            return deferred.promise;
            case 'text' :
            texts.post({ value : label }, function post (err, data) {
              if (err) {
                deferred.reject(err);
              } else {
                id = data.id;
                var newText = {'$$hashKey' : id, 'id' : id, 'seq' : $scope.sequenceNumber++, 'label' : label, 'classes' : [], 'edit': false, 'checked' : false, 'beingTagged': false};
                $scope.tagTexts([newText], $scope.getSelected());
                $scope.texts.push(newText);
                $scope.newTextString = '';
                deferred.resolve(newText);
              }
            });
            return deferred.promise;
          }
        }

      };

      // ---------------------------------------------------------------------------------------------

      // prepare to delete class <aClass> if operation is confirmed
      $scope.deleteClass = function (aClass) {
        var label;
        if (aClass.label.length > 40) {
          label = aClass.label.substring(0, 40) + '...';
        } else {
          label = aClass.label;
        }

        var msg;
        if ($scope.numberTextsInClass(aClass) === 0) {
          msg = $scope.question('Delete ' + label + ' class?', 'Delete');
        } else {
          msg = $scope.question($scope.numberTextsInClass(aClass) + ' text(s) are tagged with the '  + label + ' class. If you delete this class, it will be removed from those tests.', 'Delete');
        }

        ngDialog.openConfirm({template: msg, plain: true
        }).then(function() {  // ok
          $scope.deleteClasses([aClass]);
        });
      };

      // prepare to delete text <anText> if operation is confirmed
      $scope.deleteText = function (anText) {
        var label;
        if (anText.label.length > 60) {
          label = anText.label.substring(0, 60) + '...';
        } else {
          label = anText.label;
        }

        var msg = $scope.question('Delete ' + label + ' text?', 'Delete');
        ngDialog.openConfirm({template: msg, plain: true
        }).then(function() {  // ok
          $scope.deleteTexts([anText]);
        });
      };

      // ---------------------------------------------------------------------------------------------

      // prepare to delete all currently checked classes if operation is confirmed
      $scope.deleteCheckedClasses = function () {
        var msg;
        var checkedClasses = $scope.getChecked($scope.classes);
        var textsInUse = 0, classesInUse = [];

        checkedClasses.forEach(function(d) {
          var taggedTexts = $scope.numberTextsInClass(d);
          if (taggedTexts>0) {
            textsInUse = textsInUse + $scope.numberTextsInClass(d);
            classesInUse.push(d);
          }
        });

        if (classesInUse.length === 1) {
          msg = $scope.question(textsInUse + ' text(s) are tagged with ' + classesInUse[0].name + ' class. If you delete this class, the tags will be removed from those texts.', 'Delete');
        }
        else if (classesInUse.length > 1) {
          msg = $scope.question('You are about to delete ' + checkedClasses.length + ' classes. ' + textsInUse + ' text(s) are tagged with ' + classesInUse.length + ' different checked classes. If you delete these classes, the tags will be deleted from those texts.', 'Delete');
        } else {
          msg = $scope.question('Are you sure that you want to delete the ' + checkedClasses.length + ' class(es) that you have checked?', 'Delete');
        }

        ngDialog.openConfirm({template: msg, plain: true
        }).then(function() {  // ok
          $scope.deleteClasses($scope.getChecked($scope.classes));
        });
      };

      // prepare to delete all currently checked texts if operation is confirmed
      $scope.deleteCheckedTexts = function () {
        var checkedTexts = $scope.getChecked($scope.texts);
        var msg = $scope.question('Are you sure that you want to delete the ' + checkedTexts.length + ' text(s) that you have checked?', 'Delete');
        ngDialog.openConfirm({template: msg, plain: true
        }).then(function() {  // ok
          $scope.deleteTexts(checkedTexts);
        });
      };

      // ---------------------------------------------------------------------------------------------

      // delete all class in <classArray>
      $scope.deleteClasses = function (classArray) {
        var i, j, classLength, textLength, index;
        for (i = 0, classLength = classArray.length; i < classLength; i++) {
          for (j = 0, textLength = $scope.texts.length; j < textLength; j++) {
            index = $scope.texts[j].classes.indexOf(classArray[i].label);
            if (index >= 0) {
              $scope.texts[j].classes.splice(index, 1);
            }
          }
          var clazz = classArray[i];
          index = $scope.classes.indexOf(clazz);
          $scope.classes.splice(index, 1);
          $scope.removeClass(clazz.id);
        }
      };

      // removes a class from the database with the given id
      $scope.removeClass = function (id) {
        classes.remove(id, function remove (err) {
          if (err) {
            $log.error('error removing class ' + id + ': ' + JSON.stringify(err));
          } else {
            $log.debug('success removing class ' + id);
          }
        });
      };

      // delete all texts in <textArray>
      $scope.deleteTexts = function (textArray) {
        var i, index;
        for (i = 0; i < textArray.length; i++) {
          var text = textArray[i];
          index = $scope.texts.indexOf(text);
          $scope.texts.splice(index, 1);
          $scope.removeText(text.id);
        }
      };

      $scope.removeText = function (id) {
        texts.remove(id, function remove (err) {
          if (err) {
            $log.error('error removing text ' + id + ': ' + JSON.stringify(err));
          } else {
            $log.debug('success removing text ' + id);
          }
        });
      };

      // ---------------------------------------------------------------------------------------------

      // return array of classes filtered by label substring match with newClassString field
      // (this matches interactive behavior of text filter so not just based on leading characters e.g.)
      $scope.filteredClasses = function () {
        var i, results = [];
        if (!$scope.newClassString) {
          return $scope.classes;
        }
        for (i = 0; i < $scope.classes.length; i++) {
          if ($scope.classes[i].label.toLowerCase().indexOf($scope.newClassString.toLowerCase()) >= 0) {
            results.push($scope.classes[i]);
          }
        }
        return results;
      };

      // return array of texts filtered by class inclusion and further filtered by label substring match with newTextString field
      $scope.filteredTexts = function () {
        var i, j, selectedClasses = $scope.getSelected(), firstFilteredResults = [], results = [];
        if (selectedClasses.length === 0) {
          // no class filters present
          firstFilteredResults = $scope.texts;
        }
        else {
          // filter first by class inclusion
          for (i = 0; i < $scope.texts.length; i++) {
            for (j = 0; j < selectedClasses.length; j++) {
              if ($scope.texts[i].classes.indexOf(selectedClasses[j].label) >= 0) {
                firstFilteredResults.push($scope.texts[i]);
                break;
              }
            }
          }
        }
        // filter further by newTextString string if not empty
        if ($scope.newTextString) {
          for (i = 0; i < firstFilteredResults.length; i++) {
            if (firstFilteredResults[i].label.toLowerCase().indexOf($scope.newTextString.toLowerCase()) >= 0) {
              results.push(firstFilteredResults[i]);
            }
          }
        }
        else {
          results = firstFilteredResults;
        }
        return results;
      };

      // ---------------------------------------------------------------------------------------------

      // uncheck class <aClass> removing it from the collection of class filters for the texts list
      $scope.removeClassFromView = function (aClass) {
        aClass.selected = false;
      };

      // -------------------------------------------------------------------------------------------------
      //
      // --------------------- tagging (associating text with class or classes) ---------------------
      //
      // -------------------------------------------------------------------------------------------------

      // return boolean indicating whether text <anText> has any class tags
      $scope.isTagged = function (anText) {
        return anText.classes.length > 0;
      };

      // remove class tag with label <label> from text <anText> if confirmed
      $scope.removeTag = function (anText, label) {
        var msg;
        if (anText.classes.indexOf(label) >= 0) {
          msg = $scope.question('Remove class "' + label + '" from this text?', 'Remove');
          ngDialog.openConfirm({template: msg, plain: true
          }).then(function() {
            anText.classes = anText.classes.filter($scope.doesNotMatch(label));
            var clazz = $scope.getFromLabel($scope.classes, label);
            texts.removeClasses(anText.id, [{id: clazz.id}], function (err) {
              if (err) {
                $log.error('error removing class ' + label + ' from text ' + anText.label + ': ' + JSON.stringify(err));
              } else {
                $log.debug('success removing class ' + label + ' from text ' + anText.label);
              }
            });
          });
        } else {
          msg = $scope.inform('This text is not classified with class "' + label + '".');
          ngDialog.openConfirm({template: msg, plain: true});
        }
      };

      // mark text <anText> as being tagged or dismiss tag field if already being tagged
      $scope.beginTaggingText = function (anText) {
        //var field;
        if (!anText.beingTagged) {
          $scope.newTagStrings[anText.$$hashKey] = '';
          anText.beingTagged = true;
        }
        else {
          anText.beingTagged = false;
        }
      };

      // handle keyup events from new tag field
      $scope.newTagFieldKeyUp = function (event, anText) {
        var keyCode = event.keyCode, tagString;
        switch (keyCode) {
          case 13:
          tagString = $scope.newTagStrings[anText.$$hashKey];
          $scope.newTagStrings[anText.$$hashKey] = '';
          anText.beingTagged = false;
          $scope.tagText(tagString, anText);
          break;
          case 27:
          $scope.newTagStrings[anText.$$hashKey] = '';
          anText.beingTagged = false;
          break;
        }
      };

      $scope.tagTextByLabels = function tagTextByLabels (text, classes) {
        var classObjects = [];
        for (var i = 0, len = classes.length; i < len; i++) {
          var classObj = $scope.getFromLabel($scope.classes, classes[i]);
          if (classObj) {
            classObjects.push(classObj);
          }
        }

        if (classObjects.length > 0) {
          $scope.tagTexts([text], classObjects);
        }
      };

      // add a class tag with label <classLabel> to text <anText>
      $scope.tagText = function (classLabel, anText) {
        var i, msg, classObj;
        if (classLabel) {
          classObj = $scope.getFromLabel($scope.classes, classLabel);
          if (!classObj) {
            msg = $scope.question('The ' + classLabel + 'class doesn\'t yet exist. Do you want to create it?', 'Create');
            ngDialog.openConfirm({template: msg, plain: true
            }).then(function() {
              $scope.add('class', classLabel).then(function (classObj) {
                return $scope.tagTexts([anText], [classObj]);
              }, function (err) {
                $log.error('error creating new class: ' + JSON.stringify(err));
              });
            });
          }
          else {
            for (i = 0; i < anText.classes.length; i++) {
              if (anText.classes[i].toLowerCase() === classLabel.toLowerCase()) {
                msg = $scope.inform('This text has already been tagged with ' + anText.classes[i] + '.');
                ngDialog.openConfirm({template: msg, plain: true});
                return;
              }
            }
            $scope.tagTexts([anText], [classObj]);
          }
        }
      };

      // prepare to add class tags for all checked classes to all checked texts
      $scope.tagCheckedTexts = function () {
        var msg;
        if (!$scope.getChecked($scope.classes).length) {
          msg = $scope.inform('Please select one or more classes first');
          ngDialog.openConfirm({template: msg, plain: true});
        }
        $scope.tagTexts($scope.getChecked($scope.texts), $scope.getChecked($scope.classes));
      };

      // add class tags in array <classesArray> to all texts in array <textsArray>
      $scope.tagTexts = function (textsArray, classesArray) {
        var i, j;
        var textsLength = textsArray.length;
        var classesLength = classesArray.length;
        var classIds;
        for (i = 0; i < textsLength; i++) {
          classIds = [];
          for (j = 0; j < classesLength; j++) {
            if (textsArray[i].classes.indexOf(classesArray[j].label) < 0) {
              textsArray[i].classes.push(classesArray[j].label);
              classIds.push({ id : classesArray[j].id });
            }
          }
          if (classIds.length > 0) {
            $scope.addClassesToText(textsArray[i].id, classIds);
          }
        }
      };

      $scope.addClassesToText = function (id, classIds) {
        return texts.addClasses(id, classIds, function (err) {
          if (err) {
            $log.error('error adding classes: ' + JSON.stringify(err));
          } else {
            $log.debug('success adding classes');
          }
        });
      };

      // -------------------------------------------------------------------------------------------------
      //
      // --------------------------------------- dialog functions ----------------------------------------
      //
      // -------------------------------------------------------------------------------------------------

      // construct html for ngDialog used to inform string <aString>
      $scope.inform = function (aString) {
        var contents;
        contents = '<div>' + aString + '</div>';
        contents += '<br>';
        contents += '<form class="ngdialog-buttons">';
        contents += '<input type="submit" value="OK" class="ngdialog-button ngdialog-button-primary" ng-click="closeThisDialog(' + 'Cancel' + ')">';
        contents += '</form>';
        return contents;
      };

      // construct html for ngDialog used to ask question in string <aString>
      $scope.question = function (aString, confirmStr) {
        var contents;
        contents = '<div>' + aString + '</div>';
        contents += '<br>';
        contents += '<form class="ngdialog-buttons" ng-submit="confirm(' + 'OK' + ')">';
        contents += '<input type="submit" value="'+(confirmStr || 'OK')+'" class="ngdialog-button ngdialog-button-primary" ng-click="confirm('+ 'OK'+ ')">';
        contents += '<input type="button" value="Cancel" class="ngdialog-button ngdialog-button-secondary" ng-click="closeThisDialog(' + 'Cancel' + ')">';
        contents += '</form>';
        return contents;
      };

      // -------------------------------------------------------------------------------------------------
      //
      // --------------------------------------- general functions ---------------------------------------
      //
      // -------------------------------------------------------------------------------------------------

      // return all elements in array that do not match string <aString>
      $scope.doesNotMatch = function (aString) {
        return function (element) {
          return element !== aString;
        };
      };

      // -------------------------------------------------------------------------------------------------
      //
      // --------------------------------------- API/Service functions -----------------------------------
      //
      // -------------------------------------------------------------------------------------------------

      $scope.train = function () {
        var i, msg;
        var unclassified = 0, validationIssues = 0;

        // var trainingData = $scope.toCsv();

        function createTrainingData() {
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

        function submitTrainingData(trainingData) {
          $scope.loading.savingClassifier = true;
          // send to NLC service and then navigate to classifiers page
          nlc.train(trainingData, $scope.languageOption.value, $scope.newClassifier.name).then(function(){
            $scope.showTrainConfirm = false;
            $state.go('classifiers');
          }, function(err) {
            $scope.loading.savingClassifier = false;
            $scope.showTrainConfirm = false;
            errors.publish(err);
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
            msg = $scope.inform('"' + stringFragment + '" is longer than 1024 characters. Please shorten or remove it before starting training.');
            ngDialog.open({template: msg, plain: true});
            return;
          }
        }

        // if some invalid characters have been used, do not allow the training to go ahead.
        // Inform the user using a dialog box and closr the box when they confirm they have read it.
        for (i = 0; i < $scope.classes.length; i++) {
          if ($scope.numberTextsInClass($scope.classes[i]) > 0 && !$scope.classes[i].label.match('^[a-zA-Z0-9_-]*$')) {
            validationIssues++;
            msg = $scope.inform('The ' + $scope.classes[i].label + ' class has invalid characters. Class values can include only alphanumeric characters (A-Z, a-z, 0-9), underscores, and dashes.');
            ngDialog.open({template: msg, plain: true});
            return;
          }
        }

        // if some texts do not have a class tagged, check that the user still wants to train.
        if (unclassified > 0) {
          validationIssues++;
          msg = $scope.question(unclassified + ' texts are not classified. You can find them by sorting by "Fewest Classes". They will not be included in training. Continue?');
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

      $scope.exportToFile = function () {
        nlc.download($scope.texts, $scope.classes);
      };

      $scope.addClass = function addClass (label) {
        return $scope.add('class', label).then(function (data) {
          return data;
        }, function (err) {
          $log.error('error adding class: ' + JSON.stringify(err));
          return null;
        });
      };

      $scope.addText = function addText (label, classes) {
        return $scope.add('text', label).then(function (data) {
          $scope.tagTextByLabels(data, classes);
          return data;
        }, function (err) {
          $log.error('error adding text: ' + JSON.stringify(err));
          return null;
        });
      };

      $scope.importClasses = function importClasses (classes) {
        var promises = [];
        for (var i = 0, len = classes.length; i < len; i++) {
          if (!$scope.containsLabel($scope.classes, classes[i])) {
            promises.push($scope.addClass(classes[i]));
          }
        }
        return $q.all(promises);
      };

      $scope.importTexts = function importTexts (texts) {
        var promises = [];
        for (var i = 0, len = texts.length; i < len; i++) {
          var text = $scope.getFromLabel($scope.texts, texts[i].text);
          if (text === null) {
            promises.push($scope.addText(texts[i].text, texts[i].classes));
          } else {
            $scope.tagTextByLabels(text, texts[i].classes);
          }
        }
        return $q.all(promises);
      };

      $scope.importFile = function (fileContent) {
        var uploadResult = {};
        nlc.upload(fileContent).then(function (data) {
          uploadResult = data;
          return $scope.importClasses(uploadResult.classes);
        }).then(function () {
          return $scope.importTexts(uploadResult.text);
        });
      };

      // set language by dropdown selection
      $scope.setLanguageOption = function (option) {
        $scope.languageOption = option;
      };

    }
  ]);
