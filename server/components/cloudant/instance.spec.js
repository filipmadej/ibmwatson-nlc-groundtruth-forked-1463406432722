'use strict';
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, complexity: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var httpstatus = require('http-status');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var instance = require('./instance');

var should = chai.should();
chai.use(sinonChai);

function createCloudantError (message, statusCode) {
    var error = new Error();
    error.message = message;
    error.statusCode = statusCode;
    return error;
}

function getDesignName (name) {
    return '_design/' + name;
}

describe('server/components/cloudant/instance', function () {

    var dbname = 'test';

    var exampleView = {
        views : {
            exampleView : {
                version : 1,
                map : function (doc) {
                    emit(doc.key, doc.value); // jshint ignore:line
                },
                reduce : '_count'
            }
        }
    };

    var createdExampleView = {
        '_id' : '_design/exampleView',
        '_rev' : '1-1',
        'views' : {
            'exampleView' : {
                'version' : 1,
                'map' : 'function (doc) {\nemit(doc.key, doc.value);\n}',
                'reduce' : '_count'
            }
        }
    }

    var exampleViewUpdate = {
        views : {
            exampleView : {
                version : 2,
                map : function (doc) {
                    emit(doc.key, doc.value); // jshint ignore:line
                },
                reduce : '_sum'
            }
        }
    };

    var exampleHandler = {
        updates : {
            version : 1,
            exampleHandler : function (doc, req) {
                doc.example = 'foo';
                return [doc, 'Hello world'];
            }
        }
    };

    var exampleHandlerUpdate = {
        updates : {
            version : 2,
            exampleHandler : function (doc, req) {
                doc.example = 'bar';
                return [doc, 'Hello world'];
            }
        }
    };


    var createdExampleHandler = {
        '_id' : '_design/exampleHandler',
        '_rev' : '1-1',
        'updates' : {
            'version' : 1,
            'exampleHandler' : 'function (doc, req) {\ndoc.example = \'foo\';\nreturn [doc, \'Hello world\'];\n}'
        }
    }

    var exampleIndex = {
        name : 'exampleIndex',
        version : 1,
        index : {
            fields : [{
                name : 'asc'
            }]
        }
    };

    var exampleIndexUpdate = {
        name : 'exampleIndex',
        version : 2,
        index : {
            fields : [{
                name : 'asc',
                description : 'asc'
            }]
        }
    };

    var createdExampleIndex = {
        '_id' : '_design/exampleIndex',
        '_rev' : '1-1',
        'language' : 'query',
        'views' : {
            'exampleIndex' : {
                'map' : {
                    'fields' : {
                        'name' : 'asc'
                    }
                },
                'reduce' : '_count',
                'options' : {
                    'def' : {
                        'fields' : [
                            'name'
                            ]
                    },
                    'w' : 2
                },
                'version' : 1
            }
        }
    }

    var namelessIndex = {
        ddoc : 'nameless',
        index : {
            fields : [{
                name : 'asc'
            }]
        }
    };

    var createdNamelessIndex = {
        '_id' : '_design/nameless',
        '_rev' : '1-1',
        'language' : 'query',
        'views' : {
            'nameless-index-0' : {
                'map' : {
                    'fields' : {
                        'name' : 'asc'
                    }
                },
                'reduce' : '_count',
                'options' : {
                    'def' : {
                        'fields' : [
                            'name'
                            ]
                    },
                    'w' : 2
                }
            }
        }
    }


    var exampleViewDesign = {
        name : 'exampleView',
        ddocs : [exampleView]
    };

    var exampleViewDesignUpdate = {
        name : 'exampleView',
        ddocs : [exampleViewUpdate]
    };

    var exampleHandlerDesign = {
        name : 'exampleHandler',
        ddocs : [exampleHandler]
    };

    var exampleHandlerDesignUpdate = {
        name : 'exampleHandler',
        ddocs : [exampleHandlerUpdate]
    };

    var exampleIndexDesign = {
        name : 'exampleIndex',
        indexes : [exampleIndex]
    };

    var exampleIndexDesignUpdate = {
        name : 'exampleIndex',
        indexes : [exampleIndexUpdate]
    };

    var namelessIndexDesign = {
        name : 'nameless',
        indexes : [namelessIndex]
    };

    var errorMsg = 'test-generated';

    beforeEach(function () {
        this.instanceMock = {
            insert : sinon.stub(),
            destroy : sinon.stub(),
            get : sinon.stub(),
            list : sinon.stub(),
            bulk : sinon.stub()
        };

        var instanceIndexSpy = sinon.stub();
        var instanceIndexDelSpy = sinon.stub();
        instanceIndexSpy.del = instanceIndexDelSpy;
        this.instanceMock.index = instanceIndexSpy;

        this.dbMock = {
            create : sinon.stub(),
            destroy : sinon.stub(),
            get : sinon.stub(),
            list : sinon.stub(),
            use : sinon.stub()
        };

        this.driverMock = {
            db : this.dbMock
        };

        this.dbMock.use.returns(this.instanceMock);
    });

    describe('#getDatabaseAndCreateIfNecessary()', function () {

        describe('#database exists', function () {

            describe('#success', function () {

                beforeEach( function () {
                    this.dbMock.get.callsArgWith(1, null, {});
                });

                function verifyInvocation (database) {
                        should.exist(database);
                        this.dbMock.use.should.have.been.called;
                        this.dbMock.get.should.have.been.called;
                        database.should.equal(this.instanceMock);
                }

                it('should get valid db reference', function (done) {
                    instance(this.driverMock, dbname, function (err, db) {
                        should.not.exist(err);
                        verifyInvocation.call(this, db);
                        done();
                    }.bind(this));

                });
            });

            describe('#error', function () {

                beforeEach( function () {
                    this.dbMock.get.callsArgWith(1, null, null);
                });

                function verifyFailureInvocation (database) {
                        should.not.exist(database);
                        this.dbMock.get.should.have.been.called;
                        this.dbMock.use.should.not.have.been.called;
                }

                it('should return error if no db info retrieved', function (done) {
                    instance(this.driverMock, dbname, function (err, db) {
                        should.exist(err);
                        verifyFailureInvocation.call(this, db);
                        done();
                    }.bind(this));

                });

            });
        });

        describe('#create database', function () {

            beforeEach( function () {
                this.dbMock.create.callsArg(1);
            });

            describe('#success', function () {

                function verifyInvocation (database) {
                    should.exist(database);
                    this.dbMock.use.should.have.been.called;
                    this.dbMock.get.should.have.been.called;
                    database.should.equal(this.instanceMock);
                }

                beforeEach( function () {
                    this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.NOT_FOUND));
                });

                it('should get valid db reference without providing any designs', function (done) {
                    instance(this.driverMock, dbname, function (err, db) {
                        should.not.exist(err);
                        verifyInvocation.call(this, db);
                        done();
                    }.bind(this));

                });


                describe('#create indexes and views', function () {

                    beforeEach( function () {
                        // Complexity here arises because we want to mock out an initial
                        // call failing but subsequent calls (with different params)
                        // succeeding
                        this.invocationMap = {};
                        this.instanceMock.get = function (name, callback) {
                            if (!this.invocationMap[name]) {
                                this.invocationMap[name] = 1;
                                return callback(createCloudantError(errorMsg, 404));
                            } else {
                                this.invocationMap[name]++;
                                switch (name) {
                                    case createdExampleView._id:
                                        callback(null, createdExampleView);
                                        break;
                                    case createdExampleHandler._id:
                                        callback(null, createdExampleHandler);
                                        break;
                                    case createdExampleIndex._id:
                                        callback(null, createdExampleIndex);
                                        break;
                                    case createdNamelessIndex._id:
                                        callback(null, createdNamelessIndex);
                                        break;
                                    default:
                                        callback(createCloudantError(errorMsg, 404));
                                }
                            }
                        }.bind(this);

                        this.dbMock.use.returns(this.instanceMock);
                    });

                    describe('#success', function () {

                        beforeEach( function () {
                            this.instanceMock.insert.callsArgWith(2, null, {
                                    ok : true,
                                    id : createdExampleView._id,
                                    rev : createdExampleView._rev
                                });

                            this.instanceMock.index = function (index, callback) {
                                should.exist(index);
                                index.should.have.property('name');

                                // Based on actual Cloudant behavior
                                var result = {
                                    result : 'created',
                                    id : getDesignName(index.ddoc),
                                    name : index.name
                                };
                                return callback(null, result);
                            };

                            this.instanceMock.index.del = sinon.stub();

                            this.instanceMock.index.del.callsArgWith(1, null, {ok : true});

                            this.indexSpy = sinon.spy(this.instanceMock, 'index');

                            this.dbMock.use.returns(this.instanceMock);
                        });

                        it('should create db and apply views', function (done) {
                            instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                                this.instanceMock.insert.should.have.been.calledWith(exampleView, getDesignName(exampleViewDesign.name), sinon.match.func);
                                this.indexSpy.should.not.have.been.called;
                                done();
                            }.bind(this));

                        });

                        it('should update view when it has a more recent version', function (done) {
                            this.invocationMap[createdExampleView._id] = 1;
                            var expected = createdExampleView;
                            instance(this.driverMock, dbname, exampleViewDesignUpdate, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleViewDesignUpdate.name), sinon.match.func);
                                done();
                            }.bind(this));
                        });

                        it('should not update view when version has not changed', function (done) {
                            this.invocationMap[createdExampleView._id] = 1;
                            instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.instanceMock.insert.should.not.have.been.called;
                                done();
                            }.bind(this));
                        });

                        it('should create db and apply handlers', function (done) {
                            instance(this.driverMock, dbname, exampleHandlerDesign, function (err, db) {
                                this.instanceMock.insert.should.have.been.calledWith(exampleHandler, getDesignName(exampleHandlerDesign.name), sinon.match.func);
                                this.indexSpy.should.not.have.been.called;
                                done();
                            }.bind(this));

                        });

                        it('should update handler when it has a more recent version', function (done) {
                            this.invocationMap[createdExampleHandler._id] = 1;
                            var expected = createdExampleHandler;
                            instance(this.driverMock, dbname, exampleHandlerDesignUpdate, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.instanceMock.insert.should.have.been.calledWith(expected, getDesignName(exampleHandlerDesignUpdate.name), sinon.match.func);
                                done();
                            }.bind(this));
                        });

                        it('should not update handler when version has not changed', function (done) {
                            this.invocationMap[createdExampleHandler._id] = 1;
                            instance(this.driverMock, dbname, exampleHandlerDesign, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.instanceMock.insert.should.not.have.been.called;
                                done();
                            }.bind(this));
                        });

                        it('should create db and apply indexes', function (done) {
                            instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.instanceMock.insert.should.have.been.calledWith(createdExampleIndex, createdExampleIndex._id, sinon.match.func);
                                this.indexSpy.should.have.been.calledWith(exampleIndex, sinon.match.func);
                                done();
                            }.bind(this));

                        });

                        it('should create db and apply index with a generated name when one is not provided', function (done) {
                            instance(this.driverMock, dbname, namelessIndexDesign, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.instanceMock.insert.should.not.have.been.called;
                                this.indexSpy.should.have.been.calledWith(namelessIndex, sinon.match.func);
                                done();
                            }.bind(this));

                        });

                        it('should update index when it has a more recent version', function (done) {
                            this.invocationMap[createdExampleIndex._id] = 1;
                            instance(this.driverMock, dbname, exampleIndexDesignUpdate, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.indexSpy.should.have.been.calledWith(exampleIndexUpdate, sinon.match.func);
                                this.instanceMock.insert.should.have.been.calledWith(createdExampleIndex, createdExampleIndex._id, sinon.match.func);
                                this.instanceMock.index.del.should.have.been.calledWith(sinon.match.object, sinon.match.func);
                                done();
                            }.bind(this));
                        });

                        it('should not update index when version has not changed', function (done) {
                            this.invocationMap[createdExampleIndex._id] = 1;
                            instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.indexSpy.should.not.have.been.called;
                                done();
                            }.bind(this));
                        });

                        it('should only create db when designs not provided', function (done) {
                            instance(this.driverMock, dbname, function (err, db) {
                                should.not.exist(err);
                                verifyInvocation.call(this, db);
                                this.indexSpy.should.not.have.been.called;
                                this.instanceMock.insert.should.not.have.been.called;
                                done();
                            }.bind(this));
                        });

                    });

                    describe('#error', function () {

                        function verifyInvocationFailure (database) {
                            should.not.exist(database);
                            this.dbMock.use.should.have.been.called;
                            this.dbMock.get.should.have.been.called;
                        }

                        beforeEach( function () {
                            this.instanceMock.insert.callsArgWith(2, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

                            this.instanceMock.index.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));
                        });

                        it('should pass back error if view creation fails', function (done) {
                            instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                                should.exist(err);
                                verifyInvocationFailure.call(this, db);
                                this.instanceMock.insert.should.have.been.calledWith(exampleView, getDesignName(exampleViewDesign.name), sinon.match.func);
                                done();
                            }.bind(this));
                        });

                        it('should pass back error if view check fails', function (done) {

                            var getSpy = sinon.stub(this.instanceMock, 'get')
                            getSpy.callsArgWith(1, createCloudantError(errorMsg, 500));

                            instance(this.driverMock, dbname, exampleViewDesign, function (err, db) {
                                should.exist(err);
                                verifyInvocationFailure.call(this, db);
                                this.instanceMock.insert.should.not.have.been.called;
                                done();
                            }.bind(this));
                        });

                        it('should pass back error if index creation fails', function (done) {
                            instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                                should.exist(err);
                                verifyInvocationFailure.call(this, db);
                                this.instanceMock.index.should.have.been.calledWith(exampleIndex, sinon.match.func);
                                done();
                            }.bind(this));
                        });

                        it('should pass back error if index check fails', function (done) {

                            var getSpy = sinon.stub(this.instanceMock, 'get')
                            getSpy.callsArgWith(1, createCloudantError(errorMsg, 500));

                            instance(this.driverMock, dbname, exampleIndexDesign, function (err, db) {
                                should.exist(err);
                                verifyInvocationFailure.call(this, db);
                                this.instanceMock.index.should.not.have.been.called;
                                done();
                            }.bind(this));
                        });

                    });

                });

            });

            describe('#error', function () {

                function verifyInvocationFailure (database) {
                    should.not.exist(database);
                    this.dbMock.use.should.not.have.been.called;
                    this.dbMock.get.should.have.been.called;
                }

                beforeEach( function () {
                    this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.NOT_FOUND));

                    this.dbMock.create.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));
                });

                it('should pass back error if initial db get fails', function (done) {
                    this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

                    instance(this.driverMock, dbname, function (err, db) {
                        should.exist(err);
                        verifyInvocationFailure.call(this, db);
                        this.dbMock.create.should.not.have.been.called;
                        done();
                    }.bind(this));
                });

                it('should pass back error if db create fails', function (done) {

                    instance(this.driverMock, dbname, function (err, db) {
                        should.exist(err);
                        verifyInvocationFailure.call(this, db);
                        this.dbMock.create.should.have.been.called;
                        done();
                    }.bind(this));
                });

                it('should throw error if no callback provided', function () {
                    this.dbMock.get.callsArgWith(1, createCloudantError(errorMsg, httpstatus.INTERNAL_SERVER_ERROR));

                    (function () {
                        instance(this.driverMock, dbname)
                    }.bind(this)).should.throw(errorMsg);

                });

            });

        });

    });
});
