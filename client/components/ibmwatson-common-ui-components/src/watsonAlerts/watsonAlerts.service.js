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

/**
 * Service to manage a list of alerts to display to the user.
 * Alerts are represented by an object with the following structure:
 * {
 *  id:'1234', // Optional: alert id or code
 *  level: 'info', // Optional: One of success, info, warning, error. Default 'info'
 *  title: 'Hello Stranger!', // Optional: A title for the alert message
 *  text : 'Please log in'  // Required: Text for the alert message
 *  link : 'hththt' // Optional: A link to put at the end of the message
 *  linkText: '' // Optional: Text to put on the link. If link is supplied, defaults to 'Learn more'
 * }
 */
angular.module('ibmwatson-common-ui-components.watsonAlerts')
  .factory('watsonAlerts', ['$log', function init ($log) {

    var LEVELS = [ 'success', 'info', 'warning', 'error' ];

    var alerts = [];

    /**
    * Add an alert to the list of alerts
    */
    function add( /*Object*/ alert) {
      $log.debug('add', alert, alerts);

      alert.level = alert.level || LEVELS[1];
      if (LEVELS.indexOf(alert.level) < 0) {
        alert.level = LEVELS[1];
      }

      // check the optional 'dismissable' attribute and set to default 'true'
      if (alert.dismissable === undefined) {
        alert.dismissable = true;
      }

      // Create a dismiss function to allow the alert to be removed
      alert.dismiss = function() {
        remove.apply(this, [alert]);
      };

      alerts.push(alert);

      return alert;
    }

    /**
    * Remove an alert from the list of alerts
    */
    function remove( /*Object*/ alert) {
      $log.debug(remove, alert);
      var index = alerts.indexOf(alert);
      if (index >= 0) {
        alerts.splice(index, 1);
      }
    }

    /**
    * Remove all current alerts
    */
    function clear() {
      alerts.splice(0, alerts.length);
    }

    // Public API here
    return {
      'alerts': alerts,
      'add': add,
      'remove': remove,
      'clear': clear
    };

  }]);
