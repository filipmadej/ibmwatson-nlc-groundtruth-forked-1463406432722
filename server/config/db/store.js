'use strict';
/* eslint no-underscore-dangle:0 */

/**
 * Main module for managing the database used to store the class store documents.
 *
 * @see db/objects for definitions of the objects that will be stored.
 * @author Dale Lane
 * @module ibmwatson-qa-questionstore/lib/db
 */

// core dependencis
var util = require('util');

// external dependencies
var async = require('async');
var makeArray = require('make-array');
// db module dependencies
var cloudant = require('ibmwatson-common-cloudant');
var dbdesigns = require('./designs');
var dberrors = require('./errors');
var dbfetch = require('./fetch');
var dbobjects = require('./objects');
var dbviews = require('./views');
var dbhandlers = require('./updatehandlers');
var deleteall = require('./deletes');
// local dependencies
var nlc = require('../nlc');
var log = require('../log');

var db;

// Convenient reference to database names
var nlcstore = 'nlcstore';


module.exports.start = function start (callback) {

    log.debug('Connecting to cloudant');
    cloudant(nlcstore, dbdesigns, function storeDbHandle (err, dbhandle) {
        db = dbhandle;
        callback(err);
    });

};

module.exports.stop = function stop () {
    log.debug('Stopping');
    db = null;
};

/**
 * Creates a new class.
 *
 *  This will store a new document to represent the class.
 *
 * @param {String} tenant - ID of the tenant to store the class in
 * @param {Object} attrs - attributes of the class to store
 * @param {Function} callback - callback(err, class) - called once complete
 * @returns {void}
 */
module.exports.createClass = function createClass (tenant, attrs, callback) {

    // check for required parameter
    if (!attrs.name) {
        return callback(dberrors.missingrequired('Missing required class name'));
    }

    // prepare object for storing
    var classification = dbobjects.prepareClassInfo(tenant, attrs);

    db.insert(classification, function checkResponse (err, docstatus) {
        if (err) {
            return callback(err);
        }

        // store the rev to return to the caller
        classification._rev = docstatus.rev;

        // return the stored question
        callback(null, classification);

    });
};


function getClass (tenant, id, callback) {
    dbfetch.getClass(db, tenant, id, callback);
}

/**
 * Replaces an existing class.
 *
 *  This will replace the document currently stored for the given class.
 *
 * @param {String} tenant - ID of the tenant to store the class in
 * @param {Object} attrs - attributes of the class to store
 * @param {String} rev - version of the class to replace, or '*' as a wildcard
 * @param {Function} callback - callback(err, class) - called once complete
 * @returns {void}
 */
module.exports.replaceClass = function replaceClass (tenant, attrs, rev, callback) {

    // check for required parameter
    if (!attrs.name) {
        return callback(dberrors.missingrequired('Missing required class name'));
    }

    // prepare object for storing
    var classification = dbobjects.prepareClassInfo(tenant, attrs);

    async.waterfall([
        function getCurrentClass (next) {
            getClass(tenant, classification._id, function getCallback (err, current) {
                if (err) {
                    return callback(err);
                }

                // check that we have the right version (or a wildcard)
                //  before trying to do the delete
                if (rev === '*') {
                    rev = current._rev;
                } else if (rev !== current._rev) {
                    return callback(dberrors.rev());
                }

                classification._rev = rev;

                next();
            });
        },
        function replaceClass (next) {
            db.insert(classification, function checkResponse (err, docstatus) {
                if (err) {
                    return callback(err);
                }

                // store the rev to return to the caller
                classification._rev = docstatus.rev;

                // return the stored question
                next(null, classification);

            });
        }], callback);
};

function updateReferencesBatch (db, tenant, classid, callback) {
    var options = {
        skip : 0,
        limit : 100,
        class : classid
    };

    async.waterfall([
        function getTexts (next) {
            dbfetch.getTextsWithClass(db, tenant, options, next);
        },
        function prepareUpdateRequest (texts, next) {
            var docs = texts.map(function update (doc) {
                var idx = doc.classes.indexOf(classid);
                if (idx > -1) {
                    doc.classes.splice(idx, 1);
                }
                return doc;
            });
            next(null, { docs : docs });
        },
        function submitUpdate (req, next) {
            if (req.docs && req.docs.length > 0) {
                return db.bulk(req, function checkDeleteResponse (err, results) {
                    next(err, results);
                });
            }

            return next(null, null);
        },
        function checkForMore (results, next) {
            var count = makeArray(results).length;
            next(null, count === options.limit);
        }
    ], callback);
}

