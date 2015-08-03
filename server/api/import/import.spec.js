'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var fs = require('fs');

var nlc = require('../../config/nlc');

describe('POST /api/import/csv', function() {
	var file;

	before('load the test csv file', function(done) {
		fs.readFile('server/api/import/test.csv', 'utf8', function(err, data) {
			if (err) throw err;
			file = data;
			done();
		});
	});

    it('should respond with the CSV parsed file', function(done) {
        request(app)
            .post('/api/import/csv')
            .auth(nlc.username, nlc.password)
			.set("Content-Type", "text/plain")
            .send(file)
            .expect(200)
            .end(function(err, res) {
				res.body.length.should.equal(8);
				res.body[0].text.should.equal('Example input 1');
				res.body[0].classes.length.should.equal(0);
				res.body[4].text.should.equal('Example quote " " input 5');
				res.body[3].classes.length.should.equal(3);
                done(err);
            });
    });
});
