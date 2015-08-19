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

// local dependencies
var nlc = require('./nlc');
var log = require('./log');

module.exports = function init (app) {

    // Serialize sessions
    passport.serializeUser(function serializeUser (user, callback) {
        if (!!user) {
            callback(null, user.username);
        } else {
            callback(new Error('User not found'));
        }
    });

    // Deserialize sessions
    passport.deserializeUser(function deserializeUser (username, callback) {

        if (username === nlc.username) {
            callback(null,nlc);
        } else {
            callback(new Error('Unrecognized user'));
        }
    });

    // Use local strategy
    passport.use(new LocalStrategy(function authenticate (username, password, done) {
        console.log(nlc);
        if (username === nlc.username && password === nlc.password) {
            return done(null,nlc);
        }

        return done(null, false, {
            'message' : 'Username and password not recognised.'
        });

    }));

    passport.use(new BasicStrategy(
        function authenticate (username, password, done) {
            if (username === nlc.username && password === nlc.password) {
                return done(null,nlc);
            }

            return done(null, false, {
                'message' : 'Username and password not recognised.'
            });
        }
    ));

    app.use(passport.initialize());
    app.use(passport.session());

}
