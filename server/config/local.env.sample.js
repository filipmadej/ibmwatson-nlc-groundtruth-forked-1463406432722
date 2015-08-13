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

module.exports = {

  SESSION_SECRET: 'ibmwatsonqagroundtruthui-secret',

  COOKIE_SECRET: 'ibmwatsonqagroundtruthui-cookie',

  // Control debug level for modules using visionmedia/debug
  DEBUG: '',

  // A Json object containing service configuration. You will need configuration
  // for a cloudantNoSQLDB called ibmwatson-qa-cloudant
  // and a natural_language_classifier called ibmwatson-nlc-classifier
  VCAP_SERVICES: '{ \
     "cloudantNoSQLDB": [ \
        { \
           "name": "ibmwatson-qa-cloudant", \
           "label": "cloudantNoSQLDB", \
           "plan": "Shared", \
           "credentials": { \
              "username": "cloudantuser", \
              "password": "cloudantpassword", \
              "host": "1e07238a-f8f4-4f11-8d81-99931f9c9213-bluemix.cloudant.com", \
              "port": 443, \
              "url": "https://cloudantuser:cloudantpassword@1e07238a-f8f4-4f11-8d81-99931f9c9213-bluemix.cloudant.com" \
            } \
        } \
     ],"natural_language_classifier": [ \
        { \
           "name": "ibmwatson-nlc-classifier", \
           "label": "natural_language_classifier", \
           "plan": "beta", \
           "credentials": { \
              "url": "https://gateway.watsonplatform.net/natural-language-classifier-beta/api", \
              "username": "b1acf55a-ae19-49af-939a-9ed3d5bda6ab", \
              "password": "EYRqGOthx1Id" \
           } \
        } \
     ] \
   }'
};
