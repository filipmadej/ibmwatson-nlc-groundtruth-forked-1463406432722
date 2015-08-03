'use strict';

var bunyan = require('bunyan');

module.exports = exports = bunyan.createLogger({
    name : 'ibmwatson-nlc-groundtruth-ui',
    src : true,
    streams : [

        // detailed debug goes to a file which can be
        //  better processed and viewed using the
        //  bunyan CLI tool
        {
            level : 'trace',
            path : 'bunyan.log',

            // limit size of file so we don't
            //  indefinitely append
            type : 'rotating-file',
            period : '1d',
            count : 2
        },

        // info and above goes to stdout
        {
            level : 'info',
            stream : process.stdout
        }

    ]
});
