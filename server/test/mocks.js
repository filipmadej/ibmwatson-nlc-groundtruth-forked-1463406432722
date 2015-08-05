'use strict';
/*eslint func-names: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var should = chai.should();

function getStoreMock () {
    var storeMock = {
        start : sinon.stub(),
        stop : sinon.spy(),
        createClass : sinon.stub(),
        replaceClass : sinon.stub(),
        deleteClass : sinon.stub(),
        getClasses : sinon.stub(),
        countClasses : sinon.stub(),
        getClass : sinon.stub(),
        updateClassMetadata : sinon.stub(),
        createText : sinon.stub(),
        addClassesToText : sinon.stub(),
        removeClassesFromText : sinon.stub(),
        updateTextMetadata : sinon.stub(),
        deleteText : sinon.stub(),
        getTexts : sinon.stub(),
        countTexts : sinon.stub(),
        getText : sinon.stub(),
        deleteTenant : sinon.stub(),
        createProfile : sinon.stub(),
        getProfile : sinon.stub(),
        deleteProfile : sinon.stub(),
        getProfileByUsername : sinon.stub(),
        '@noCallThru' : true
    }

    storeMock.start.callsArg(0);

    return storeMock;
}



module.exports.storeMock = getStoreMock();
