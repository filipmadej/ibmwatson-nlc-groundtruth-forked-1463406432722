/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var log = require('./log');


module.exports = function(app) {

  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());


  // Configure Sessions
  app.set('trust proxy',true);

  var redisClient = require('./redis')();

  log.debug({secret:config.secrets.session},'Using Session Secret');


  if(!!redisClient){
    // If Redis is available, use as session store
    app.use(session({
      secret:config.secrets.session,
      store: new RedisStore({client:redisClient})
    }));
  }else{
    // Otherwise, use local sessions
    app.use(session({secret:config.secrets.session}));
  }
  
  
  if ('production' === env) {
    app.use(favicon(path.join(config.root, 'dist', 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'dist', 'public')));
    app.set('appPath', path.join(config.root, 'dist', 'public'));
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', path.join(config.root, 'client'));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};