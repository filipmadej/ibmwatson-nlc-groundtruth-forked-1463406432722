// TODO: taken from ibmwatson-qa-questionclassifier

'use strict';
/**
 * Submits question data to eClassifier.
 */

// external dependencies
var request = require('request');
var httpstatus = require('http-status');
// ibmwatson dependencies
var config = require('ibmwatson-qa-config').init('config.json');
// local dependency
var log = require('../../config/log');



function getEndpoint () {
    var host = config.get('eclassifier:apihost');
    var port = config.get('eclassifier:apiport');
    return host + ':' + port + '/eclassifier/api/v1/classify';
}


exports.cluster = function cluster (req, res) {
    var classifyRequest = {
        url : getEndpoint(),
        method : 'POST',
        body : req.body.questions,
        json : true
    };
    log.debug({ request : classifyRequest }, 'Classifying questions');
    request(classifyRequest, function (err, httpresp, body){
        if (err){
            return res.status(400).send(err);
        }
        if (httpresp.statusCode !== httpstatus.OK){
            return res.status(404).send(new Error('Unexpected response from eClassifier ' + httpresp.statusCode));
        }
        return res.send(body);
    });
};
