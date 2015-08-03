'use strict';

var passport = require('passport');

function prepareUserForResponse(user){

    return {
        username:user.username,
        tenants:[user.username]
    }
}

exports.login = function(req, res, next) {

    passport.authenticate('local', function(err, user) {

        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).end();
        }

        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            res.status(200).json(prepareUserForResponse(user));
        });
    })(req, res, next);
};

exports.check = function(req, res) {
    if(req.user){
        console.log('user is authenticated',req.user);
        res.status(200).json(prepareUserForResponse(req.user));
    }
    else{
        res.status(401).send();
    }
};

exports.logout = function(req, res) {
    if (req.user) {
        req.logout();
        res.status(200).end();
    } else {
        res.status(400, "Not logged in").end();
    }
};