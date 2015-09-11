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
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// core dependencies
var util = require('util');
// external dependencies
var chai = require('chai');
var httpstatus = require('http-status');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var responses = require('./responses');

var should = chai.should();
chai.use(sinonChai);

describe('/server/components/restutils/responses', function () {


  beforeEach( function () {
    this.id = 'abc123';
    this.rev = '1-1';

    this.res = {
      status : sinon.stub(),
      contentType : sinon.stub(),
      header : sinon.stub(),
      json : sinon.spy(),
      send : sinon.spy()
    }

    this.res.status.returns(this.res);
    this.res.contentType.returns(this.res);
    this.res.header.returns(this.res);
  });

  function verifyImplementationDetailsHiddenOnItem (item, expectedid) {
    item.should.not.have.property('_id');
    item.should.not.have.property('_rev');
    item.should.not.have.property('_tenant');
    item.should.not.have.property('schema');
    item.id.should.equal(expectedid);
  }

  function verifyImplementationDetailsHiddenOnResponse (expectedid) {
    var responseBody = this.res.json.lastCall.args[0];
    should.exist(responseBody);

    if (util.isArray(responseBody)) {
      responseBody.forEach(function verifyItemInArray (item) {
        verifyImplementationDetailsHiddenOnItem(item, expectedid);
      });
    } else {
      verifyImplementationDetailsHiddenOnItem(responseBody, expectedid);
    }


  }

  describe('#item()', function () {

    function verifyInvocation () {
      this.res.status.should.have.been.calledWith(httpstatus.OK);
      this.res.header.should.have.been.calledWith('ETag', sinon.match.string);
      this.res.json.should.have.been.calledWith(sinon.match.object);
    }

    it('should hide backend impl details', function () {

      var object = {
        _id : this.id,
        _rev : this.rev,
        tenant : 'TEST',
        schema : 'example',
        foo : 'bar'
      };

      responses.item(object, this.res);

      verifyInvocation.call(this);
      verifyImplementationDetailsHiddenOnResponse.call(this, this.id, this.rev);

      this.res.header.should.have.been.calledWith('ETag', this.rev);

      var responseBody = this.res.json.lastCall.args[0];
      responseBody.should.have.property('foo', object.foo);
    });

    it('should leave id property alone', function () {

      var object = {
        id : this.id,
        _rev : this.rev
      };

      responses.item(object, this.res);

      verifyInvocation.call(this);
      verifyImplementationDetailsHiddenOnResponse.call(this, this.id, this.rev);

      this.res.header.should.have.been.calledWith('ETag', this.rev);

      var responseBody = this.res.json.lastCall.args[0];
      should.exist(responseBody);
      responseBody.should.have.property('id', object.id);
    });

  });

  describe('#newitem()', function () {

    function verifyInvocation () {
      this.res.status.should.have.been.calledWith(httpstatus.CREATED);
      this.res.header.should.have.been.calledWith('ETag', this.rev);
      this.res.header.should.have.been.calledWith('Location', sinon.match.string);
      this.res.json.should.have.been.calledWith(sinon.match.object);
    }

    it( 'should add location header and write object to response', function () {
      var locationtemplate = '/api/v1/:tenantid/examples/:exampleid';
      var locationids = { ':tenantid' : 'TEST', ':exampleid' : this.id };
      var object = {
        _id : this.id,
        _rev : this.rev,
        foo : 'bar'
      };

      responses.newitem(object, locationtemplate, locationids, this.res);

      verifyInvocation.call(this);
      verifyImplementationDetailsHiddenOnResponse.call(this, this.id, this.rev);

      this.res.header.should.have.been.calledWith('Location', '/api/v1/TEST/examples/' + this.id);

      var responseBody = this.res.json.lastCall.args[0];
      responseBody.should.have.property('foo', object.foo);
    });

  });

  describe('#list()', function () {

    function verifyInvocation () {
      this.res.status.should.have.been.calledWith(httpstatus.OK);
      this.res.json.should.have.been.calledWith(sinon.match.array);
    }


    it('should write objects to response', function () {

      var object = {
        _id : this.id,
        _rev : this.rev,
        foo : 'bar'
      };

      responses.list([object, object], this.res);

      verifyInvocation.call(this);
      verifyImplementationDetailsHiddenOnResponse.call(this, this.id, this.rev);
    });

  });

  describe('#batch()', function () {

    function verifyInvocation () {
      this.res.status.should.have.been.calledWith(httpstatus.OK);
      this.res.json.should.have.been.calledWith(sinon.match.array);
    }


    it('should write objects to response with paging info in content-range', function () {

      var object = {
        _id : this.id,
        _rev : this.rev,
        foo : 'bar'
      };

      responses.batch([object, object], 0, 2, this.res);

      verifyInvocation.call(this);
      verifyImplementationDetailsHiddenOnResponse.call(this, this.id, this.rev);

      this.res.header.should.have.been.calledWith('Content-Range', 'items 0-1/2');
    });

  });

  describe('#accepted()', function () {

    it('should provide location header on Accepted response', function () {

      var locationtemplate = 'http://test.com/:id';
      var locationids = { ':id' : 1 };

      responses.accepted(locationtemplate, locationids, this.res);

      this.res.status.should.have.been.calledWith(httpstatus.ACCEPTED);
      this.res.header.should.have.been.calledWith('Location', 'http://test.com/1');
    });

    it('should handle empty ids object', function () {

      var locationtemplate = 'http://test.com';

      responses.accepted(locationtemplate, {}, this.res);

      this.res.status.should.have.been.calledWith(httpstatus.ACCEPTED);
      this.res.header.should.have.been.calledWith('Location', locationtemplate);
    });

  });

  describe('#del()', function () {

    it('should not return content', function () {

      responses.del(this.res);

      this.res.status.should.have.been.calledWith(httpstatus.NO_CONTENT);
      this.res.send.should.have.been.called;
      should.not.exist(this.res.send.lastCall.args[0]);
    });
  });

  describe('#edited()', function () {

    it('should write object to response with etag header', function () {
      var object = {
        _id : this.id,
        _rev : this.rev,
        foo : 'bar'
      };

      responses.edited(this.res, object);

      this.res.status.should.have.been.calledWith(httpstatus.OK);
      this.res.header.should.have.been.calledWith('ETag', this.rev);
      this.res.json.should.have.been.calledWith(sinon.match.object);

      verifyImplementationDetailsHiddenOnResponse.call(this, this.id, this.rev);
    });

    it('should not return content on empty object', function () {

      responses.edited(this.res);

      this.res.status.should.have.been.calledWith(httpstatus.NO_CONTENT);
      this.res.send.should.have.been.called;
      should.not.exist(this.res.send.lastCall.args[0]);
    });
  });

  function verifyNotFound () {
    this.res.status.should.have.been.calledWith(httpstatus.NOT_FOUND);
    this.res.json.should.have.been.called;

    var responseBody = this.res.json.lastCall.args[0];
    should.exist(responseBody);
    responseBody.should.have.property('error', 'Not found');
  }

  describe('#notfound()', function () {

    it('should provide explanation of error in body', function () {

      responses.notfound(this.res);

      verifyNotFound.call(this);
    });

  });

  describe('#ok()', function () {

    it('should send 200 status with no body', function () {

      responses.ok(this.res);

      this.res.status.should.have.been.calledWith(httpstatus.OK);
      this.res.send.should.have.been.called;

      var responseBody = this.res.send.lastCall.args[0];
      should.not.exist(responseBody);
    });

  });

  describe('#missingEtag()', function () {
    it('should provide explanation of error in body', function () {

      responses.missingEtag(this.res);

      this.res.status.should.have.been.calledWith(httpstatus.PRECONDITION_FAILED);
      this.res.json.should.have.been.called;

      var responseBody = this.res.json.lastCall.args[0];
      should.exist(responseBody);
      responseBody.should.have.property('error', 'Missing If-Match header');
    });
  });

  function verifyBadEtag () {
    this.res.status.should.have.been.calledWith(httpstatus.PRECONDITION_FAILED);
    this.res.json.should.have.been.called;

    var responseBody = this.res.json.lastCall.args[0];
    should.exist(responseBody);
    responseBody.should.have.property('error', 'Incorrect If-Match header');
  }

  describe('#badEtag()', function () {
    it('should provide explanation of error in body', function () {

      responses.badEtag(this.res);

      verifyBadEtag.call(this);
    });
  });

  describe('#badRequest()', function () {
    it('should provide explanation of error in body', function () {
      var description = 'Example explanation';

      responses.badrequest(description, this.res);

      this.res.status.should.have.been.calledWith(httpstatus.BAD_REQUEST);
      this.res.json.should.have.been.called;

      var responseBody = this.res.json.lastCall.args[0];
      should.exist(responseBody);
      responseBody.should.have.property('error', description);
    });
  });

  function verifyInsufficientPrivileges (expectedMessage) {
    this.res.status.should.have.been.calledWith(httpstatus.FORBIDDEN);
    this.res.json.should.have.been.called;

    var responseBody = this.res.json.lastCall.args[0];
    should.exist(responseBody);
    responseBody.should.have.property('error', expectedMessage);
  }

  describe('#insufficientPrivileges()', function () {

    it('should provide default message of error in body', function () {
      var message = 'Example message';

      responses.insufficientPrivileges(this.res);

      verifyInsufficientPrivileges.call(this, 'Insufficient privileges');
    });

    it('should provide custom message of error in body', function () {
      var message = 'Example message';

      responses.insufficientPrivileges(this.res, message);

      verifyInsufficientPrivileges.call(this, message);
    });

  });

  describe('#error()', function () {

    it('should return not found when 404 status on error', function () {
      var error = {
        statusCode : httpstatus.NOT_FOUND
      };

      responses.error(this.res, error);

      verifyNotFound.call(this);
    });

    it('should return bad etag when 409 status on error', function () {
      var error = {
        statusCode : httpstatus.CONFLICT
      };

      responses.error(this.res, error);

      verifyBadEtag.call(this);
    });

    it('should return forbidden when 403 status on error', function () {
      var error = {
        statusCode : httpstatus.FORBIDDEN
      };

      responses.error(this.res, error);

      verifyInsufficientPrivileges.call(this, 'Insufficient privileges');
    });

    it('should handle special case around forbidden 403 and CSRF tokens', function () {
      var error = {
        statusCode : httpstatus.FORBIDDEN,
        code : 'EBADCSRFTOKEN'
      };

      responses.error(this.res, error);

      verifyInsufficientPrivileges.call(this, 'Invalid CSRF Token');
    });

    var verifyError = function (expectedStatusCode, expectedMessage) {
      this.res.status.should.have.been.calledWith(expectedStatusCode);
      this.res.json.should.have.been.called;

      var responseBody = this.res.json.lastCall.args[0];
      should.exist(responseBody);
      responseBody.should.have.property('error', expectedMessage);
    };

    it('should return status code from error along with error property', function () {
      var statusCode = httpstatus. UNSUPPORTED_MEDIA_TYPE;
      var msg = 'It broke';
      var error = {
        statusCode : statusCode,
        error : msg
      };

      responses.error(this.res, error);

      verifyError.call(this, statusCode, msg);

    });

    it('should return status code from error along with message property', function () {
      var statusCode = httpstatus. UNSUPPORTED_MEDIA_TYPE;
      var msg = 'It broke';
      var error = {
        statusCode : statusCode,
        message : msg
      };

      responses.error(this.res, error);

      verifyError.call(this, statusCode, msg);
    });

    it('should return 500 status code when unable to determine existing', function () {
      var statusCode = httpstatus.INTERNAL_SERVER_ERROR;
      var msg = 'It broke';
      var error = {
        message : msg
      };

      responses.error(this.res, error);

      verifyError.call(this, statusCode, msg);
    });

  });
});
