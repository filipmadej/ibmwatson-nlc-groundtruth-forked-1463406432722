# ibmwatson-nlc-groundtruth

## Overview

This tool is a combination of the ibmwatson-nlc-store and ibmwatson-qa-groundtruth-ui. It is intended as a standalone application that can be used to configure a Natural Language Classifier Service instance.

## Environment prereqs
- Cloudant
- Natural Language Classifier

## Usage
-------
Locally
-------
```
npm install
bower install
grunt serve
```
-------
In production mode
-------
```
npm install
bower install
grunt
cd dist
NODE_ENV=production node server/app.js
```
-------

## Trace/debug
```
$ tail -f bunyan.log | bunyan
```

## Outstanding Items

* Fix UI Unit Tests (inherited from ibmwatson-qa-groundtruth-ui)
* Port Database Tests
* Remove Profiles from Database
* Secure Rest API
* Complete Securing UI States
* Check that app is bound to classifier on startup
* Replace ibmwatson- shared library code
* Normalise access to cloudfoundry variables
* Move images, fonts and assets to a standalone website (i.e. not part of this app)
* Improve test coverage
* Code structure