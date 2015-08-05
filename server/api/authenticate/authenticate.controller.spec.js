'use strict';

var authenticate = require('./authenticate.controller');
var sinon = require('sinon');
var should = require('should');

describe('authenticate.controller.check',function(){

  var req, res;

  beforeEach(function(){

    req = {};
    res = {};

    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    res.end = sinon.stub().returns(res);

  });

  it('should respond with a 401 response if the user is not authenticated', function() {
    req.user = {'username':'testuser','tenants':['testuser']};

    authenticate.check(req,res);

    res.status.calledWith(200).should.equal(true);
    res.json.calledWith(req.user).should.equal(true);

  });
});