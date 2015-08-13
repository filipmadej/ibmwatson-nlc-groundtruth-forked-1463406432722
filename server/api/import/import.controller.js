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
