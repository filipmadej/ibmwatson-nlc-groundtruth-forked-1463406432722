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
 * Retrieves objects from the cloudant database.
 *
 * @author Andy Stoneberg
 * @module ibmwatson-nlc-store/lib/db/fetch
 */

// local dependency
var log = require('../log');

function validateObject (doc, objecttype, tenant, callback) {
    if (doc.schema !== objecttype) {
        var schemafailure = 'Retrieved unexpected object type';
        log.error({ unexpected : doc, expected : objecttype }, schemafailure);
        return callback(new Error(schemafailure));
    }

    if (doc.tenant !== tenant) {
        var tenantfailure = 'Retrieved document from incorrect tenant';
        log.error({ unexpected : doc }, tenantfailure);
        return callback(new Error(tenantfailure));
    }

    return callback(null, doc);
}


function getObject (db, tenant, objecttype, objectid, callback) {

    log.debug({
        tenant : tenant,
        objectid : objectid,
        objecttype : objecttype
    }, 'Fetching object');

    db.get(objectid, function checkResponse (err, doc) {
        if (err) {
            return callback(err);
        }

        // check that we got what we expected
        validateObject(doc, objecttype, tenant, callback);
    });
}

module.exports.getClass = function getClass (db, tenant, id, callback) {
    getObject(db, tenant, 'class', id, function returnClass (err, classification) {
        callback(err, classification);
    });
};

module.exports.getText = function getClass (db, tenant, id, callback) {
    getObject(db, tenant, 'text', id, function returnText (err, text) {
        callback(err, text);
    });
};


module.exports.getClasses = function getClasses (db, tenant, options, callback) {

    log.debug({
        tenant : tenant,
        fields : options.fields,
        skip : options.skip,
        limit : options.limit
    }, 'Getting classes');

    var q = {
        selector : {
            tenant : tenant,
            schema : 'class'
        },
        skip : options.skip,
        limit : options.limit,
        'use_index' : 'search-class',
    };
    if (options.fields && options.fields.length > 0) {
        q.fields = options.fields;
    }

    log.debug({ options : q }, 'Submitting db find');

    db.find(q, function returnClasses (err, response) {
        if (err) {
            return callback(err);
        }
        callback(null, response.docs);
    });
};

module.exports.getTexts = function getTexts (db, tenant, options, callback) {

    log.debug({
        tenant : tenant,
        fields : options.fields,
        skip : options.skip,
        limit : options.limit
    }, 'Getting texts');

    var q = {
        selector : {
            tenant : tenant,
            schema : 'text'
        },
        skip : options.skip,
        limit : options.limit,
        'use_index' : 'search-text',
    };

    if (options.value) {
        q.selector.value = {
            '$regex' : '.*' + options.value + '.*'
        }
    }

    if (options.fields && options.fields.length > 0) {
        q.fields = options.fields;
    }

    log.debug({ options : q }, 'Submitting db find');

    db.find(q, function returnTexts (err, response) {
        if (err) {
            return callback(err);
        }
        callback(null, response.docs);
    });
};

module.exports.getTextsWithClass = function getTextsWithClass (db, tenant, options, callback) {
    log.debug({
        tenant : tenant,
        options : options
    }, 'Getting texts that reference class');

    options.skip = options.skip || 0;
    options.limit = options.limit || 100;

    var parameters = {
        selector : {
            tenant : tenant,
            schema : 'text',
            value : {
                '$gt' : null
            },
            classes : {
                '$elemMatch' : {
                    '$eq' : options.class
                }
            }
        },
        'use_index' : 'search-text-with-class',
        skip : options.skip,
        limit : options.limit
    };

    if (options.fields && options.fields.length > 0) {
        parameters.fields = options.fields;
    }

    log.debug({ parameters : parameters }, 'Submitting db find');

    db.find(parameters, function returnXRefs (err, response) {
        if (err) {
            return callback(err);
        }
        callback(null, response.docs);
    });
};

module.exports.getProfile = function getProfile (db, id, callback) {
    getObject(db, 'profile', id, function returnProfile (err, profile) {
        callback(err, profile);
    });
};

function searchProfileIndex (db, options, callback) {
    options.skip = options.skip || 0;
    options.limit = options.limit || 10;

    var parameters = {
        selector : {
            schema : {
                '$eq' : 'profile'
            }
        },
        'use_index' : 'search-profile',
        skip : options.skip,
        limit : options.limit
    };

    if (options.username) {
        parameters.selector.username = {
            '$eq' : options.username
        }
    }

    if (options.fields && options.fields.length > 0) {
        parameters.fields = options.fields;
    }

    log.debug({ parameters : parameters }, 'Submitting db find for profile');

    db.find(parameters, function returnProfiles (err, response) {
        if (err) {
            return callback(err);
        }
        callback(null, response.docs);
    });
}

module.exports.getProfiles = function getProfiles (db, options, callback) {
    log.debug({
        options : options
    }, 'Getting profiles');

    searchProfileIndex(db, options, function handleProfiles (err, profiles) {
        callback(err, profiles);
    });

};