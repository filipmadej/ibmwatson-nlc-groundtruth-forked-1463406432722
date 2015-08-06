angular.module('config', [])
  .constant('endpoints', {
    'auth': '/api/authenticate',
    'classifier': '/api/classifer',
    'import': '/api/import',
    'cluster': '/api/cluster',
    'texts': '/api',
    'classes': '/api',
  });
