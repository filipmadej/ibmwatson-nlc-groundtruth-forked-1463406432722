# ibmwatson-nlc-groundtruth

## Overview

This tool is a standalone application that can be used to configure a Natural Language Classifier Service instance.

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

## Try

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://hub.jazz.net/git/wdctools/ibmwatson-nlc-groundtruth)

