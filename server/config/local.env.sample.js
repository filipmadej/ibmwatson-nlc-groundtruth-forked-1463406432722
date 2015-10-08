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

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

var CLOUDANT_USER = '';
var CLOUDANT_PASSWORD = '';
var NLC_USER = '';
var NLC_PASSWORD = '';

var CLOUDANT_HOST = CLOUDANT_USER + '.cloudant.com';
var CLOUDANT_URL = 'https://' + CLOUDANT_USER + ':' + CLOUDANT_PASSWORD + '@' + CLOUDANT_HOST;

module.exports = {

  SESSION_SECRET: 'ibmwatson-nlc-groundtruth-session-secret',
  COOKIE_SECRET: 'ibmwatson-nlc-groundtruth-cookie-secret',

  // Control debug level for modules using visionmedia/debug
  DEBUG: '',

  // A Json object containing service configuration. You will need configuration
  // for a cloudantNoSQLDB called ibmwatson-qa-cloudant
  // and a natural_language_classifier called ibmwatson-nlc-classifier
  VCAP_SERVICES: '{ \
    "cloudantNoSQLDB": [ \
      { \
        "name": "ibmwatson-nlc-cloudant", \
        "label": "cloudantNoSQLDB", \
        "plan": "Shared", \
        "credentials": { \
          "username": "' + CLOUDANT_USER + '", \
          "password": "' + CLOUDANT_PASSWORD + '", \
          "host": "' + CLOUDANT_HOST + '", \
          "port": 443, \
          "url": "' + CLOUDANT_URL + '" \
        } \
      } \
    ],"natural_language_classifier": [ \
      { \
        "name": "ibmwatson-nlc-classifier", \
        "label": "natural_language_classifier", \
        "plan": "standard", \
        "credentials": { \
          "url": "https://gateway.watsonplatform.net/natural-language-classifier/api", \
          "username": "' + NLC_USER + '", \
          "password": "' + NLC_PASSWORD + '" \
        } \
      } \
    ] \
  }',

  CRYPTO_KEY: 'ibmwatson-nlc-groundtruth-cryptkey',

  SESSION_TIMEOUT: 86400

};