function runReferenceUpdate (db, tenant, classid, callback) {
    updateReferencesBatch(db, tenant, classid, function nextStep (err, moretoupdate) {
        if (err) {
            return callback(err);
        }
        if (moretoupdate) {
            return runReferenceUpdate(db, tenant, classid, callback);
        }

        return callback();
    });
}

/**
 * Deletes an existing class.
 *
 * @param {String} tenant - ID of the tenant to delete the class from
 * @param {String} id - ID of the class to delete
 * @param {String} rev - version of the class to delete, or '*' as a wildcard
 * @param {Function} callback - called once complete
 * @returns {void}
 */
module.exports.deleteClass = function deleteClass (tenant, id, rev, callback) {

    async.waterfall([
        function getCurrentClass (next) {
            getClass(tenant, id, function getCallback (err, classification) {
                if (err) {
                    return callback(err);
                }

                // check that we have the right version (or a wildcard)
                //  before trying to do the delete
                if (rev === '*') {
                    rev = classification._rev;
                } else if (rev !== classification._rev) {
                    return callback(dberrors.rev());
                }

                next(null, classification);
            });
        },
        function deleteClass (classification, next) {
            db.destroy(id, classification._rev, next);
        },
        function removeReferences (status, resp, next) {
            runReferenceUpdate(db, tenant, id, next);
        }], callback);
};

module.exports.getClasses = function getClasses (tenant, options, callback) {
    dbfetch.getClasses(db, tenant, options, callback);
};
module.exports.countClasses = function countClasses (tenant, callback) {
    dbviews.countClasses(db, tenant, callback);
};
module.exports.getClass = getClass;

module.exports.updateClassMetadata = function updateClassMetadata (id, metadata, callback) {
    dbhandlers.updateClassMetadata(db, id, metadata, callback);
};


/**
 * Creates a new text.
 *
 *  This will store a new document to represent the text.
 *
 * @param {String} tenant - ID of the tenant to store the class in
 * @param {Object} attrs - attributes of the text to store
 * @param {Function} callback - callback(err, text) - called once complete
 * @returns {void}
 */
module.exports.createText = function createText (tenant, attrs, callback) {

    // check for required parameter
    if (!attrs.value) {
        return callback(dberrors.missingrequired('Missing required text value'));
    }

    // prepare object for storing
    var text = dbobjects.prepareTextInfo(tenant, attrs);

    db.insert(text, function checkResponse (err, docstatus) {
        if (err) {
            return callback(err);
        }

        // store the rev to return to the caller
        text._rev = docstatus.rev;

        // return the stored question
        callback(null, text);

    });
};

function getText (tenant, id, callback) {
    dbfetch.getText(db, tenant, id, callback);
}

/**
 * Adds classes to an existing text (if that class is not already present on the text).
 *
 *
 * @param {String} text - ID of the text to update
 * @param {String[]} classes - IDs of the classes to add
 * @param {Function} callback - called once complete
 * @returns {void}
 */
function addClassesToText (text, classes, callback) {

    log.debug({
        text : text,
        classes : classes
    }, 'Adding tenants to profile');

    dbhandlers.addClassesToText(db, text, makeArray(classes), callback);

}

module.exports.addClassesToText = addClassesToText;

/**
 * Removes classes from an existing text (if that class is present on the text).
 *
 *
 * @param {String} text - ID of the text to update
 * @param {String[]} classes - IDs of the classes to remove
 * @param {Function} callback - called once complete
 * @returns {void}
 */
function removeClassesFromText (text, classes, callback) {

    log.debug({
        text : text,
        classes : classes
    }, 'Removing classes from text');

    dbhandlers.removeClassesFromText(db, text, makeArray(classes), callback);
}

module.exports.removeClassesFromText = removeClassesFromText;

module.exports.updateTextMetadata = function updateTextMetadata (id, metadata, callback) {
    dbhandlers.updateTextMetadata(db, id, metadata, callback);
};

/**
 * Deletes an existing text.
 *
 * @param {String} tenant - ID of the tenant to delete the text from
 * @param {String} id - ID of the text to delete
 * @param {String} rev - version of the text to delete, or '*' as a wildcard
 * @param {Function} callback - called once complete
 * @returns {void}
 */
module.exports.deleteText = function deleteText (tenant, id, rev, callback) {

    async.waterfall([
        function getCurrentText (next) {
            getText(tenant, id, function getCallback (err, text) {
                if (err) {
                    return callback(err);
                }

                // check that we have the right version (or a wildcard)
                //  before trying to do the delete
                if (rev === '*') {
                    rev = text._rev;
                } else if (rev !== text._rev) {
                    return callback(dberrors.rev());
                }

                next(null, text);
            });
        },
        function deleteText (text, next) {
            db.destroy(text._id, text._rev, next);
        }], callback);
};

