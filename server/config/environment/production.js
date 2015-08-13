'use strict';

// Production specific configuration
// =================================
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
module.exports = {
    // Server IP
    ip: appEnv.bind ||
        process.env.IP ||
        undefined,

    // Server port
    port:   appEnv.port ||
            process.env.PORT ||
            8080
};
