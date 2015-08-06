'use strict';

/**
 * Creates a connection to a Cloudant database.
 *
 *  Uses connection details from a bound Bluemix service instance if available, or a
 *   user-provided service otherwise.  Will create any provided design docs if provided.
 *
 * @author Andy Stoneberg
 * @module ibmwatson-common-cloudant
 */

// external dependencies
var _ = require('lodash');
// local dependencies
var dbconn = require('./conn');
var log = require('../../config/log');

/**
 * Create Cloudant DB options from the credentials provided in VCAP_SERVICES.
 *
 * @param {Object} bluemixcredentials - credentials from Bluemix VCAP
 * @returns {Object} options - cloudant connection options
 */
function createOptions (bluemixcredentials) {
    var options = {
        account : bluemixcredentials.username,
        password : bluemixcredentials.password
    };
    if (bluemixcredentials.key) {
        options.key = bluemixcredentials.key;
    }
    if (bluemixcredentials.url) {
        options.url = bluemixcredentials.url;
    }
    return options;
}

/**
 * Gets a Cloudant connection object from the credentials available in
 *  Bluemix VCAP_SERVICES.
 *
 * @returns {Object} options - cloudant connection options
 */
function getCloudantOptions () {
    var options;

    if (process.env.VCAP_SERVICES) {
        var services = JSON.parse(process.env.VCAP_SERVICES);
        log.debug({ services : services }, 'Retrieved available services from VCAP');

        if (services.cloudantNoSQLDB) {
            log.debug({ services : services.cloudantNoSQLDB }, 'Using bound service credentials');

            var credentials = services.cloudantNoSQLDB[0].credentials;
            options = createOptions(credentials);
        }
        else if (services['user-provided']) {
            log.debug({ services : services['user-provided'] }, 'Using bound user-provided credentials');

            services['user-provided'].some(function checkUserProvidedService (userservice) {
                if (userservice.name === 'cloudantNoSQLDB') {
                    options = createOptions(userservice.credentials);
                    // stop after finding the first match
                    return true;
                }
            });
        }
    }

    return options;
}

module.exports = function getInstance (dbname, designs, callback) {
    if (_.isFunction(designs)) {
        callback = designs;
        designs = [];
    }

    dbconn(getCloudantOptions(), dbname, designs, callback);
};