module.exports.getTexts = function getTexts (tenant, options, callback) {
    dbfetch.getTexts(db, tenant, options, callback);
};
module.exports.countTexts = function countTexts (tenant, callback) {
    dbviews.countTexts(db, tenant, callback);
};
module.exports.getText = getText;

module.exports.deleteTenant = function deleteTenant (tenant, callback) {
    deleteall(db, tenant, callback);
};

/***********************************************************************/




/**
 * Creates a new user.
 *
 *  This will store a new document to represent the user.
 *
 * @param {Object} attrs - attributes of the profile to store
 * @param {Function} callback - callback(err, profile) - called once complete
 * @returns {void}
 */
function createProfile (attrs, callback) {

    if (!attrs.username) {
        return callback(dberrors.missingrequired('Missing required Profile username'));
    }

    if (!attrs.password) {
        return callback(dberrors.missingrequired('Missing required Profile password'));
    }

    attrs.username = attrs.username.toLowerCase();

    async.waterfall([
        function checkIfUsernameUnique (next) {
            checkIfProfileExists(attrs.username, function handleExisting (err, result) {
                if (result) {
                    return next(dberrors.nonunique(util.format('Profile [%s] already exists', attrs.username)));
                }
                return next(err);
            });
        },
        function doCreate (next) {
            // prepare object for storing
            var profile = dbobjects.prepareProfileInfo(attrs);

            db.bulk({ docs : [profile] }, function checkResponse (err, docstatus) {
                if (err) {
                    log.error({ err : err }, 'Failed to create profile');
                    return callback(err);
                }

                // store the rev to return to the caller
                profile._rev = docstatus[0].rev;

                // return the stored question
                log.debug({ profile : profile }, 'Created profile');
                next(null, profile);

            });
        }], callback)
}

module.exports.createProfile = createProfile;

function getProfile (id, callback) {
    async.waterfall([
        function dbGetProfile(next){
            dbfetch.getProfile(db, id, function handleProfile (err, profile) {
                next(err, profile);
            });
        },function dbAddProfileTenant(profile,next){
            profile.tenants = [nlc.username];
            next(null,profile);
        }
    ],callback);

}

module.exports.getProfile = getProfile;

module.exports.getProfiles = function getProfiles (options, callback) {
    async.waterfall([
        function dbGetProfiles(next){
            dbfetch.getProfiles(db, options, next);
        },
        function dbAddProfilesTenant(profiles,next){
            if(profiles && typeof profiles.sort === 'function'){
                for (var i = 0; i < profiles.length; i++) {
                    profiles[i].tenants = [nlc.username];
                }
            }
            next(null,profiles);
        }
    ],callback);
}

/**
 * Deletes an existing profile.
 *
 * @param {String} id - ID of the profile to delete
 * @param {String} rev - version of the profile to delete, or '*' as a wildcard
 * @param {Function} callback - called once complete
 * @returns {void}
 */
module.exports.deleteProfile = function deleteProfile (id, rev, callback) {

    async.waterfall([
        function getCurrentProfile (next) {
            dbfetch.getProfile(db, id, function getCallback (err, profile) {
                if (err) {
                    return callback(err);
                }

                // check that we have the right version (or a wildcard)
                //  before trying to do the delete
                if (rev === '*') {
                    rev = profile._rev;
                } else if (rev !== profile._rev) {
                    return callback(dberrors.rev());
                }

                next(null, profile);
            });
        },
        function deleteProfile (profile, next) {
            db.destroy(profile._id, profile._rev, function afterDelete (err, result) {
                next(err, profile._id);
            });
        }
    ], callback);
};

function checkIfProfileExists (username, callback) {
    getProfileByUsername(username, function handleExistCheck (err, existing) {
        if (err && err.error === dberrors.NOT_FOUND) {
            return callback(null, null);
        } else if (err) {
            return callback(err);
        } else {
            return callback(null, existing);
        }
    });
}

function getProfileByUsername (username, callback) {
    async.waterfall([
        function dbGetProfileByUserName(next){
            dbviews.getProfileByUsername(db, username, function handleProfile (err, profile) {
                next(err, profile);
            });
        },function dbAddProfileTenant(profile,next){
            profile.tenants = [nlc.username];
            next(null,profile);
        }
    ],callback);
}

module.exports.getProfileByUsername = getProfileByUsername;

