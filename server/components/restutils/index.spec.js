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
