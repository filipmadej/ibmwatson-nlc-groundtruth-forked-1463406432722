'use strict';

var bunyan = require('bunyan');

var config = {
    name : 'ibmwatson-nlc-groundtruth',
    serializers : bunyan.stdSerializers,
    src : true,
    streams : [
        {
            level : 'debug',
            path : 'bunyan.log'
        }
    ]
};

if (process.env.NODE_ENV === 'production') {
    config.streams.push({
            level : 'info',
            stream : process.stdout
        }
    );
}

module.exports = exports = bunyan.createLogger(config);
