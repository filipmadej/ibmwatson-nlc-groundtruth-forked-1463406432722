'use strict';

angular.module('ibmwatson-nlc-groundtruth-app')
  .factory('authentication', ['$http', '$q', '$log', 'session','endpoints', function init($http, $q, $log, session, endpoints) {

    function createSession(user) {
        // Store the current user and tenant for other services
        var tenant = _.isArray(user.tenants) ? user.tenants[0] : null;
        session.create(user.username,tenant);
    }

    function checkStatus() {
      return $http.get(endpoints.auth).then(
        function handleResponse(response) {

          // An error response should be handled globally
          createSession(response.data);
          return response.data;
      });
    }

    function getCurrentUser() {
      $log.debug('getCurrentUser');
      if (!session.username) {
        return checkStatus();
      } else {
        return $q.when(session.username);
      }
    }

    function isAuthenticated() {
      return !!session.username;
    }

    function login (username, password) {
      return $http
        .post(endpoints.auth, {
          username: username,
          password: password
        })
        .then(function handleLoginResponse(res) {

          // Store the current user and tenant for other services
          var tenant = _.isArray(res.data.tenants) ? res.data.tenants[0] : null;

          session.create(res.data.username,tenant);

          return res.data;

        },function handleLoginError(res){
          if (res.status === 400 || res.status === 401) {
            throw new Error('Invalid username or password');
          }
          return res.data;
        });

    }

    function logout() {
      return $http.post(endpoints.auth + '/logout', null, {
        withCredentials: true
      }).then(function onLogout() {
        session.destroy();
      });
    }

    var auth = {
      checkStatus: checkStatus,
      isAuthenticated: isAuthenticated,
      getCurrentUser: getCurrentUser,
      login: login,
      logout: logout
    };

    return auth;
  }]);
