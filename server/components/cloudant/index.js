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
