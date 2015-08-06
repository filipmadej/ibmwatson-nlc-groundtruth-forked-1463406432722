'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .service('session', function() {
    this.create = function create (username, tenant) {
      this.username = username;
      this.tenant = tenant;
    };
    this.destroy = function destroy () {
      this.username = null;
      this.tenant = null;
    };
  });
