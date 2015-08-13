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
/* eslint no-underscore-dangle:0 */

/**
 * Helper functions for REST API responses.
 */

// external dependencies
var httpstatus = require('http-status');
var contentrange = require('content-range');

function hideImplementationDetails (object) {
    if (object._id) {
        object.id = object._id;
        delete object._id;
    }
    delete object._rev;
    delete object.schema;
    delete object.tenant;
    return object;
}

module.exports.item = function item (object, res) {
    res.status(httpstatus.OK)
        .header('ETag', object._rev)
        .json(hideImplementationDetails(object));
};

module.exports.newitem = function newitem (object, locationtemplate, locationids, res) {
    var location = locationtemplate;
    Object.keys(locationids).forEach(function substituteId (id) {
        location = location.replace(id, locationids[id]);
    });

    res.status(httpstatus.CREATED)
        .header('ETag', object._rev)
        .header('Location', location)
        .json(hideImplementationDetails(object));
};

module.exports.list = function list (objects, res) {
    res.status(httpstatus.OK)
        .json(objects.map(hideImplementationDetails));
};

module.exports.batch = function batch (objects, start, total, res) {
    var range = contentrange.format({
        name : 'items',
        offset : start,
        limit : objects.length,
        count : total
    });

    res.status(httpstatus.OK)
        .header('Content-Range', range)
        .json(objects.map(hideImplementationDetails));
};

module.exports.del = function del (res) {
    res.status(httpstatus.NO_CONTENT)
        .send();
};

module.exports.edited = function edited (res, object) {
    if (object) {
        res.status(httpstatus.OK)
            .header('ETag', object._rev)
            .json(hideImplementationDetails(object));
    }
    else {
        res.status(httpstatus.NO_CONTENT).send();
    }
};

function notfound (res) {
    res.status(httpstatus.NOT_FOUND)
        .json({ error : 'Not found' });
}

module.exports.notfound = notfound;

module.exports.ok = function ok (res) {
    res.status(httpstatus.OK).send();
};

module.exports.missingEtag = function missingEtag (res) {
    res.status(httpstatus.PRECONDITION_FAILED)
        .json({ error : 'Missing If-Match header' });
};

function badEtag (res) {
    res.status(httpstatus.PRECONDITION_FAILED)
        .json({ error : 'Incorrect If-Match header' });
}
module.exports.badEtag = badEtag;

function insufficientPrivileges (res, message) {
    res.status(httpstatus.FORBIDDEN)
        .json({ error : message || 'Insufficient privileges' });
}
module.exports.insufficientPrivileges = insufficientPrivileges;

module.exports.badrequest = function badrequest (description, res) {
    res.status(httpstatus.BAD_REQUEST)
        .json({ error : description });
};

module.exports.error = function error (res, err) {
    if (err.statusCode) {
        switch (err.statusCode) {
            case httpstatus.NOT_FOUND:
                return notfound(res);
            case httpstatus.CONFLICT:
                return badEtag(res);
            case httpstatus.FORBIDDEN:
                if (err.code === 'EBADCSRFTOKEN') {
                    return insufficientPrivileges(res, 'Invalid CSRF Token');
                }

                return insufficientPrivileges(res);
            default:
                res.status(err.statusCode)
                    .json({ error : err.error || err.message });
        }
    }
    else {
        // unknown error - assume server error
        res.status(httpstatus.INTERNAL_SERVER_ERROR)
            .json({ error : err.message });
    }
};
