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
/*eslint func-names: 0, max-nested-callbacks: [2,10], max-statements: [2,15], handle-callback-err: 0 */

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var requests = require('./requests');

var should = chai.should();
chai.use(sinonChai);

describe('server/components/restutils/requests', function () {

    describe('#listOptions()', function () {

        var req;

        beforeEach(function () {
            req = {
                headers : {},
                query : {}
            };
        });

        describe('#success-scenarios', function () {

            it('empty range header should return options', function () {
                var options = requests.listoptions(req);
                options.should.have.property('skip', 0);
                options.should.have.property('limit');
            });

            it('valid range header should return options', function () {
                req.headers.range = 'items=2-9';
                var options = requests.listoptions(req);
                options.should.have.property('skip', 2);
                options.should.have.property('limit', 8);
            });

            it('range header with missing offset should return options', function () {
                req.headers.range = 'items=-9';
                var options = requests.listoptions(req);
                options.should.have.property('skip', 0);
                options.should.have.property('limit', 10);
            });

            it('user provided fields should return options', function () {
                req.query.fields = 'attr1,attr2';
                var options = requests.listoptions(req);
                options.should.have.property('fields').that.is.an('array')
                    .with.length(2)
                    .that.deep.equals(['attr1', 'attr2']);
            });

            it('user provided id field gets converted to internal format', function () {
                req.query.fields = 'id';
                var options = requests.listoptions(req);
                options.should.have.property('fields').that.is.an('array')
                    .with.length(1)
                    .that.contains('_id');
            });
        });

        describe('#error-scenarios', function () {

            it('should throw error on invalid range syntax', function () {
                req.headers.range = 'xxx';
                (function () {
                    requests.listoptions(req);
                }).should.throw('Invalid Range format');
            });

            it('should throw error on invalid range type', function () {
                req.headers.range = 'foos=2-9';
                (function () {
                    requests.listoptions(req);
                }).should.throw('Unsupported range type : foos');
            });

            it('should throw error on multiple ranges', function () {
                req.headers.range = 'items=0-1,2-9';
                (function () {
                    requests.listoptions(req);
                }).should.throw('Multiple ranges is unsupported');
            });
        });
    });

    describe('#verifyObjectsList ()', function () {

        describe('#success-scenarios', function () {

            it('valid list is returned', function () {
                this.list = [];
                var verifiedList = requests.verifyObjectsList(this.list);
                verifiedList.should.equal(this.list);
            });
        });

        describe('#error-scenarios', function () {

            it('should throw error on non-list argument', function () {
                (function () {
                    requests.verifyObjectsList({});
                }).should.throw('Expected an array');
            });
        });

    });

    describe('#getServiceAuthHeader ()', function () {

        var originalToken = process.env.SERVICE_BEARER_TOKEN;
        process.env.SERVICE_BEARER_TOKEN = uuid.v1();

        it('valid token returned', function () {
            var headerValue = requests.getServiceAuthHeader();
            headerValue.should.equal('Bearer ' + process.env.SERVICE_BEARER_TOKEN);
        });

        it('#cleanup()', function () {
            process.env.SERVICE_BEARER_TOKEN =  originalToken
        });

    });


});
