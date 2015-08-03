'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/authenticate', function() {
    // TODO: Can we mock the log in and then test the 200 response?
    it('should respond with a 401 response if the user is not authenticated', function(done) {
        request(app)
            .get('/api/authenticate')
            .expect(401)
            .end(function(err, res) {
                done();
            });
    });
});

describe('POST /api/authenticate', function() {
    it('should respond with a 200 response if the user provides the correct credentials', function(done) {
        request(app)
            .post('/api/authenticate')
            .set('Authorization', 'Basic testuser:testpassword')
            .send({'username':'testuser','password':'testpassword'})
            .expect(200)
            .end(function(err, res) {
                // should also test that cookie has been set?
                done();
            });
    });

    it('should respond with a 401 response if the user provides the incorrect credentials', function(done) {
        request(app)
            .post('/api/authenticate')
            .set('Authorization', 'Basic testuser:wrongpasswordfool')
            .send({'username':'testuser','password':'wrongpasswordfool'})
            .expect(401)
            .end(function(err, res) {
                done();
            });
    });
});

describe('POST /api/authenticate/logout', function() {
    it('should respond with a 200 response if the user provides the correct credentials', function(done) {
        request(app)
            .post('/api/authenticate/logout')
            .expect(200)
            .end(function(err, res) {
                // should also test that cookie has been cleared?
                done();
            });
    });
});
