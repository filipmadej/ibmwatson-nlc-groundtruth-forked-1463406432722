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

// core dependencies
var util = require('util');

// external dependencies
var _ = require('lodash');
var httpstatus = require('http-status');
var uuid = require('node-uuid');

// local dependencies
var cache = require('./cache');
var restutils = require('../../components/restutils');

var responses = restutils.res;

module.exports.jobStatus = function jobStatus (req, res) {
  var tenantid = req.params.tenantid;
  var jobid = req.params.jobid;

  var details = cache.get(jobid);
  if (details) {
    return res.status(httpstatus.OK)
      .json(details);
  }

  return responses.notfound(res);
}
