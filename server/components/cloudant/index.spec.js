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
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

// local dependencies
var cloudantUtil;

var should = chai.should();
chai.use(sinonChai);


describe('/server/components/cloudant/index', function () {

    before(function () {
        this.vcapServicesOld = process.env.VCAP_SERVICES;
        this.vcapServicesTest = {
            'cloudantNoSQLDB' : [{
                'name' : 'ibmwatson-qa-cloudant',
                'label' : 'cloudantNoSQLDB',
                'plan' : 'Shared',
                'credentials' : {
                    'username' : 'user',
                    'password' : 'password',
                    'host' : 'https://user.cloudant.com',
                    'port' : 443,
                    'url' : 'https://user:password@user.cloudant.com'

                }
            }]
        };

        process.env.VCAP_SERVICES = JSON.stringify(this.vcapServicesTest);

    });

    describe('#success', function () {

        beforeEach( function () {

            this.cloudantCreds = this.vcapServicesTest.cloudantNoSQLDB[0].credentials;

            this.connSpy = function (options, name, design, callback) {
                options.account.should.be.equal(this.cloudantCreds.username);
                options.password.should.be.equal(this.cloudantCreds.password);

                if (this.cloudantCreds.key) {
                    options.key.should.be.equal(this.cloudantCreds.key);
                }

                if (this.cloudantCreds.url) {
                    options.url.should.be.equal(this.cloudantCreds.url);
                } else {
                    should.not.exist(options.url);
                }
                callback();
            }.bind(this);

            cloudantUtil  = proxyquire('./index', {
                './conn' : this.connSpy
            });

        });

        it('should parse VCAP_SERVICES service', function (done) {
            cloudantUtil('test', [], function (err) {
                done(err);
            });
        });

        it('should not require designs array', function (done) {
            cloudantUtil('test', function (err) {
                done(err);
            });
        });

        it('should parse user-provided service', function (done) {

            this.vcapServicesTestOrig = this.vcapServicesTest;

            this.userProvidedTest = {
              'user-provided' : [
                {
                  'name' : 'cloudantNoSQLDB',
                  'label' : 'user-provided',
                  'credentials' : {
                    'host' : 'user.cloudant.com',
                    'key' : 'heresencenessivessizorga',
                    'password' : 'n5k25Jh2kKREAgA448bs7EqO',
                    'username' : 'user'
                  }
                }
              ]
            };

            process.env.VCAP_SERVICES = JSON.stringify(this.userProvidedTest);

            this.cloudantCreds = this.userProvidedTest['user-provided'][0].credentials;

            cloudantUtil('test', [], function (err) {
                done(err);
            });

            process.env.VCAP_SERVICES = JSON.stringify(this.vcapServicesTestOrig);
        });

    });


    describe('#error', function () {

        beforeEach( function () {
            this.vcapServicesTestOrig = this.vcapServicesTest;

            this.connSpy = function (options, name, design, callback) {
                should.not.exist(options);
                callback();
            };

            cloudantUtil  = proxyquire('./index', {
                './conn' : this.connSpy
            });

        });

        afterEach( function () {
            process.env.VCAP_SERVICES = JSON.stringify(this.vcapServicesTestOrig);
        });

        it('no VCAP_SERVICES results in undefined options', function (done) {
            delete process.env.VCAP_SERVICES;

            cloudantUtil('test', [], function (err) {
                done(err);
            });
        });

        it('no cloudantNoSQLDB service results in undefined options', function (done) {
            process.env.VCAP_SERVICES = JSON.stringify({services : {}});

            cloudantUtil('test', [], function (err) {
                done(err);
            });
        });

        it('no cloudantNoSQLDB user-provided service results in undefined options', function (done) {
            process.env.VCAP_SERVICES = JSON.stringify({
              'user-provided' : [
                {
                  'name' : 'nomatch',
                  'label' : 'user-provided',
                  'credentials' : {
                    'host' : 'user.cloudant.com',
                    'key' : 'heresencenessivessizorga',
                    'password' : 'n5k25Jh2kKREAgA448bs7EqO',
                    'username' : 'user'
                  }
                }
              ]
            });

            cloudantUtil('test', [], function (err) {
                done(err);
            });
        });

    });


    after(function () {
        process.env.VCAP_SERVICES = this.vcapServicesOld;
    });
});
