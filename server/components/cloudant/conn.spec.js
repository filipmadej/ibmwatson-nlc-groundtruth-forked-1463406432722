'use strict';
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var async = require('async');
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var conn;

var should = chai.should();
chai.use(sinonChai);


describe('/server/components/cloudant/conn', function () {
    var dbname = 'test';

    beforeEach( function () {

        this.handleSpy = sinon.spy();

        this.cloudantSpy = sinon.stub();
        this.cloudantSpy.callsArgWith(1, null, {});

        this.instanceSpy = sinon.stub();
        this.instanceSpy.callsArgWith(3, null, this.handleSpy);

        conn  = proxyquire('./conn', {
            'cloudant' : this.cloudantSpy,
            './instance' : this.instanceSpy
        });

        this.options = {};
    });

    it('should successfully return a handle to the db', function (done) {
        conn(this.options, dbname, [], function (err, result) {
            should.exist(result);
            result.should.equal(this.handleSpy);
            done(err);
        }.bind(this));
    });

    it('should not require designs array', function (done) {
        conn(this.options, dbname, function (err, result) {
            should.exist(result);
            result.should.equal(this.handleSpy);
            done(err);
        }.bind(this));
    });

    it('should use options.url if provided', function (done) {
        this.options.url = 'http://user:test@example.cloudant.com';

        this.cloudantSpy.callsArgWith(1, null, {});

        conn(this.options, dbname, [], function (err, result) {
            this.cloudantSpy.url.should.equal(this.options.url);
            should.exist(result);
            result.should.equal(this.handleSpy);
            done(err);
        }.bind(this));
    });

    it('should return cached value if DB previously handled', function (done) {
        var handle;
        async.series([
            function (next) {
                conn(this.options, dbname, [], function (err, result) {
                    handle = result;
                    should.exist(handle);
                    this.cloudantSpy.reset();
                    this.instanceSpy.reset();
                    next();
                }.bind(this))
            }.bind(this),
            function (next) {
                conn(this.options, dbname, [], function (err, result) {
                    handle.should.equal(result);
                    this.cloudantSpy.should.not.have.been.called;
                    this.instanceSpy.should.not.have.been.called;
                    next();
                }.bind(this))
            }.bind(this)
        ], function (err) {
            done(err);
        });
    });

    it('should return any underlying error through the callback', function (done) {

        this.cloudantSpy.callsArgWith(1, {});

        conn(this.options, dbname, [], function (err, result) {
            should.exist(err);
            should.not.exist(result);
            done();
        });
    });

    it('should return error if options not provided', function (done) {

        conn(null, dbname, [], function (err, result) {
            should.exist(err);
            this.instanceSpy.should.not.have.have.been.called;
            done();
        }.bind(this));
    });

});
