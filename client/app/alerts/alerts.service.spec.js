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

describe('Service: alerts', function() {

  var testAlerts = [{
    id: '123',
    level: 'danger',
    title: 'Danger',
    text: 'Will Robinson!',
    dismissable: false
  }, {
    id: '456',
    level: 'warning',
    title: 'Warning',
    text: 'I\'ll be back',
    dismissable: true
  }, {
    id: '789',
    level: 'info',
    title: 'Just so you know',
    text: 'Something interesting has occured',
    dismissable: true
  }];

  // load the service's module and mock $cookies
  beforeEach(module('ibmwatson-nlc-groundtruth-app'));

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  // instantiate service
  var alerts;

  beforeEach(inject(function($injector) {

    alerts = $injector.get('alerts');

  }));

  it('should exist', function() {
    expect(!!alerts).toBe(true);
    expect(typeof alerts.add).toBe('function');
    expect(typeof alerts.remove).toBe('function');
    expect(typeof alerts.clear).toBe('function');
  });

  it('should have an empty array at initialization', function() {
    expect(alerts.alerts).toBeTruthy();
    expect(typeof alerts.alerts.sort).toBe('function');
    expect(alerts.alerts.length).toBe(0);
  });

  describe('Service: alerts.add', function() {
    it('should add an alert object to the end of the list', function() {
      var list = alerts.alerts;

      alerts.add(testAlerts[0]);

      expect(alerts.alerts.length).toBe(1);
      expect(list.length).toBe(1);

    });
  });

  describe('Service: alerts.remove', function() {

    beforeEach(function() {
      alerts.add(testAlerts[0]);
    });

    it('should remove an alert from the list by equality', function() {
      alerts.remove(testAlerts[0]);
      expect(alerts.alerts.length).toBe(0);
    });

    it('should not remove any alerts if they do not exist in the list', function() {
      alerts.remove(testAlerts[1]);
      expect(alerts.alerts.length).toBe(1);
    });

  });

  describe('Service: alerts.clear', function() {

    beforeEach(function() {
      alerts.add(testAlerts[0]);
      alerts.add(testAlerts[1]);
      alerts.add(testAlerts[2]);
    });

    it('should remove all alerts from the list', function() {
      var list = alerts.alerts;

      alerts.clear();

      expect(list.length).toBe(0);
    });

  });

});