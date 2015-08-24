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
/*eslint func-names: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

function LogMock () {

  this.error = sinon.spy();
  this.warn = sinon.spy();
  this.info = sinon.spy();
  this.debug = sinon.spy();
  this['@noCallThru'] = true;

  this.reset = function () {
    this.error.reset();
    this.warn.reset();
    this.info.reset();
    this.debug.reset();
  };
}

function DBMock () {

  this.view = sinon.stub();
  this.list = sinon.stub();
  this['@noCallThru'] = true;

  this.reset = function () {
    this.view.reset();
    this.view.callsArgWith(3, null, {'total_rows' : 0, offset : 0, rows : []});
    this.list.reset();
    this.list.callsArgWith(1, null, {'total_rows' : 0, offset : 0, rows : []});
  };

  this.reset();
}

function StoreMock () {

  this.start = sinon.stub();
  this.stop = sinon.spy();
  this.createClass = sinon.stub();
  this.replaceClass = sinon.stub();
  this.deleteClass = sinon.stub();
  this.getClasses = sinon.stub();
  this.countClasses = sinon.stub();
  this.getClass = sinon.stub();
  this.createText = sinon.stub();
  this.addClassesToText = sinon.stub();
  this.removeClassesFromText = sinon.stub();
  this.updateTextMetadata = sinon.stub();
  this.deleteText = sinon.stub();
  this.getTexts = sinon.stub();
  this.countTexts = sinon.stub();
  this.getText = sinon.stub();
  this.deleteTenant = sinon.stub();
  this['@noCallThru'] = true;

  this.reset = function () {
    this.start.reset();
    this.start.callsArg(0);
    this.stop.reset();
    this.createClass.reset();
    this.createClass.callsArgWith(2, null, {_id : uuid.v1(), _rev : uuid.v1()});
    this.replaceClass.reset();
    this.replaceClass.callsArgWith(3, null, {});
    this.deleteClass.reset();
    this.deleteClass.callsArgWith(3, null, {});
    this.getClasses.reset();
    this.getClasses.callsArgWith(2, null, []);
    this.countClasses.reset();
    this.countClasses.callsArgWith(1, null, 0);
    this.getClass.reset();
    this.getClass.callsArgWith(2, null, {});
    this.createText.reset();
    this.createText.callsArgWith(2, null, {_id : uuid.v1(), _rev : uuid.v1()});
    this.addClassesToText.reset();
    this.addClassesToText.callsArgWith(3, null, {});
    this.removeClassesFromText.reset();
    this.removeClassesFromText.callsArgWith(3, null, {});
    this.updateTextMetadata.reset();
    this.updateTextMetadata.callsArgWith(3, null, {});
    this.deleteText.reset();
    this.deleteText.callsArgWith(3, null, {});
    this.getTexts.reset();
    this.getTexts.callsArgWith(2, null, []);
    this.countTexts.reset();
    this.countTexts.callsArgWith(1, null, 0);
    this.getText.reset();
    this.getText.callsArgWith(2, null, {});
    this.deleteTenant.reset();
    this.deleteTenant.callsArgWith(2, null, {});
  };

  this.reset();
}

function HttpMock () {

  this.createServer = sinon.stub();
  this['@noCallThru'] = true;

  this.serverMock = {
    listen : sinon.stub()
  };

  this.serverMock.listen.callsArg(2);

  this.createServer.returns(this.serverMock);

}

// Additional complexity is due to the fact this
// dependency is > 1 level deep from app.js
// and as such it only gets loaded once when
// the test first runs
function NLCMock () {

  this.create = sinon.stub();
  this.classify = sinon.stub();
  this.status = sinon.stub();
  this.list = sinon.stub();
  this.remove = sinon.stub();

  this.reset = function () {
    this.create.reset();
    this.create.callsArgWith(1, null, {});
    this.classify.reset();
    this.classify.callsArgWith(1, null, {});
    this.status.reset();
    this.status.callsArgWith(1, null, {});
    this.list.reset();
    this.list.callsArgWith(1, null, {});
    this.remove.reset();
    this.remove.callsArgWith(1, null, {});
  };

  this.reset();

}

function WDCMock () {

  this.nlcMock = new NLCMock();

  this.natural_language_classifier = sinon.stub();
  this['@global'] = true;

  this.natural_language_classifier.returns(this.nlcMock);
}

module.exports.LogMock = LogMock;

module.exports.DBMock = DBMock;

module.exports.StoreMock = StoreMock;

module.exports.HttpMock = HttpMock;

module.exports.WDCMock = WDCMock;
