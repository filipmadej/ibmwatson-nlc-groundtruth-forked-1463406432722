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

// external dependencies
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var restapiutils = require('./index');

var should = chai.should();
chai.use(sinonChai);

describe('/server/components/restutils/index', function () {

    describe('#exports', function () {

        it('should export requests module as req', function () {
            restapiutils.should.have.property('req');
        });

        it('should export responses module as res', function () {
            restapiutils.should.have.property('res');
        });

    });

});
