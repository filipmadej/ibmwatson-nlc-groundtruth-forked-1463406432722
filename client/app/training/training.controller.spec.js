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

describe('Controller: TrainingCtrl', function() {

  // load the controller's module
  beforeEach(module('ibmwatson-nlc-groundtruth-app'));

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  var TrainingCtrl, scope;
  var CLASSES, TEXTS;

  function resetClasses() {
    CLASSES = [{
      label: 'object1',
      edit: false,
      checked: false,
      selected: true,
      $$hashKey: 'ID',
      id: '0',
      seq: '0',
    }, {
      label: 'object2',
      edit: false,
      checked: true,
      selected: false,
      $$hashKey: 'ID',
      id: '1',
      seq: '2'
    }, {
      label: 'object3',
      edit: true,
      checked: false,
      selected: false,
      $$hashKey: 'ID',
      id: '2',
      seq: '1'
    }];
  }

  var OLD_CLASS = 'object1';
  var NEW_CLASS = 'object2';
  var OLD_LABEL = 'object1';
  var NEW_LABEL = 'label';
  var EMPTY_LABEL = '';
  var EXISTING_LABEL = 'object2';
  var BAD_ID = 'bad';
  var BAD_OBJECT = { id: BAD_ID };

  function resetTexts() {
    TEXTS = [{
      label: 'object1',
      $$hashKey: 'ID',
      checked: true,
      beingTagged : false,
      classes: [OLD_CLASS],
      seq: '2',
    }, {
      label: 'object2',
      $$hashKey: 'ID',
      checked: false,
      beingTagged : true,
      classes: [OLD_CLASS, 'object3'],
      seq: '1',
    }, {
      label: 'object3',
      $$hashKey: 'ID',
      checked: false,
      beingTagged : false,
      classes: ['object3'],
      seq: '0'
    }];
  }

  var ORDER_OPTIONS = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Alphabetical', value: 'alpha' },
    { label: 'Most', value: 'most' },
    { label: 'Fewest', value: 'fewest' }
  ];
  var BAD_ORDER_OPTION = { label: 'Bad', value: 'bad' };

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $compile, $rootScope, $q) {
    var nlcMock = {
      train: function() {
      },
      download: function() {
      },
      upload: function() {
        return $q(function(resolve){
          resolve({
            classes: ['class'],
            text: [ {text: 'text', classes: ['class']} ]
          });
        });
      }
    };

    var classesMock = {
      query: function() {
        return $q(function(resolve) {
          resolve();
        });
      },
      post: function() {
        return $q(function(resolve) {
          resolve({ id : '5' });
        });
      },
      remove: function() {
        return $q(function(resolve) {
          resolve();
        });
      },
      update: function(id) {
        return $q(function (resolve, reject) {
          if (id === BAD_ID) {
            reject({ msg: 'err' });
          } else {
            resolve({ id: '5' });
          }
        });
      }
    };

    var textsMock = {
      query: function() {
        return $q(function(resolve) {
          resolve();
        });
      },
      post: function() {
        return $q(function(resolve) {
          resolve({ id : '5' });
        });
      },
      addClasses: function() {
        return $q(function(resolve) {
          resolve();
        });
      },
      removeClasses: function() {
        return $q(function(resolve) {
          resolve();
        });
      },
      remove: function() {
        return $q(function(resolve) {
          resolve();
        });
      },
      update: function(id) {
        return $q(function (resolve, reject) {
          if (id === BAD_ID) {
            reject({ msg: 'err' });
          } else {
            resolve();
          }
        });
      }
    };


    scope = $rootScope.$new();
    TrainingCtrl = $controller('TrainingCtrl', {
      $scope: scope,
      nlc: nlcMock,
      classes: classesMock,
      texts: textsMock
    });

    var html = '<div id="ID"></div>';
    var elm = angular.element(document.body).append(html);
    $compile(elm)($rootScope);
    resetClasses();
    resetTexts();
  }));

  it('should set the attribute \'checked\' to a given boolean for an array of objects', function() {
    expect(CLASSES[0].checked).toBeFalsy();
    expect(CLASSES[1].checked).toBeTruthy();
    expect(CLASSES[2].checked).toBeFalsy();

    scope.checkAll(CLASSES, true);

    expect(CLASSES[0].checked).toBeTruthy();
    expect(CLASSES[1].checked).toBeTruthy();
    expect(CLASSES[2].checked).toBeTruthy();

    scope.checkAll(CLASSES, false);

    expect(CLASSES[0].checked).toBeFalsy();
    expect(CLASSES[1].checked).toBeFalsy();
    expect(CLASSES[2].checked).toBeFalsy();
  });

  it('should return a set of \'checked\' objects from within an array', function() {
    var filteredArray = scope.getChecked(CLASSES);

    expect(filteredArray.length).toBe(1);
    expect(filteredArray[0]).toBe(CLASSES[1]);
  });

  it('should return a set of \'selected\' objects from within an array', function() {
    scope.classes = CLASSES;
    var filteredArray = scope.getSelectedClasses();

    expect(filteredArray.length).toBe(1);
    expect(filteredArray[0]).toBe(CLASSES[0]);
  });

  it('should return an object with a given \'label\' from within an array', function() {
    var obj = scope.getFromLabel(CLASSES, 'object1');
    expect(obj).toBe(CLASSES[0]);

    obj = scope.getFromLabel(CLASSES, 'objectX');
    expect(obj).toBeNull();
  });

  it('should return an object with a given \'id\' from within an array', function() {
    var obj = scope.getFromId(CLASSES, '0');
    expect(obj).toBe(CLASSES[0]);

    obj = scope.getFromId(CLASSES, '3');
    expect(obj).toBeNull();
  });

  it('should return whether or not an object with a given \'label\' exists in an array', function() {
    var obj = scope.containsLabel(CLASSES, 'object1');
    expect(obj).toBeTruthy();

    obj = scope.containsLabel(CLASSES, 'objectX');
    expect(obj).toBeFalsy();
  });

  it('should provide a converter to input a <type> string and get back the consequent list of <type>\'s', function() {
    var array = [];

    scope.texts = TEXTS;
    array = scope.getScopeArray('text');
    expect(array).toEqual(scope.texts);

    scope.classes = CLASSES;
    array = scope.getScopeArray('class');
    expect(array).toEqual(scope.classes);
  });

  it('should select a class order option', function() {
    scope.setClassOrderOption(ORDER_OPTIONS[1]);
    expect(scope.classOrderOption).toEqual(ORDER_OPTIONS[1]);
  });

  it('should order the classes', function() {
    scope.setClassOrderOption(ORDER_OPTIONS[0]);
    expect(scope.classOrder(CLASSES[0])).toEqual(-CLASSES[0].seq);

    scope.setClassOrderOption(ORDER_OPTIONS[1]);
    expect(scope.classOrder(CLASSES[0])).toEqual(CLASSES[0].seq);

    scope.setClassOrderOption(ORDER_OPTIONS[2]);
    expect(scope.classOrder(CLASSES[0])).toEqual(CLASSES[0].label);

    scope.setClassOrderOption(ORDER_OPTIONS[3]);
    expect(scope.classOrder(CLASSES[0])).toEqual(-scope.numberTextsInClass(CLASSES[0]));

    scope.setClassOrderOption(ORDER_OPTIONS[4]);
    expect(scope.classOrder(CLASSES[0])).toEqual(scope.numberTextsInClass(CLASSES[0]));

    scope.setClassOrderOption(BAD_ORDER_OPTION);
    expect(scope.classOrder(CLASSES[0])).toEqual(-CLASSES[0].seq);
  });

  it('should select a text order option', function() {
    scope.setTextOrderOption(ORDER_OPTIONS[1]);
    expect(scope.textOrderOption).toEqual(ORDER_OPTIONS[1]);
  });

  it('should order the texts', function() {
    scope.setTextOrderOption(ORDER_OPTIONS[0]);
    expect(scope.textOrder(TEXTS[0])).toEqual(-TEXTS[0].seq);

    scope.setTextOrderOption(ORDER_OPTIONS[1]);
    expect(scope.textOrder(TEXTS[0])).toEqual(TEXTS[0].seq);

    scope.setTextOrderOption(ORDER_OPTIONS[2]);
    expect(scope.textOrder(TEXTS[0])).toEqual(TEXTS[0].label);

    scope.setTextOrderOption(ORDER_OPTIONS[3]);
    expect(scope.textOrder(TEXTS[0])).toEqual(-scope.classesForText(TEXTS[0]).length);

    scope.setTextOrderOption(ORDER_OPTIONS[4]);
    expect(scope.textOrder(TEXTS[0])).toEqual(scope.classesForText(TEXTS[0]).length);

    scope.setTextOrderOption(BAD_ORDER_OPTION);
    expect(scope.textOrder(TEXTS[0])).toEqual(-TEXTS[0].seq);
  });

  it('should set \'selected\' for a given object if not in edit mode', function() {
    scope.selectClass(CLASSES[2]);
    expect(CLASSES[2].selected).toBeFalsy();

    scope.selectClass(CLASSES[1]);
    expect(CLASSES[1].selected).toBeTruthy();
  });

  it('should allow the user to edit a field', function() {
    scope.editField(CLASSES[1]);
    expect(CLASSES[1].edit).toBeTruthy();

    // already in edit mode, so should now dismiss
    scope.editField(CLASSES[1]);
    expect(CLASSES[1].edit).toBeFalsy();
    expect(angular.element('#ID')[0].value).toBe(CLASSES[1].label);
  });

  it('should allow the user to edit a field', function() {
    var event = {
      keyCode: 27
    };
    scope.keyUpCancelEditing(CLASSES[2], event);
    expect(CLASSES[2].edit).toBeFalsy();
    expect(angular.element('#ID')[0].value).toBe(CLASSES[2].label);
  });

  it('should change a class label', function() {
    var object = CLASSES[0];
    window.document.getElementById(object.$$hashKey).value = NEW_LABEL;
    scope.changeLabel('class', object);
    expect(object.label).toEqual(NEW_LABEL);
  });

  it('should not change a class label if it is the same or empty or already exists', function() {
    scope.classes = CLASSES;
    var object = CLASSES[0];

    // same label
    window.document.getElementById(object.$$hashKey).value = OLD_LABEL;
    scope.changeLabel('class', object);
    expect(object.label).toEqual(OLD_LABEL);

    // empty label
    window.document.getElementById(object.$$hashKey).value = EMPTY_LABEL;
    scope.changeLabel('class', object);
    expect(object.label).toEqual(OLD_LABEL);

    // existing label
    window.document.getElementById(object.$$hashKey).value = EXISTING_LABEL;
    scope.changeLabel('class', object);
    expect(object.label).toEqual(OLD_LABEL);
  });

  it('should change a text label', function() {
    var object = TEXTS[0];
    window.document.getElementById(object.$$hashKey).value = NEW_LABEL;
    scope.changeLabel('text', object);
    expect(object.label).toEqual(NEW_LABEL);
  });

  it('should not change a text label if it is the same or empty or already exists', function() {
    scope.texts = TEXTS;
    var object = TEXTS[0];

    // same label
    window.document.getElementById(object.$$hashKey).value = OLD_LABEL;
    scope.changeLabel('text', object);
    expect(object.label).toEqual(OLD_LABEL);

    // empty label
    window.document.getElementById(object.$$hashKey).value = EMPTY_LABEL;
    scope.changeLabel('text', object);
    expect(object.label).toEqual(OLD_LABEL);

    // existing label
    window.document.getElementById(object.$$hashKey).value = EXISTING_LABEL;
    scope.changeLabel('text', object);
    expect(object.label).toEqual(OLD_LABEL);
  });

  it('should propogate a new class name to all texts', function() {
    scope.classes = CLASSES;
    scope.texts = TEXTS;
    scope.classLabelChanged(CLASSES[0], OLD_CLASS, NEW_CLASS);

    expect(scope.texts[0].classes[0]).toBe(NEW_CLASS);
    expect(scope.texts[1].classes[0]).toBe(NEW_CLASS);
    expect(scope.texts[2].classes[0]).toBe('object3');
  });

  // TODO: something wrong with service mocks.
  // it('should throw an error on a bad input to change class label', function() {
  //   var success = true;
  //   scope.classLabelChanged(BAD_OBJECT, EMPTY_LABEL, EMPTY_LABEL).then(function () {
  //     success = true;
  //   }, function error () {
  //     success = false;
  //   });
  //   expect(success).toBeFalsy();
  // });
  //
  // it('should throw an error on a bad input to change text label', function() {
  //   var success = true;
  //   scope.textLabelChanged(BAD_OBJECT, EMPTY_LABEL, EMPTY_LABEL).then(function () {
  //     success = true;
  //   }, function error () {
  //     success = false;
  //   });
  //   expect(success).toBeFalsy();
  // });

  it('should count the number of texts with a given class tagged', function() {
    scope.texts = TEXTS;
    var count = scope.numberTextsInClass({ label: OLD_CLASS });
    expect(count).toBe(2);
  });

  it('should return an array of classes tagged for a given text', function() {
    scope.texts = TEXTS;
    scope.classes = CLASSES;
    var classes = scope.classesForText(TEXTS[0]);
    expect(classes).toEqual([CLASSES[0]]);
  });

  // TODO: fix mock. promise not being returned properly.
  // it('should add a new class', function() {
  //   scope.add('class', OLD_LABEL).then(function () {
  //     expect(scope.classes[0].label).toEqual(OLD_LABEL);
  //   }, function error (err) {
  //     expect(err).toBeNull();
  //   });
  // });

  it('should set \'selected\' to false for a given object', function() {
    scope.removeClassFromView(CLASSES[2]);
    expect(CLASSES[2].selected).toBeFalsy();

    scope.removeClassFromView(CLASSES[1]);
    expect(CLASSES[1].selected).toBeFalsy();
  });

  // TODO: Finish tests
  /*it('should be able to delete a list of texts from $scope.texts', function() {
  scope.texts = TEXTS;
  var deletedObj = TEXTS.splice(2);
  console.log(deletedObj);
  scope.deleteTexts([deletedObj]);
  console.log(scope.texts);
  expect(scope.texts).toEqual(TEXTS[0], TEXTS[1]);
});*/



