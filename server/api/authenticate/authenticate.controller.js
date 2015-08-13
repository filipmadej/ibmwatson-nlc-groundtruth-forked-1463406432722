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
