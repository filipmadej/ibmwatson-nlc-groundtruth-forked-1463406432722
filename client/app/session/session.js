'use strict';

angular.module('ibmwatsonQaGroundtruthUiApp')
  .service('session', function() {
    this.create = function(username, tenant) {
      this.username = username;
      this.tenant = tenant;
    };
    this.destroy = function() {
      this.username = null;
      this.tenant = null;
    };
  });