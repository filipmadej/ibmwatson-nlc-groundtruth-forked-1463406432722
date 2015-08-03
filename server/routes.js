/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function(app) {

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
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
