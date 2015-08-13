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

var httpstatus = require('http-status');
var passport = require('passport');

function prepareUserForResponse (user) {

    return {
        username : user.username,
        tenants : [user.username]
    }
}

exports.login = function login (req, res, next) {

    passport.authenticate('local', function verify (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(httpstatus.BAD_REQUEST).end();
        }

        req.logIn(user, function prepareResponse (err) {
            if (err) {
                return next(err);
            }
            res.status(httpstatus.OK).json(prepareUserForResponse(user));
        });
    })(req, res, next);
};

exports.check = function check (req, res) {
    if (req.user) {
        res.status(httpstatus.OK).json(prepareUserForResponse(req.user));
    }
    else {
        res.status(httpstatus.UNAUTHORIZED).end();
    }
};

exports.logout = function logout (req, res) {
    if (req.user) {
        req.logout();
        res.status(httpstatus.OK).end();
    } else {
        res.status(httpstatus.BAD_REQUEST, 'Not logged in').end();
    }
};
