/**
 * CSRF Sync Token implementation
 *
 * Order of middleware registration matters!  This should
 * be registered after any cookie/session configuration but
 * prior to the routes it is intended to protect.
 *
 */

'use strict';

var cookieParser = require('cookie-parser');
var csrf = require('csurf');
var appEnv = require('./environment');

module.exports = function configure (app) {

  app.use(cookieParser(appEnv.secrets.cookie));
  app.use(csrf());

  app.use(function generateSyncToken (req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    return next();
  });

};
