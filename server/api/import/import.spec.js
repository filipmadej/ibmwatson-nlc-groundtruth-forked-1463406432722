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

var app;

describe('/server/api/authenticate', function () {

    before(function () {

        this.timeout(15000);

        // This is synchronous but takes awhile to load!
        app = proxyquire('../../app', {
            './config/db/store' : mocks.storeMock
        });

    });

    describe('POST /api/import/csv', function () {
        var file;

        before('load the test csv file', function (done) {
            fs.readFile('server/api/import/test.csv', 'utf8', function (err, data) {
                if (err) throw err;
                file = data;
                done();
            });
        });

        it('should respond with the CSV parsed file', function (done) {
            request(app)
                .post('/api/import/csv')
                .auth(nlc.username, nlc.password)
                .set('Content-Type', 'text/plain')
                .send(file)
                .expect(200)
                .end(function (err, res) {
                    res.body.length.should.equal(8);
                    res.body[0].text.should.equal('Example input 1');
                    res.body[0].classes.length.should.equal(0);
                    res.body[4].text.should.equal('Example quote " " input 5');
                    res.body[3].classes.length.should.equal(3);
                    done(err);
                });
        });
    });

});
