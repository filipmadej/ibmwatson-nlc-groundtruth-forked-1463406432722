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
