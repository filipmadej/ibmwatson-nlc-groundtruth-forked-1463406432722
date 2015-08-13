/**
 * CSRF Sync Token implementation
 *
 * Order of middleware registration matters!  This should
 * be registered after any cookie/session configuration but
 * prior to the routes it is intended to protect.
 *
 */

'use strict';

var csrf = require('csurf');

module.exports = function configure (app) {

  var env = app.get('env');

  if (env === 'production') {
    app.use(csrf());

    app.use(function generateSyncToken (req, res, next) {
      res.cookie('XSRF-TOKEN', req.csrfToken());
      return next();
    });
  }

};
