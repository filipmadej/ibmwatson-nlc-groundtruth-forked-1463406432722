'use strict';

var express = require('express');
var async = require('async');
var httpstatus = require('http-status');
var makeArray = require('make-array');
// ibmwatson dependencies
var restutils = require('ibmwatson-common-restapi');

// local dependencies
var db = require('../../config/db/store');
var dberrors = require('../../config/db/errors');
var log = require('../../config/log');
var rest = require('../../config/rest');

var responses = restutils.res;
var requests = restutils.req;

var router = express.Router();

var ENDPOINTS = {
    'classes': '/:tenantid/classes/',
    'class': '/:tenantid/classes/:classid'
};

router.use(ENDPOINTS.classes, rest.ensureAuthenticated);

router.use(ENDPOINTS.class, rest.ensureAuthenticated);

router.get(ENDPOINTS.classes, function handleGetClasses(req, res) {
    log.debug({
        params: req.params,
        query: req.query
    }, 'Getting classes');

    var tenantid = req.params.tenantid;
    var options = requests.listoptions(req);

    async.parallel([
        function getBatch(next) {
            db.getClasses(tenantid, options, next);
        },
        function getCount(next) {
            db.countClasses(tenantid, next);
        }
    ], function returnClasses(err, classresults) {
        if (err) {
            return responses.error(res, err);
        }
        var classes = classresults[0];
        var count = classresults[1];

        log.debug({
            tenant: tenantid,
            num: count
        }, 'Got classes');
        responses.batch(classes, options.skip, count, res);
    });
});

router.get(ENDPOINTS.class, function handleGetClass(req, res) {
    log.debug({
        params: req.params
    }, 'Getting class');

    var tenantid = req.params.tenantid;
    var classid = req.params.classid;

    db.getClass(tenantid, classid, function returnClass(err, classification) {
        if (err) {
            return dberrors.handle(err, [httpstatus.NOT_FOUND], 'Error occurred while attempting to retrieve class.', function returnResponse() {
                return responses.error(res, err);
            });
        }
        responses.item(classification, res);
    });
});

router.post(ENDPOINTS.classes, function handlePostClass(req, res) {
    log.debug({
        body: req.body,
        params: req.params
    }, 'Creating class');

    var tenantid = req.params.tenantid;
    var classattrs = req.body;

    if (!classattrs) {
        return responses.badrequest('Missing request body', res);
    }

    db.createClass(tenantid, classattrs, function returnNewClass(err, classification) {
        if (err) {
            return dberrors.handle(err, [httpstatus.BAD_REQUEST], 'Error occurred while attempting to create class.', function returnResponse() {
                return responses.error(res, err);
            });
        }

        log.debug({
            class: classification
        }, 'Created class');
        responses.newitem(
            classification,
            ENDPOINTS.class, {
                ':tenantid': tenantid, ':classid': classification._id
            },
            res);
    });
});

// replace a class
router.put(ENDPOINTS.class, function handleReplaceClass(req, res) {
    log.debug({
        params: req.params
    }, 'Replacing class');

    var tenantid = req.params.tenantid;
    var classid = req.params.classid;
    var etag = req.headers['if-match'];
    var classattrs = req.body;

    if (!classattrs) {
        return responses.badrequest('Missing request body', res);
    }

    if (!etag) {
        return responses.missingEtag(res);
    }

    if (classattrs.id && classattrs.id !== classid) {
        return responses.badrequest('Mismatch of class id', res);
    }

    classattrs.id = classid;

    db.replaceClass(tenantid, classattrs, etag, function replacedClass(err, replaced) {
        if (err) {
            return dberrors.handle(err, [httpstatus.BAD_REQUEST], 'Error occurred while attempting to replace class.', function returnResponse() {
                return responses.error(res, err);
            });
        }
        log.debug({
            class: classid
        }, 'Replaced class');
        responses.edited(res, replaced);
    });
});

router.delete(ENDPOINTS.class, function handleDeleteClass(req, res) {
    log.debug({
        params: req.params
    }, 'Deleting class');

    var tenantid = req.params.tenantid;
    var classid = req.params.classid;
    var etag = req.headers['if-match'];

    if (!etag) {
        return responses.missingEtag(res);
    }

    db.deleteClass(tenantid, classid, etag, function deletedClass(err) {
        if (err) {
            return dberrors.handle(err, [httpstatus.NOT_FOUND], 'Error occurred while attempting to delete class.', function returnResponse() {
                return responses.error(res, err);
            });
        }
        log.debug({
            class: classid
        }, 'Deleted class');
        responses.del(res);
    });
});

function patchClassMetadata (classid, patchoperation, callback) {
    switch (patchoperation.op) {
        case 'replace':
            log.debug({ operation : patchoperation, class : classid }, 'Updating metadata on class');
            var metadata = rest.sanitizeMetadata(patchoperation.value);
            if (!metadata) {
                return callback(dberrors.invalid('Invalid value'));
            }
            db.updateClassMetadata(classid, metadata, callback);
            break;
        default:
            log.debug({ operation : patchoperation }, 'Unsupported operation');
            return callback(dberrors.invalid('Unsupported operation'));
    }
}

router.patch(ENDPOINTS.class, function handlePatchClass (req, res) {
    log.debug({ body : req.body, params : req.params }, 'Patching class');

    var classid = req.params.classid;

    var patchoperations = requests.verifyObjectsList(makeArray(req.body));

    async.eachSeries(patchoperations,
        function applyPatch (patchoperation, nextop) {
            if (patchoperation.path === '/metadata') {
               return patchClassMetadata(classid, patchoperation, nextop);
            } else {
                log.debug({ operation : patchoperation }, 'Unsupported operation');
                return nextop(dberrors.invalid('Unsupported operation'));
            }
        },
        function handlePatchResponse (err) {
            if (err) {
                return responses.error(res, err);
            }
            responses.edited(res);
        });
});



module.exports = router;
