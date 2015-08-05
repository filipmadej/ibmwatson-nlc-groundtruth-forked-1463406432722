'use strict';

describe('Controller: ClustersListCtrl', function() {

    // load the controller's module
    beforeEach(module('ibmwatson-nlc-groundtruth-app'));

    var ClustersListCtrl, scope;
    var CLASSES, UTTERANCES;

    function resetClasses() {
        CLASSES = [{
            label: 'object1',
            edit: false,
            checked: false,
            selected: true,
            $$hashKey: 'ID',
            id: '0'
        }, {
            label: 'object2',
            edit: false,
            checked: true,
            selected: false,
            $$hashKey: 'ID',
            id: '1'
        }, {
            label: 'object3',
            edit: true,
            checked: false,
            selected: false,
            $$hashKey: 'ID',
            id: '2'
        }];
    }

    var OLD_CLASS = 'object1';
    var NEW_CLASS = 'object2';

    function resetUtterances() {
        UTTERANCES = [{
            $$hashKey: 'ID',
            checked: true,
            beingTagged : false,
            classes: [OLD_CLASS]
        }, {
            $$hashKey: 'ID',
            checked: false,
            beingTagged : true,
            classes: [OLD_CLASS, 'object3']
        }, {
            $$hashKey: 'ID',
            checked: false,
            beingTagged : false,
            classes: ['object3']
        }];
    }


    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $compile, $rootScope, $q) {
        var nlcMock = {
            train: function() {
                console.log('train');
            },
            download: function() {
                console.log('download');
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
            post: function(params, callback) {
                callback(null, { id : '5' });
            },
            remove: function() {
                return $q(function(resolve) {
                    resolve();
                });
            },
            update: function() {
                return $q(function(resolve) {
                    resolve();
                });
            }
        };

        var textsMock = {
            query: function() {
                return $q(function(resolve) {
                    resolve();
                });
            },
            post: function(params, callback) {
                callback(null, { id : '5' });
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
            update: function() {
                return $q(function(resolve) {
                    resolve();
                });
            }
        };


        scope = $rootScope.$new();
        ClustersListCtrl = $controller('ClustersListCtrl', {
            $scope: scope,
            nlc: nlcMock,
            classes: classesMock,
            texts: textsMock
        });

        var html = '<div id="ID"></div>';
        var elm = angular.element(document.body).append(html);
        $compile(elm)($rootScope);
        resetClasses();
        resetUtterances();
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
        var filteredArray = scope.getSelected();

        expect(filteredArray.length).toBe(1);
        expect(filteredArray[0]).toBe(CLASSES[0]);
    });

    it('should set \'selected\' for a given object if not in edit mode', function() {
        scope.selectClass(CLASSES[2]);
        expect(CLASSES[2].selected).toBeFalsy();

        scope.selectClass(CLASSES[1]);
        expect(CLASSES[1].selected).toBeTruthy();
    });

    it('should set \'selected\' to false for a given object', function() {
        scope.removeClassFromView(CLASSES[2]);
        expect(CLASSES[2].selected).toBeFalsy();

        scope.removeClassFromView(CLASSES[1]);
        expect(CLASSES[1].selected).toBeFalsy();
    });

    it('should return a an object with a given \'label\' from within an array', function() {
        var obj = scope.getFromLabel(CLASSES, 'object1');
        expect(obj).toBe(CLASSES[0]);

        obj = scope.getFromLabel(CLASSES, 'objectX');
        expect(obj).toBeNull();
    });

    it('should be able to toggle the \'Enter New Class\' field', function() {
        // should be hidden by default
        expect(scope.classTextFieldVisible).toBeFalsy();
        scope.toggleClassTextField();
        expect(scope.classTextFieldVisible).toBeTruthy();
    });

    it('should be able to toggle the \'Enter New Text\' field', function() {
        // should be hidden by default
        expect(scope.utteranceTextFieldVisible).toBeFalsy();
        scope.toggleUtteranceTextField();
        expect(scope.utteranceTextFieldVisible).toBeTruthy();
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

    it('should propogate a new class name to all utterances', function() {

        scope.utterances = UTTERANCES;

        scope.classLabelChanged(CLASSES[0], OLD_CLASS, NEW_CLASS);

        expect(scope.utterances[0].classes[0]).toBe(NEW_CLASS);
        expect(scope.utterances[1].classes[0]).toBe(NEW_CLASS);
        expect(scope.utterances[2].classes[0]).toBe('object3');
    });

    it('should count the number of utterances with a given class tagged', function() {
        scope.utterances = UTTERANCES;

        var count = scope.numberUtterancesInClass({
            label: OLD_CLASS
        });

        expect(count).toBe(2);
    });

    it('should return an array of classes tagged for a given utterance', function() {
        scope.utterances = UTTERANCES;
        scope.classes = CLASSES;
        var classes = scope.classesForUtterance(UTTERANCES[0]);

        expect(classes).toEqual([CLASSES[0]]);
    });

    it('should provide a converter to input a <type> string and get back the consequent list of <type>\'s', function() {
        var array = [];

        scope.utterances = UTTERANCES;
        array = scope.getScopeArray('utterance');
        expect(array).toEqual(scope.utterances);

        scope.classes = CLASSES;
        array = scope.getScopeArray('class');
        expect(array).toEqual(scope.classes);
    });

    // TODO: Finish tests
    /*it('should be able to delete a list of utterances from $scope.utterances', function() {
        scope.utterances = UTTERANCES;
        var deletedObj = UTTERANCES.splice(2);
        console.log(deletedObj);
        scope.deleteUtterances([deletedObj]);
        console.log(scope.utterances);
        expect(scope.utterances).toEqual(UTTERANCES[0], UTTERANCES[1]);
    });*/



    // -------------------------------------------------------------------------------------------------
    //
    // --------------------- tagging (associating utterance with class or classes) ---------------------
    //
    // -------------------------------------------------------------------------------------------------

    it('should determine whether a given utterance has been tagged or not', function() {
        expect(scope.isTagged({classes:[]})).toBeFalsy();
        expect(scope.isTagged({classes:['class1', 'class2']})).toBeTruthy();
    });

    it('should toggle \'beingTagged\' attribute of an utterance', function() {
        scope.beginTaggingUtterance(UTTERANCES[1]);
        expect(UTTERANCES[1].beingTagged).toBeFalsy();

        scope.beginTaggingUtterance(UTTERANCES[0]);
        expect(UTTERANCES[0].beingTagged).toBeTruthy();
    });

    it('should be able to tag an utterance with any number of classes', function() {
        scope.tagUtterances(UTTERANCES, [{label: 'newClass'}]);

        UTTERANCES.forEach(function(d) {
            expect(d.classes[d.classes.length - 1]).toBe('newClass');
        });
    });

    it('should be able to tag all checked utterances with all checked classes', function() {
        scope.utterances = UTTERANCES;
        scope.classes = CLASSES;

        expect(UTTERANCES[0].classes.length).toBe(1);
        scope.tagCheckedUtterances();
        expect(UTTERANCES[0].classes.length).toBe(2);
    });

    // -------------------------------------------------------------------------------------------------
    //
    // ----------------------------------------- General functions -------------------------------------
    //
    // -------------------------------------------------------------------------------------------------

    it('should return a elements that do not match a given string', function() {
        var array =['class1', 'class2', 'class3'];
        var filteredArray = array.filter(scope.doesNotMatch('class1'));
        expect(filteredArray.length).toBe(2);
        expect(filteredArray[0]).toBe(array[1]);
        expect(filteredArray[1]).toBe(array[2]);
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

    it('should be able to call the NLC \'upload\' service', inject(function($rootScope) {
        var fileContent = 'text,class';
        scope.importFile(fileContent);
        $rootScope.$digest();
        expect(scope.classes[0].label).toEqual('class');
        expect(scope.utterances[0].label).toEqual('text');
        expect(scope.utterances[0].classes).toEqual(['class']);
    }));

});
