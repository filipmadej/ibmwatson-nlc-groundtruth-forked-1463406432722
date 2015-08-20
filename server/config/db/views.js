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
/* eslint no-underscore-dangle:0, camelcase:0 */

/**
 * Fetches objects using views created on the Cloudant database.
 *
 * @author Andy Stoneberg
 * @module ibmwatson-nlc-store/lib/db/views
 */

// external dependencies
var makeArray = require('make-array');

// local dependencies
var log = require('../log');
var dberrors = require('./errors');

function noopMapFn (row) {
    return row;
}

function countDocumentsUsingView (db, designdoc, view, options, callback) {
    log.debug({
        design : designdoc,
        view : view,
        options : options
    }, 'Counting objects using cloudant view');

    var req = {
        designdoc : designdoc,
        view : view,
        parameters : options
    };

    db.view(designdoc, view, req.parameters, function handleResponse (err, resp) {
        if (err) {
            req.err = err;
            log.error(req, 'Failed to count items using view');
            return callback(err);
        }

        log.debug({
            response : resp
        }, 'Counted docs using view');

        var count = 0;
        if (resp.rows && resp.rows.length > 0) {
            count = resp.rows[0].value;
        }

        return callback(null, count);
    });
}

function getDocumentsUsingView (db, designdoc, view, options, mapfn, callback) {
    log.debug({
        design : designdoc,
        view : view,
        options : options
    }, 'Getting objects using cloudant view');

    var req = {
        designdoc : designdoc,
        view : view,
        parameters : options
    };

    db.view(designdoc, view, req.parameters, function handleResponse (err, resp) {
        if (err) {
            req.error = err;
            log.error(req, 'Failed to get items using view');
            return callback(err);
        }

        req.documents = resp;
        log.debug(req, 'Got docs using view');
        callback(null, resp.rows.map(mapfn));
    });
}

function getSingleResultFn (callback) {
    return function processSingleResult (err, results) {
        if (err) {
            return callback(err);
        }

        if (results.length > 1) {
            return callback(dberrors.toomanyresults('Expected single reference'));
        }

        if (results.length === 0) {
            return callback(dberrors.notfound('No reference found'));
        }

        callback(err, results[0]);
    }
}

module.exports.getClasses = function getClasses (db, tenant, options, callback) {
    var designdoc = 'class';
    var viewname = 'class';
    var req = {
        startkey : [tenant],
        endkey : [tenant, []],
        skip : options.skip || 0,
        limit : options.limit || 10,
        reduce : false,
        include_docs : true
    };

    var classMapFn = function mapRowToClass (row) {
        var classInfo = row.doc;
        return {
            id : classInfo._id,
            name : classInfo.name
        };
    };

    getDocumentsUsingView(db, designdoc, viewname, req, classMapFn, callback);
};

module.exports.countClasses = function countClasses (db, tenant, callback) {
    var designdoc = 'class';
    var viewname = 'class';
    var req = {
        startkey : [tenant],
        endkey : [tenant, []],
        group : true,
        group_level : 1
    };
    countDocumentsUsingView(db, designdoc, viewname, req, callback);
};

module.exports.getTexts = function getTexts (db, tenant, options, callback) {
    var designdoc = 'text';
    var viewname = 'text';
    var req = {
        startkey : [tenant],
        endkey : [tenant, []],
        skip : options.skip || 0,
        limit : options.limit || 10,
        reduce : false,
        include_docs : true
    };

    var textMapFn = function mapRowToText (row) {
        var textInfo = row.doc;
        return {
            id : textInfo._id,
            value : textInfo.value,
            classes : textInfo.classes
        };
    };

    getDocumentsUsingView(db, designdoc, viewname, req, textMapFn, callback);
};

module.exports.countTexts = function countTexts (db, tenant, callback) {
    var designdoc = 'text';
    var viewname = 'text';
    var req = {
        startkey : [tenant],
        endkey : [tenant, []],
        group : true,
        group_level : 1
    };
    countDocumentsUsingView(db, designdoc, viewname, req, callback);
};

module.exports.getDocumentsInTenant = function getDocumentsInTenant (db, tenant, options, callback) {
    var designdoc = 'tenant';
    var viewname = 'tenant';

    var req = {
        key : tenant,
        skip : options.skip || 0,
        limit : options.limit || 1000,
        reduce : false
    };

    var valueMapFn = function valueMapFn (row) {
        return row.value;
    };

    getDocumentsUsingView(db, designdoc, viewname, req, valueMapFn, callback);
};

module.exports.countDocumentsInTenant = function countDocumentsInTenant (db, tenant, callback) {
    var designdoc = 'tenant';
    var viewname = 'tenant';
    var req = {
        key : tenant,
        group : true,
        reduce : true
    };
    countDocumentsUsingView(db, designdoc, viewname, req, callback);
};

module.exports.getClassByName = function getTenantByName (db, tenant, name, callback) {
    var designdoc = 'class';
    var viewname = 'class';
    var req = {
        key : [tenant, name],
        reduce : false
    };

    getDocumentsUsingView(db, designdoc, viewname, req, noopMapFn, getSingleResultFn(callback));
};

module.exports.lookupClasses = function lookupClasses (db, tenant, ids, callback) {
    var keys = makeArray(ids).map(function makeKey (elem) {
      return [tenant, elem];
    });

    log.debug({keys : keys}, 'Looking up classes');

    var designdoc = 'class';
    var viewname = 'by-id';
    var req = {
        keys : keys,
        reduce : false
    };


    getDocumentsUsingView(db, designdoc, viewname, req, noopMapFn, callback);

};

module.exports.getTextByValue = function getTenantByName (db, tenant, value, callback) {
    var designdoc = 'text';
    var viewname = 'text';
    var req = {
        key : [tenant, value],
        reduce : false
    };

    getDocumentsUsingView(db, designdoc, viewname, req, noopMapFn, getSingleResultFn(callback));
};
