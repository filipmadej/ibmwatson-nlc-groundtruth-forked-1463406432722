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

angular.module('config', [])
  .constant('endpoints', {
    'auth': '/api/authenticate',
    'texts': '/api',
    'classes': '/api',
    'import': '/api',
    'classifier': '/api',
    'content': '/api',
    'versions': 'https://ibmwatson-nlc-status.mybluemix.net/api/v1/versions'
  })
  .constant('versionInfo', {
    'version': '0.0.2',
    'state': 'beta',
    'scope': 'Beta Update 1',
    'download': 'https://hub.jazz.net/project/wdctools/ibmwatson-nlc-groundtruth'
  });