// -------------------------------------------------------------------------------------------------
//
// --------------------- tagging (associating text with class or classes) ---------------------
//
// -------------------------------------------------------------------------------------------------

it('should determine whether a given text has been tagged or not', function() {
  expect(scope.isTagged({classes:[]})).toBeFalsy();
  expect(scope.isTagged({classes:['class1', 'class2']})).toBeTruthy();
});

it('should toggle \'beingTagged\' attribute of an text', function() {
  scope.beginTaggingText(TEXTS[1]);
  expect(TEXTS[1].beingTagged).toBeFalsy();

  scope.beginTaggingText(TEXTS[0]);
  expect(TEXTS[0].beingTagged).toBeTruthy();
});

it('should be able to tag an text with any number of classes', function() {
  scope.tagTexts(TEXTS, [{label: 'newClass'}]);

  TEXTS.forEach(function(d) {
    expect(d.classes[d.classes.length - 1]).toBe('newClass');
  });
});

it('should be able to tag all checked texts with all checked classes', function() {
  scope.texts = TEXTS;
  scope.classes = CLASSES;

  expect(TEXTS[0].classes.length).toBe(1);
  scope.tagCheckedTexts();
  expect(TEXTS[0].classes.length).toBe(2);
});

// -------------------------------------------------------------------------------------------------
//
// --------------------------------------- API/Service functions -----------------------------------
//
// -------------------------------------------------------------------------------------------------

/*it('should be able to call the NLC \'train\' service', function() {
scope.train();
});*/

it('should be able to call the NLC \'download\' service', function() {
  scope.exportToFile();
  // TODO: Test the response
});

// the test was failing due to "TypeError: 'undefined' is not a function (evaluating '$browser.cookies()')"
// got rid of this error by changing version of angular mocks to 1.3.17
// then found that the $rootScope.$digest() is triggering the authentication service, tried to mock it but failed.

/*it('should be able to call the NLC \'upload\' service', inject(function($rootScope) {
var fileContent = 'text,class';
scope.importFile(fileContent);
$rootScope.$digest();
expect(scope.classes[0].label).toEqual('class');
expect(scope.texts[0].label).toEqual('text');
expect(scope.texts[0].classes).toEqual(['class']);
}));*/

});
