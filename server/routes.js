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

/**
 * Main application routes
 */

'use strict';

var httpstatus = require('http-status');
var path = require('path');
var errors = require('./components/errors');
var responses = require('./components/restutils').res;
var log = require('./config/log');

module.exports = function configure (app) {

  // Insert routes below
  app.use('/api/authenticate', require('./api/authenticate'));
  app.use('/api', require('./api/import'));
  app.use('/api', require('./api/classifier'));
  app.use('/api', require('./api/text'));
  app.use('/api', require('./api/class'));
  app.use('/api', require('./api/content'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[httpstatus.NOT_FOUND]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function defaultGET (req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });

  // error handling
  app.use(function returnError (err, req, res, next) { // eslint-disable-line no-unused-vars
    log.error({ err : err}, 'Uncaught exception');
    responses.error(res, err);
  });
};
