/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

describe('Service: authentication', function () {

  // load the service's module and mock $cookies
  beforeEach(module('ibmwatson-nlc-groundtruth-app'));

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  // instantiate service
  var authentication, endpoints, $httpBackend;

  beforeEach(inject(function ($injector, _authentication_, _endpoints_) {
    authentication = _authentication_;
    endpoints = _endpoints_;

    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('GET', endpoints.auth).respond(200);
  }));

  it('should exist', function () {
    expect(!!authentication).toBe(true);
  });

  it('should use the \'checkStatus\' function to check whether a user is logged in on the server', function () {
    $httpBackend.expectGET(endpoints.auth);
    authentication.checkStatus();
  });

});
