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

var chai = require('chai');
var fs = require('fs');
var request = require('supertest');
var proxyquire = require('proxyquire');


// local dependencies
var nlc = require('../../config/nlc');

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();

var app = proxyquire('../../app', {
  './config/db/store' : new mocks.StoreMock(),
  'watson-developer-cloud' : new mocks.WDCMock(),
});

describe('/server/api/import', function () {

  describe('POST /api/import/csv', function () {

    it('should parse CSV input', function (done) {
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('Text 1,Class 1')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[0].text', 'Text 1');
          res.should.have.deep.property('body[0].classes').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[0].classes[0]', 'Class 1');
          done(err);
        });
    });

    it('should parse multi-line CSV input', function (done) {
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('Text 1,Class 1\nText 2,Class 2')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(2);
          res.should.have.deep.property('body[1].text', 'Text 2');
          res.should.have.deep.property('body[1].classes').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[1].classes[0]', 'Class 2');
          done(err);
        });
    });

    it('should not require classes', function (done) {
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('Text 1')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[0].text', 'Text 1');
          res.should.have.deep.property('body[0].classes').that.is.an('array').with.length(0);
          done(err);
        });
    });

    it('should handle multiple classes', function (done) {
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('Text 1,Class 1,Class 2,Class 3')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[0].text', 'Text 1');
          res.should.have.deep.property('body[0].classes').that.is.an('array').with.length(3);
          res.should.have.deep.property('body[0].classes[0]', 'Class 1');
          res.should.have.deep.property('body[0].classes[1]', 'Class 2');
          res.should.have.deep.property('body[0].classes[2]', 'Class 3');
          done(err);
        });
    });

    it('should skip empty fields', function (done) {
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('Text 1,Class 1,,Class 2')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[0].text', 'Text 1');
          res.should.have.deep.property('body[0].classes').that.is.an('array').with.length(2);
          res.should.have.deep.property('body[0].classes[0]', 'Class 1');
          res.should.have.deep.property('body[0].classes[1]', 'Class 2');
          done(err);
        });
    });

    it('should handle inline quoting', function (done) {
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('"Te,,xt, 1",Class 1,Class 2\n"Text "" "" 2",Class 1')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(2);
          res.should.have.deep.property('body[0].text', 'Te,,xt, 1');
          res.should.have.deep.property('body[0].classes').that.is.an('array').with.length(2);
          res.should.have.deep.property('body[0].classes[0]', 'Class 1');
          res.should.have.deep.property('body[0].classes[1]', 'Class 2');
          res.should.have.deep.property('body[1].text', 'Text " " 2');
          res.should.have.deep.property('body[1].classes').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[1].classes[0]', 'Class 1');
          done(err);
        });
    });

    it('should handle inline tabs', function (done) {
      // Inline line breaks must be escaped right now (\\n) since it breaks CSV parsing
      // as line breaks are the record delimiter
      request(app)
        .post('/api/import/csv')
        .auth(nlc.username, nlc.password)
        .set('Content-Type', 'text/plain')
        .send('Text\t1,Class 1,Class\t2\t')
        .expect(200)
        .end(function (err, res) {
          res.should.have.property('body').that.is.an('array').with.length(1);
          res.should.have.deep.property('body[0].text', 'Text\t1');
          res.should.have.deep.property('body[0].classes').that.is.an('array').with.length(2);
          res.should.have.deep.property('body[0].classes[0]', 'Class 1');
          res.should.have.deep.property('body[0].classes[1]', 'Class\t2\t');
          done(err);
        });
    });

  });

});
