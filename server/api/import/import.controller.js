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

var csv = require('fast-csv');

exports.importCsv = function importCsv (req, res) {
  var result = [];

  csv.fromString(req.body, {headers : false, ignoreEmpty : true})
    .transform(function format (data) {
    var text = data.shift();
    var classes = [];
    for (var i = 0, len = data.length; i < len; i++) {
      if (data[i] !== '') {
        classes.push(data[i]);
      }
    }
    return {text : text, classes : classes};
  })
    .on('data', function onData (data) {
    result.push(data);
  })
    .on('end', function onEnd () {
    return res.send(result);
  });
};
