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

describe('Controller: TrainingController', function() {

  // load the controller's module
  beforeEach(module('ibmwatson-nlc-groundtruth-app'));

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  var TrainingController, scope;
  var classesMock, textsMock, nlcMock, contentMock;
  var CLASSES, TEXTS, SCOPECLASSES, SCOPETEXTS;

  var CLASS = 'class';
  var TEXT = 'text';
  var OLD_CLASS_LABEL = 'class1';
  var OLD_TEXT_LABEL = 'text1';
  var EXISTING_CLASS_LABEL = 'class2';
  var EXISTING_TEXT_LABEL = 'text2';
  var NEW_LABEL = 'label';
  var EMPTY_LABEL = '';

  var BAD_ID = 'BAD';
  var GOOD_ID = '0';
  var BAD_ARGS = {};
  var ERROR_MSG = { msg: 'error' };

  var GOOD_POST_RESPONSE = { id: '4' };
  var GOOD_UPDATE_RESPONSE = { id: '4' };
  var GOOD_PATCH_RESPONSE = { id: '4' };
  var GOOD_REMOVE_RESPONSE = {};

  var ORDER_OPTIONS = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Alphabetical', value: 'alpha' },
    { label: 'Most', value: 'most' },
    { label: 'Fewest', value: 'fewest' }
  ];
  var BAD_ORDER_OPTION = { label: 'Bad', value: 'bad' };

  function resetClasses() {
    // Mock NLC API response
    CLASSES = [{
      name: 'class1',
      id: '0'
    }, {
      name: 'class2',
      id: '1'
    }, {
      name: 'class3',
      id: '2'
    }, {
      name: 'loooooooooooooooooooooooooooooooooooooooooooooooonglabel',
      id: '3'
    }];
    // Mock Scope Array
    SCOPECLASSES = [{
      label: 'class1',
      name: 'class1',
      id: '0',
      $$hashKey: '0',
      checked : false,
      edit: false,
      selected: false,
      seq: 0,
    }, {
      label: 'class2',
      name: 'class2',
      id: '1',
      $$hashKey: '1',
      checked : false,
      edit: false,
      selected: false,
      seq: 1,
    }, {
      label: 'class3',
      name: 'class3',
      id: '2',
      $$hashKey: '2',
      checked : false,
      edit: false,
      selected: false,
      seq: 2,
    }, {
      label: 'loooooooooooooooooooooooooooooooooooooooooooooooonglabel',
      name: 'loooooooooooooooooooooooooooooooooooooooooooooooonglabel',
      id: '3',
      $$hashKey: '3',
      checked : false,
      edit: false,
      selected: false,
      seq: 3,
    }];
  }

  function resetTexts() {
    // Mock NLC API response
    TEXTS = [{
      value: 'text1',
      classes: ['0'],
      id: '0'
    }, {
      value: 'text2',
      classes: ['0', '2'],
      id: '1',
    }, {
      value: 'text3',
      classes: ['2'],
      id: '2'
    }, {
      value: 'loooooooooooooooooooooooooooooooooooooooooooooooonglabel',
      classes: ['2'],
      id: '3'
    }];
    // Mock Scope array
    SCOPETEXTS = [{
      label: 'text1',
      value: 'text1',
      classes: ['class1'],
      id: '0',
      $$hashKey: '0',
      seq: 0,
      checked: false,
      edit: false
    }, {
      label: 'text2',
      value: 'text2',
      classes: ['class1', 'class3'],
      id: '1',
      $$hashKey: '1',
      seq: 1,
      checked: false,
      edit: false
    }, {
      label: 'text3',
      value: 'text3',
      classes: ['class3'],
      id: '2',
      $$hashKey: '2',
      seq: 2,
      checked: false,
      edit: false
    }, {
      label: 'loooooooooooooooooooooooooooooooooooooooooooooooonglabel',
      value: 'loooooooooooooooooooooooooooooooooooooooooooooooonglabel',
      classes: ['class3'],
      id: '3',
      $$hashKey: '3',
      seq: 3,
      checked: false,
      edit: false
    }];
  }

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $compile, $rootScope, $q) {
    var promise = function (data) {
      return $q(function (resolve) {
        resolve(data);
      });
    };

    // set the variables so that the mocks return the correct data
    resetClasses();
    resetTexts();

    nlcMock = {
      train: sinon.stub()
    };

    classesMock = {
      query: sinon.stub(),
      post: sinon.stub(),
      removeAll: sinon.stub(),
      update: sinon.stub()
    };
    classesMock.query.returns(promise(CLASSES));
    classesMock.post.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    classesMock.post.returns(promise(GOOD_POST_RESPONSE));
    classesMock.removeAll.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    classesMock.removeAll.returns(promise(GOOD_REMOVE_RESPONSE));
    classesMock.update.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    classesMock.update.returns(promise(GOOD_UPDATE_RESPONSE));

    textsMock = {
      query: sinon.stub(),
      post: sinon.stub(),
      removeAll: sinon.stub(),
      update: sinon.stub(),
      removeClasses: sinon.stub(),
      addClasses: sinon.stub()
    };
    textsMock.query.returns(promise(TEXTS));
    textsMock.post.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    textsMock.post.returns(promise(GOOD_POST_RESPONSE));
    textsMock.removeAll.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    textsMock.removeAll.returns(promise(GOOD_REMOVE_RESPONSE));
    textsMock.update.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    textsMock.update.returns(promise(GOOD_UPDATE_RESPONSE));
    textsMock.addClasses.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    textsMock.addClasses.returns(promise(GOOD_PATCH_RESPONSE));
    textsMock.removeClasses.withArgs(BAD_ARGS).returns(promise(ERROR_MSG));
    textsMock.removeClasses.returns(promise(GOOD_PATCH_RESPONSE));

    contentMock = {
      importFile: sinon.stub(),
      downloadFile: sinon.stub()
    };

    scope = $rootScope.$new();
    TrainingController = $controller('TrainingController', {
      $scope: scope,
      nlc: nlcMock,
      classes: classesMock,
      texts: textsMock,
      content: contentMock
    });

    var html = '<div id="0"></div><div id="1"></div><div id="2"></div>';
    var elm = angular.element(document.body).append(html);
    $compile(elm)($rootScope);
    $rootScope.$apply();

    // reset the globals as they get modified inside the loadTexts and loadClasses functions
    resetClasses();
    resetTexts();
  }));

  describe('Methods: selecting objects', function () {
    it('should set the attribute \'checked\' to a given boolean for an array of objects', function() {
      expect(scope.classes[0].checked).toBeFalsy();
      expect(scope.classes[1].checked).toBeFalsy();
      expect(scope.classes[2].checked).toBeFalsy();
      expect(scope.classes[3].checked).toBeFalsy();

      scope.checkAll(scope.classes, true);

      expect(scope.classes[0].checked).toBeTruthy();
      expect(scope.classes[1].checked).toBeTruthy();
      expect(scope.classes[2].checked).toBeTruthy();
      expect(scope.classes[3].checked).toBeTruthy();

      scope.checkAll(scope.classes, false);

      expect(scope.classes[0].checked).toBeFalsy();
      expect(scope.classes[1].checked).toBeFalsy();
      expect(scope.classes[2].checked).toBeFalsy();
      expect(scope.classes[3].checked).toBeFalsy();
    });

    it('should return a set of \'checked\' objects from within an array', function() {
      scope.classes[1].checked = true;
      var filteredArray = scope.getChecked(scope.classes);
      expect(filteredArray.length).toBe(1);
      expect(filteredArray[0]).toBe(scope.classes[1]);
    });

    it('should return a set of \'selected\' objects from within an array', function() {
      scope.classes[2].selected = true;
      var filteredArray = scope.getSelectedClasses();
      expect(filteredArray.length).toBe(1);
      expect(filteredArray[0]).toBe(scope.classes[2]);
    });
  });

  describe('Methods searching for objects', function () {
    it('should return an object with a given \'label\' from within an array', function() {
      var obj = scope.getFromLabel(scope.classes, OLD_CLASS_LABEL);
      expect(obj).toBe(scope.classes[0]);

      obj = scope.getFromLabel(scope.classes, NEW_LABEL);
      expect(obj).toBeNull();
    });

    it('should return an object with a given \'id\' from within an array', function() {
      var obj = scope.getFromId(CLASSES, GOOD_ID);
      expect(obj).toBe(CLASSES[0]);

      obj = scope.getFromId(CLASSES, BAD_ID);
      expect(obj).toBeNull();
    });

    it('should return whether or not an object with a given \'label\' exists in an array', function() {
      var obj = scope.containsLabel(scope.classes, OLD_CLASS_LABEL);
      expect(obj).toBeTruthy();

      obj = scope.containsLabel(scope.classes, NEW_LABEL);
      expect(obj).toBeFalsy();
    });
  });

  it('should provide a converter that allows the input of <text/class> string and should return an array of <text/class>\'s', function() {
    var array = [];

    array = scope.getScopeArray(TEXT);
    expect(array).toEqual(scope.texts);

    array = scope.getScopeArray(CLASS);
    expect(array).toEqual(scope.classes);
  });

  describe('Methods to order classes and texts', function () {
    it('should select a class order option', function() {
      scope.setClassOrderOption(ORDER_OPTIONS[1]);
      expect(scope.classOrderOption).toEqual(ORDER_OPTIONS[1]);
    });

    it('should order the classes', function() {
      scope.classOrderOption = ORDER_OPTIONS[0];
      expect(scope.classOrder(scope.classes[0])).toEqual(-scope.classes[0].seq);

      scope.classOrderOption = ORDER_OPTIONS[1];
      expect(scope.classOrder(scope.classes[0])).toEqual(scope.classes[0].seq);

      scope.classOrderOption = ORDER_OPTIONS[2];
      expect(scope.classOrder(scope.classes[0])).toEqual(scope.classes[0].label);

      scope.classOrderOption = ORDER_OPTIONS[3];
      expect(scope.classOrder(scope.classes[0])).toEqual(-scope.numberTextsInClass(scope.classes[0]));

      scope.classOrderOption = ORDER_OPTIONS[4];
      expect(scope.classOrder(scope.classes[0])).toEqual(scope.numberTextsInClass(scope.classes[0]));

      scope.classOrderOption = BAD_ORDER_OPTION;
      expect(scope.classOrder(scope.classes[0])).toEqual(-scope.classes[0].seq);
    });

    it('should select a text order option', function() {
      scope.setTextOrderOption(ORDER_OPTIONS[1]);
      expect(scope.textOrderOption).toEqual(ORDER_OPTIONS[1]);
    });

    it('should order the texts', function() {
      scope.textOrderOption = ORDER_OPTIONS[0];
      expect(scope.textOrder(scope.texts[0])).toEqual(-scope.texts[0].seq);

      scope.textOrderOption = ORDER_OPTIONS[1];
      expect(scope.textOrder(scope.texts[0])).toEqual(scope.texts[0].seq);

      scope.textOrderOption = ORDER_OPTIONS[2];
      expect(scope.textOrder(scope.texts[0])).toEqual(scope.texts[0].label);

      scope.textOrderOption = ORDER_OPTIONS[3];
      expect(scope.textOrder(scope.texts[0])).toEqual(-scope.classesForText(scope.texts[0]).length);

      scope.textOrderOption = ORDER_OPTIONS[4];
      expect(scope.textOrder(scope.texts[0])).toEqual(scope.classesForText(scope.texts[0]).length);

      scope.textOrderOption = BAD_ORDER_OPTION;
      expect(scope.textOrder(scope.texts[0])).toEqual(-scope.texts[0].seq);
    });
  });

  describe('Methods for editing classes and texts', function () {
    it('should set \'selected\' for a given object', function() {
      // select
      scope.selectClass(scope.classes[1]);
      expect(scope.classes[1].selected).toBeTruthy();

      // unselect
      scope.selectClass(scope.classes[1]);
      expect(scope.classes[1].selected).toBeFalsy();
    });

    it('should allow the user to edit a field', function() {
      scope.editField(scope.classes[1]);
      expect(scope.classes[1].edit).toBeTruthy();

      // already in edit mode, so should now dismiss
      scope.editField(scope.classes[1]);
      expect(scope.classes[1].edit).toBeFalsy();
    });

    it('should allow the user to cancel the editing of a field using the ESC key', function () {
      var event = {
        keyCode: 27
      };
      scope.keyUpCancelEditing(scope.classes[2], event);
      expect(scope.classes[2].edit).toBeFalsy();
    });
  });

  describe('Methods for changing class and text labels', function () {
    it('should change a class label', inject(function ($rootScope) {
      var object = scope.classes[0];
      window.document.getElementById(object.$$hashKey).value = NEW_LABEL;
      scope.changeLabel(CLASS, object).then(function success (result) {
        expect(result).toBe(GOOD_UPDATE_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not change a class label if it is the same', inject(function ($rootScope) {
      var object = scope.classes[0];
      window.document.getElementById(object.$$hashKey).value = OLD_CLASS_LABEL;
      scope.changeLabel(CLASS, object).then(function success (result) {
        classesMock.update.should.not.be.called;
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not change a class label if it is empty', inject(function ($rootScope) {
      var object = scope.classes[0];
      window.document.getElementById(object.$$hashKey).value = EMPTY_LABEL;
      scope.changeLabel(CLASS, object).then(function success (result) {
        classesMock.update.should.not.be.called;
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not change a class label if it already exists', inject(function ($rootScope) {
      var object = scope.classes[0];
      window.document.getElementById(object.$$hashKey).value = EXISTING_CLASS_LABEL;
      scope.changeLabel(CLASS, object).then(function success (result) {
        classesMock.update.should.not.be.called;
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should change a text label', inject(function ($rootScope) {
      var object = scope.texts[0];
      window.document.getElementById(object.$$hashKey).value = NEW_LABEL;
      scope.changeLabel(TEXT, object).then(function success (result) {
        expect(result).toBe(GOOD_UPDATE_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not change a text label if it is the same', inject(function ($rootScope) {
      var object = scope.texts[0];
      window.document.getElementById(object.$$hashKey).value = OLD_TEXT_LABEL;
      scope.changeLabel(TEXT, object).then(function success (result) {
        textsMock.update.should.not.be.called;
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not change a text label if it is empty', inject(function ($rootScope) {
      var object = scope.texts[0];
      window.document.getElementById(object.$$hashKey).value = EMPTY_LABEL;
      scope.changeLabel(TEXT, object).then(function success (result) {
        textsMock.update.should.not.be.called;
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not change a text label if it already exists with another text', inject(function ($rootScope) {
      var object = scope.texts[0];
      window.document.getElementById(object.$$hashKey).value = EXISTING_TEXT_LABEL;
      scope.changeLabel(TEXT, object).then(function success (result) {
        textsMock.update.should.not.be.called;
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));
  });

  describe('Methods for counting filtered objects', function () {
    it('should count the number of texts with a given class tagged', function() {
      var count = scope.numberTextsInClass({ label: OLD_CLASS_LABEL });
      expect(count).toBe(2);
    });

    it('should return an array of classes tagged for a given text', function() {
      var classes = scope.classesForText(scope.texts[0]);
      expect(classes).toEqual([SCOPECLASSES[0]]);
    });
  });

  describe('Methods for creating objects', function () {
    it('should not add if the label is empty', inject(function ($rootScope) {
      scope.add(CLASS, EMPTY_LABEL).then(function (result) {
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not add if the class label exists', inject(function ($rootScope) {
      scope.add(CLASS, EXISTING_CLASS_LABEL).then(function (result) {
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should not add if the text label exists', inject(function ($rootScope) {
      scope.add(TEXT, EXISTING_TEXT_LABEL).then(function (result) {
        expect(result).toBeUndefined();
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should add a new class', inject(function ($rootScope) {
      scope.add(CLASS, NEW_LABEL).then(function (result) {
        expect(result).toEqual(GOOD_POST_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should add a new class with a text id', inject(function ($rootScope) {
      scope.add(CLASS, NEW_LABEL, GOOD_ID).then(function (result) {
        expect(result).toEqual(GOOD_POST_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should add a new text', inject(function ($rootScope) {
      scope.add(TEXT, NEW_LABEL).then(function (result) {
        expect(result).toEqual(GOOD_POST_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should add a new text with checked classes', inject(function ($rootScope) {
      scope.classes[0].checked = true;
      scope.add(TEXT, NEW_LABEL).then(function (result) {
        expect(result).toEqual(GOOD_POST_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));
  });

  // TODO: need to add ngDialog mock
  describe('Methods to delete objects', function () {
    it('should delete a class', inject(function ($rootScope) {
      scope.deleteClass(scope.classes[0]).then(function (result) {
        expect(result).toEqual(GOOD_REMOVE_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should delete a class with a long label and no texts', inject(function ($rootScope) {
      scope.deleteClass(scope.classes[3]).then(function (result) {
        expect(result).toEqual(GOOD_REMOVE_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should delete a class', inject(function ($rootScope) {
      scope.deleteText(scope.texts[0]).then(function (result) {
        expect(result).toEqual(GOOD_REMOVE_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));

    it('should delete a class with a long label', inject(function ($rootScope) {
      scope.deleteText(scope.texts[3]).then(function (result) {
        expect(result).toEqual(GOOD_REMOVE_RESPONSE);
      }, function error (err) {
        expect(err).toBeNull();
      });
      $rootScope.$apply();
    }));
  });

  it('should determine whether a given text has been tagged or not', function() {
    expect(scope.isTagged({classes:[]})).toBeFalsy();
    expect(scope.isTagged({classes:['class1', 'class2']})).toBeTruthy();
  });

  it('should toggle \'beingTagged\' attribute of an text', function() {
    scope.texts[1].beingTagged = true;
    scope.beginTaggingText(scope.texts[1]);
    expect(scope.texts[1].beingTagged).toBeFalsy();

    scope.beginTaggingText(scope.texts[0]);
    expect(scope.texts[0].beingTagged).toBeTruthy();
  });

  // it('should be able to tag an text with any number of classes', inject(function ($rootScope) {
  //   scope.tagTexts([scope.texts[0]], [{label: 'newClass'}]).then(function (result) {
  //     expect(result).toBe([GOOD_PATCH_RESPONSE]);
  //   }, function error (err) {
  //     expect(err).toBeNull();
  //   });
  //   $rootScope.$apply();
  // }));
  //
  // it('should be able to tag all checked texts with all checked classes', function() {
  //   expect(scope.texts[0].classes.length).toBe(1);
  //   scope.texts[0].checked = true;
  //   scope.classes[1].checked = true;
  //   scope.tagCheckedTexts();
  //   expect(scope.texts[0].classes.length).toBe(2);
  // });

  // -------------------------------------------------------------------------------------------------
  //
  // --------------------------------------- API/Service functions -----------------------------------
  //
  // -------------------------------------------------------------------------------------------------

  /*it('should be able to call the NLC \'train\' service', function() {
  scope.train();
  });*/

  // it('should be able to call the NLC \'download\' service', function() {
  //   scope.exportToFile();
  //   // TODO: Test the response
  // });

  // the test was failing due to "TypeError: 'undefined' is not a function (evaluating '$browser.cookies()')"
  // got rid of this error by changing version of angular mocks to 1.3.17
  // then found that the $rootScope.$digest() is triggering the authentication service, tried to mock it but failed.

  /*it('should be able to call the NLC \'upload\' service', inject(function($rootScope) {
  var fileContent = 'text,class';
  scope.importFile(fileContent);
  $rootScope.$digest();
  expect(scope.classes[0].label).toEqual(CLASS);
  expect(scope.texts[0].label).toEqual(TEXT);
  expect(scope.texts[0].classes).toEqual([CLASS]);
  }));*/

});
