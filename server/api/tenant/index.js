'use strict';

var express = require('express');

// ibmwatson dependencies
var restutils = require('ibmwatson-common-restapi');

// local dependencies
var db = require('../../config/cloudant');
var log = require('../../config/log');
var rest = require('../../config/rest');

var responses = restutils.res;

var router = express.Router();

var ENDPOINTS = {
    tenant : '/:tenantid'
};

router.use(ENDPOINTS.tenant, rest.ensureAuthenticated);

router.delete(ENDPOINTS.tenant, function deleteTenant (req, res) {
        log.info({ params : req.params }, 'Deleting entire tenant');

        var tenantid = req.params.tenantid;

        db.deleteTenant(tenantid, function deletedTenant (err) {
            if (err) {
                log.error({ err : err, message : err.message }, 'Failed to delete tenant');
                return responses.error(res, err);
            }
            log.info({ tenant : tenantid }, 'Deleted tenant');
            responses.ok(res);
        });
    });


module.exports = router;