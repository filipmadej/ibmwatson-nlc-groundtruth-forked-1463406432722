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

describe('Service: versions', function() {

  var CURRENT = 'current';
  var DEVELOPMENT = 'development';
  var OLD = 'old';

  var testOldVersion = {
    'version': '0.0.0',
    'state': 'alpha',
    'scope': 'Initial Alpha',
    'download': 'https://hub.jazz.net/project/wdctools/ibmwatson-nlc-groundtruth'
  };

  var testCurrentVersion = {
    'version': '0.0.1',
    'state': 'beta',
    'scope': 'Initial Beta',
    'download': 'https://hub.jazz.net/project/wdctools/ibmwatson-nlc-groundtruth'
  };

  var testNewVersion = {
    'version': '0.0.2',
    'state': 'beta',
    'scope': 'Second Beta Release',
    'changes': 'Bug Fixes, stability improvements',
    'download': 'https://hub.jazz.net/project/wdctools/ibmwatson-nlc-groundtruth'
  };

  // load the service's module and mock $cookies
  beforeEach(module('ibmwatson-nlc-groundtruth-app', function($provide) {
    // Mock version info
    $provide.constant('versionInfo', testCurrentVersion);

  }));

  // Defer resolution of state transitions so we can test this in isolation
  beforeEach(module(function($urlRouterProvider) {
    $urlRouterProvider.deferIntercept();
  }));

  // instantiate service
  var versions, versionInfo, endpoints, $httpBackend;

  beforeEach(inject(function($injector) {

    versionInfo = $injector.get('versionInfo');

    versions = $injector.get('versions');

    endpoints = $injector.get('endpoints');

    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');

  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('should exist', function() {
    expect(!!versions).toBe(true);
    expect(typeof versions.getCurrent).toBe('function');
    expect(typeof versions.isCurrent).toBe('function');
  });

  describe('getCurrent', function() {

    it('should return the current version', function() {

      var returnedVersion = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testCurrentVersion]);

      runs(function() {
        versions.getCurrent().then(function(currentVersion) {
          returnedVersion = currentVersion;
        });
        $httpBackend.flush();

      });

      waitsFor(function() {
        return returnedVersion != null;
      }, runs(function() {
        expect(returnedVersion).not.toBeNull();
        expect(returnedVersion.version).toEqual(versionInfo.version);
      }));

    });

    it('should return the current version if it is new', function() {

      var returnedVersion = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testNewVersion]);

      runs(function() {
        versions.getCurrent().then(function(currentVersion) {
          returnedVersion = currentVersion;
        });

        $httpBackend.flush();
      });

      waitsFor(function() {
        return returnedVersion != null;
      }, runs(function() {
        expect(returnedVersion).not.toBeNull();
        expect(returnedVersion.version).not.toEqual(versionInfo.version);
      }));


    });

    it('should throw an error if the service response with an error', function(done) {

      var serviceError = null;

      $httpBackend.when('GET',endpoints.versions).respond(500);

      runs(function() {
        versions.getCurrent().then(function() {
          serviceError = false;
        }, function(err) {
          serviceError = true;
        });

        $httpBackend.flush();
      });

      waitsFor(function() {
        return serviceError != null;
      }, runs(function() {
        expect(serviceError).toEqual(true);

      }));

    });
  });

  describe('isCurrent', function() {

    it('should return true if this is the current version', function() {
      var isCurrent = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testCurrentVersion]);

      runs(function() {
        versions.isCurrent().then(function(result) {
          isCurrent = result;
        });
        $httpBackend.flush();
      });

      waitsFor(function() {
        return isCurrent !== null;
      }, runs(function() {
        expect(isCurrent).toEqual(true);
      }));
    });

    it('should return false if there is a newer version', function() {
      var isCurrent = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testNewVersion]);

      runs(function() {
        versions.isCurrent().then(function(result) {
          isCurrent = result;
        });
        $httpBackend.flush();
      });

      waitsFor(function() {
        return isCurrent !== null;
      }, runs(function() {
        expect(isCurrent).toEqual(false);
      }));
    });

    it('should throw an error if no versions are returned', function() {

      var serviceError = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, []);

      runs(function() {
        versions.isCurrent().then(function() {
          serviceError = false;
        }, function(err) {
          serviceError = true;
        });

        $httpBackend.flush();
      });

      waitsFor(function() {
        return serviceError !== null;
      }, runs(function() {
        expect(serviceError).toEqual(true);
      }));
    });

    it('should throw an error if the service response with an error', function(done) {

      var serviceError = null;

      $httpBackend.when('GET',endpoints.versions).respond(500);

      runs(function() {
        versions.isCurrent().then(function() {
          serviceError = false;
        }, function(err) {
          serviceError = true;
        });

        $httpBackend.flush();
      });

      waitsFor(function() {
        return serviceError != null;
      }, runs(function() {
        expect(serviceError).toEqual(true);

      }));

    });
  });

  describe('getStatus', function() {

    it('should return \'current\' if this is the current version', function() {
      var status = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testCurrentVersion]);

      runs(function() {
        versions.getStatus().then(function(result) {
          status = result;
        });
        $httpBackend.flush();
      });

      waitsFor(function() {
        return status !== null;
      }, runs(function() {
        expect(status).toBe(CURRENT);
      }));
    });

    it('should return \'old\' if there is a newer version', function() {
      var status = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testNewVersion]);

      runs(function() {
        versions.getStatus().then(function(result) {
          status = result;
        });
        $httpBackend.flush();
      });

      waitsFor(function() {
        return status !== null;
      }, runs(function() {
        expect(status).toBe(OLD);
      }));
    });

    it('should return \'development\' if the \'current\' version is older than this version', function() {
      var status = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, [testOldVersion]);

      runs(function() {
        versions.getStatus().then(function(result) {
          status = result;
        });
        $httpBackend.flush();
      });

      waitsFor(function() {
        return status !== null;
      }, runs(function() {
        expect(status).toBe(DEVELOPMENT);
      }));
    });

    it('should throw an error if no versions are returned', function() {

      var serviceError = null;

      $httpBackend.when('GET',endpoints.versions).respond(200, []);

      runs(function() {
        versions.getStatus().then(function() {
          serviceError = false;
        }, function(err) {
          serviceError = true;
        });

        $httpBackend.flush();
      });

      waitsFor(function() {
        return serviceError !== null;
      }, runs(function() {
        expect(serviceError).toEqual(true);
      }));
    });

    it('should throw an error if the service response with an error', function(done) {

      var serviceError = null;

      $httpBackend.when('GET',endpoints.versions).respond(500);

      runs(function() {
        versions.getStatus().then(function() {
          serviceError = false;
        }, function(err) {
          serviceError = true;
        });

        $httpBackend.flush();
      });

      waitsFor(function() {
        return serviceError != null;
      }, runs(function() {
        expect(serviceError).toEqual(true);

      }));

    });
  });

});
