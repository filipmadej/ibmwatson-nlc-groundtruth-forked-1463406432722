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

var passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    LocalStrategy = require('passport-local').Strategy;
var request = require('request');

// local dependencies
var env = require('./environment');
var crypto = require('../components/crypto');
var log = require('./log');

module.exports = function init(app) {

    function encryptUser(user) {
        return {
            username: user.username,
            password: crypto.encrypt(user.password)
        }
    }

    function decryptUser(user) {
        return {
            username: user.username,
            password: crypto.decrypt(user.password)
        }
    }

    function authenticate(username, password, callback) {
        // do a get to the nlc endpoint
        request({
            uri: env.endpoints.classifier + '/v1/classifiers',
            auth: {
                username: username,
                password: password,
                sendImmediately: true
            }
        }, function handler(error, response, body) {
            if (!error && response.statusCode === 200) {
                return callback(null, {
                    username: username,
                    password: password
                });
            }
            return callback(null, false, {
                'message': 'Username and password not recognised.'
            });
        });
    }

    // Serialize sessions
    passport.serializeUser(function serializeUser(user, callback) {
        if (!!user) {
            callback(null, encryptUser(user));
        } else {
            callback(new Error('User not found'));
        }
    });

    // Deserialize sessions
    passport.deserializeUser(function deserializeUser(user, callback) {

        if (!!user) {
            callback(null, decryptUser(user));
        } else {
            callback(new Error('Unrecognized user'));
        }
    });

    // Use local strategy
    passport.use(new LocalStrategy(authenticate));

    passport.use(new BasicStrategy(authenticate));

    app.use(passport.initialize());
    app.use(passport.session());

}