'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .factory('errors', [function init () {
    var errors = [];

    function publishError(errObj) {
      errors.push(errObj);
      console.log('push');
      console.log(errors);
    }

    function getErrors() {
      console.log('get');
      console.log(errors);
      return errors;
    }

    function clearErrors() {
      errors = [];
    }

    // Public API here
    return {
      'publish' : publishError,
      'get' : getErrors,
      'clear' : clearErrors
    };

  }]);
