'use strict';

var passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    LocalStrategy = require('passport-local').Strategy;

// local dependencies
var nlc = require('./nlc');
var db = require('./cloudant');
var log = require('./log');

module.exports = function (app) {

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
        // db.getProfileByUsername(username,function(err,profile){
        //     callback(err, profile);
        // });

        if(username === nlc.username){
            callback(null,nlc);
        }
    });

    // Use local strategy
    passport.use(new LocalStrategy(function authenticate (username, password, done) {

        console.log(nlc);

        if(username === nlc.username && password === nlc.password){
            return done(null,nlc);
        }

        return done(null, false, {
            'message' : 'Username and password not recognised.'
        });
        
        // db.getProfileByUsername(username,function(err,profile){
            
        //     if (!!profile && profile.password === password) {
        //         return done(null, profile);
        //     }

        //     return done(null, false, {
        //         'message' : 'Username and password not recognised.'
        //     });
        // });
    }));

    passport.use(new BasicStrategy(
        function(username, password, done) {
            if(username === nlc.username && password === nlc.password){
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
