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
  app.use('/api/import', require('./api/import'));
  app.use('/api/classifier', require('./api/classifier'));
  app.use('/api/cluster', require('./api/cluster'));

  app.use('/api', require('./api/text'));
  app.use('/api', require('./api/class'));
  //app.use('/api', require('./api/tenant'));

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
