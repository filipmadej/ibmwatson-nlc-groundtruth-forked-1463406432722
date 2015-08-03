'use strict';

var redis = require('redis');
var cfenv = require('cfenv');
var config = require('./environment');
var log = require('./log');

var client = null;

function createOptions( /*Object*/ serviceConfig) {
    var options = {};

    if (serviceConfig.credentials.password) {
        options.auth_pass = serviceConfig.credentials.password;
    }

    return options;
}

module.exports = function createClient() {

    var serviceConfig = null,
        appEnv = null;

    if (client) {
        // If a client has already been created, use it
        return client;
    }

    appEnv = cfenv.getAppEnv({
        vcap: config.vcap
    });

    serviceConfig = appEnv.getService('ibmwatson-nlc-redis');

    if (!serviceConfig) {
        //If no redis instance is bound to the app, return null;
        log.info('No redis connection available');

        return null;
    }

    log.info({
        port: serviceConfig.credentials.port,
        host: serviceConfig.credentials.host
    }, 'Connecting to redis db');

    // Create the client
    client = redis.createClient(serviceConfig.credentials.port, serviceConfig.host, createOptions(serviceConfig));

    client.on('error', function(err) {
        log.error({
            error: err
        }, 'Redis error');
    });

    return client;
}
