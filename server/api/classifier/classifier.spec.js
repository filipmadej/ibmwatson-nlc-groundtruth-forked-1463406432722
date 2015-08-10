'use strict';
/*eslint func-names: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// core dependencies
var util = require('util');

// external dependencies
var async = require('async');
var chai = require('chai');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire');
var request = require('supertest');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var should = chai.should();
chai.use(sinonChai);

// local dependencies
var nlccreds = require('../../config/nlc');

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

var wdcMock = new mocks.WDCMock();
var nlcMock = wdcMock.nlcMock;

var app = proxyquire('../../app', {
  './config/db/store' : new mocks.StoreMock(),
  'watson-developer-cloud' : wdcMock
});

describe('/server/api/classifier', function () {

  var classifierId = 'nlc-test';

  var error = {
    error : 'test-generated',
    code : 400
  };

  this.timeout(5000);

  before(function (done) {
    request(app)
      .post('/api/authenticate')
      .send({username : nlccreds.username, password : nlccreds.password})
      .expect(httpstatus.OK)
      .end(function (err, res) {
      this.sessionCookie = res.headers['set-cookie'][0];
      done(err);
    }.bind(this));
  });

  beforeEach(function () {
    nlcMock.reset();
  });

  describe('GET /api/classifier/list', function () {

    it('should return a 200 response', function (done) {
      request(app)
        .get('/api/classifier/list')
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.list.should.have.been.calledOnce;
          nlcMock.list.should.have.been.calledWith(null, sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.list.callsArgWith(1, error);
      request(app)
        .get('/api/classifier/list')
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.list.should.have.been.calledOnce;
          nlcMock.list.should.have.been.calledWith(null, sinon.match.func);
          done(err);
        });
    });

  });

  describe('POST /api/classifier/train', function () {

    var data = {
      language : 'en',
      name : 'test',
      training_data : []
    };

    it('should return a 200 response', function (done) {
      request(app)
        .post('/api/classifier/train')
        .set('Cookie', [this.sessionCookie])
        .send(data)
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.create.should.have.been.calledOnce;
          nlcMock.create.should.have.been.calledWith(sinon.match(data), sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.create.callsArgWith(1, error);
      request(app)
        .post('/api/classifier/train')
        .set('Cookie', [this.sessionCookie])
        .send(data)
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.create.should.have.been.calledOnce;
          nlcMock.create.should.have.been.calledWith(sinon.match(data), sinon.match.func);
          done(err);
        });
    });

  });

  describe('GET /api/classifier/:id/status', function () {

    it('should return a 200 response', function (done) {
      request(app)
        .get('/api/classifier/' + classifierId + '/status')
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.status.should.have.been.calledOnce;
          nlcMock.status.should.have.been.calledWith(sinon.match({classifier : classifierId}), sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.status.callsArgWith(1, error);
      request(app)
        .get('/api/classifier/' + classifierId + '/status')
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.status.should.have.been.calledOnce;
          nlcMock.status.should.have.been.calledWith(sinon.match({classifier : classifierId}), sinon.match.func);
          done(err);
        });
    });

  });

  describe('DELETE /api/classifier/:id', function () {

    it('should return a 200 response', function (done) {
      request(app)
        .delete('/api/classifier/' + classifierId)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.remove.should.have.been.called;
          nlcMock.remove.should.have.been.calledWith(sinon.match({classifier : classifierId}), sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.remove.callsArgWith(1, error);
      request(app)
        .delete('/api/classifier/' + classifierId)
        .set('Cookie', [this.sessionCookie])
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.remove.should.have.been.calledOnce;
          nlcMock.remove.should.have.been.calledWith(sinon.match({classifier : classifierId}), sinon.match.func);
          done(err);
        });
    });

  });

  describe('POST /api/classifier/:id/classify', function () {

    var body = {text : 'example text'};

    it('should return a 200 response', function (done) {
      request(app)
        .post('/api/classifier/' + classifierId + '/classify')
        .set('Cookie', [this.sessionCookie])
        .send(body)
        .expect(httpstatus.OK)
        .end(function (err, resp) {
          nlcMock.classify.should.have.been.called;
          nlcMock.classify.should.have.been.calledWith(
            sinon.match({classifier : classifierId, text : body.text}),
            sinon.match.func);
          done(err);
        });
    });

    it('should respond a 400 response on error', function (done) {
      nlcMock.classify.callsArgWith(1, error);
      request(app)
        .post('/api/classifier/' + classifierId + '/classify')
        .set('Cookie', [this.sessionCookie])
        .send(body)
        .expect(httpstatus.BAD_REQUEST)
        .end(function (err, resp) {
          nlcMock.classify.should.have.been.calledOnce;
          nlcMock.classify.should.have.been.calledWith(
            sinon.match({classifier : classifierId, text : body.text}),
            sinon.match.func);
          done(err);
        });
    });

  });
});
