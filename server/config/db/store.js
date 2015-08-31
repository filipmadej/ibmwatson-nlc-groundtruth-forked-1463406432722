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
/* eslint no-underscore-dangle:0 */

/**
 * Main module for managing the database used to store the class store documents.
 *
 * @see db/objects for definitions of the objects that will be stored.
 * @author Dale Lane
 * @module server/api/config/db/store
 */

// core dependencis
var util = require('util');

// external dependencies
var _ = require('lodash');
var async = require('async');
var makeArray = require('make-array');
// db module dependencies
var cloudant = require('../../components/cloudant');
var dbdesigns = require('./designs');
var dberrors = require('./errors');
var dbfetch = require('./fetch');
var dbobjects = require('./objects');
var dbviews = require('./views');
var dbhandlers = require('./updatehandlers');
var deleteall = require('./deletes');
// local dependencies
var log = require('../log');

var db;

// Convenient reference to database names
var nlcstore = 'nlcstore';


module.exports.start = function start (callback) {

  log.debug('Connecting to cloudant');
  cloudant(nlcstore, dbdesigns, function storeDbHandle (err, dbhandle) {
    db = dbhandle;
    callback(err);
  });

};

module.exports.stop = function stop () {
  log.debug('Stopping');
  db = null;
};

function getClassByName (tenant, name, callback) {
  dbviews.getClassByName(db, tenant, name, callback);
}

function checkIfClassExists (tenant, name, callback) {
  getClassByName(tenant, name, function handleExistCheck (err, existing) {
    if (err && err.error === dberrors.NOT_FOUND) {
      return callback(null, null);
    } else if (err) {
      return callback(err);
    } else {
      return callback(null, existing);
    }
  });
}

/**
 * Creates a new class.
 *
 *  This will store a new document to represent the class.
 *
 * @param {String} tenant - ID of the tenant to store the class in
 * @param {Object} attrs - attributes of the class to store
 * @param {Function} callback - callback(err, class) - called once complete
 * @returns {void}
 */
module.exports.createClass = function createClass (tenant, attrs, callback) {

  // check for required parameter
  if (!attrs.name) {
    return callback(dberrors.missingrequired('Missing required class name'));
  }

  async.waterfall([
    function uniqueCheck (next) {
      checkIfClassExists(tenant, attrs.name, function handleExisting (err, result) {
        if (result) {
          return next(dberrors.nonunique(util.format('Class [%s] already exists', attrs.name)));
        }

        return next(err);
      });
    },
    function doCreate (next) {
      // prepare object for storing
      var classification = dbobjects.prepareClassInfo(tenant, attrs);

      db.insert(classification, function checkResponse (err, docstatus) {
        if (err) {
          return next(err);
        }

        // store the rev to return to the caller
        classification._rev = docstatus.rev;

        // return the stored question
        next(null, classification);

      });
    }], callback)

};


function getClass (tenant, id, callback) {
  dbfetch.getClass(db, tenant, id, callback);
}

/**
 * Replaces an existing class.
 *
 *  This will replace the document currently stored for the given class.
 *
 * @param {String} tenant - ID of the tenant to store the class in
 * @param {Object} attrs - attributes of the class to store
 * @param {String} rev - version of the class to replace, or '*' as a wildcard
 * @param {Function} callback - callback(err, class) - called once complete
 * @returns {void}
 */
module.exports.replaceClass = function replaceClass (tenant, attrs, rev, callback) {

  // check for required parameter
  if (!attrs.name) {
    return callback(dberrors.missingrequired('Missing required class name'));
  }

  // prepare object for storing
  var classification = dbobjects.prepareClassInfo(tenant, attrs);

  async.waterfall([
    function getCurrentClass (next) {
      getClass(tenant, classification._id, function getCallback (err, current) {
        if (err) {
          return next(err);
        }

        // check that we have the right version (or a wildcard)
        //  before trying to do the delete
        if (rev === '*') {
          rev = current._rev;
        } else if (rev !== current._rev) {
          return next(dberrors.rev());
        }

        classification._rev = rev;

        next();
      });
    },
    function uniqueCheck (next) {
      checkIfClassExists(tenant, classification.name, function handleExisting (err, result) {
        if (result && result.id !== classification._id) {
          return next(dberrors.nonunique(util.format('Class [%s] already exists', classification.name)));
        }

        return next(err);
      });
    },
    function replaceClass (next) {
      db.insert(classification, function checkResponse (err, docstatus) {
        if (err) {
          return next(err);
        }

        // store the rev to return to the caller
        classification._rev = docstatus.rev;

        // return the stored question
        next(null, classification);

      });
    }], callback);
};

function updateReferencesBatch (db, tenant, classid, callback) {
  var options = {
    skip : 0,
    limit : 100,
    class : classid
  };

  async.waterfall([
    function getTexts (next) {
      dbfetch.getTextsWithClass(db, tenant, options, next);
    },
    function prepareUpdateRequest (texts, next) {
      var docs = texts.map(function update (doc) {
        var idx = doc.classes.indexOf(classid);
        if (idx > -1) {
          doc.classes.splice(idx, 1);
        }
        return doc;
      });
      next(null, { docs : docs });
    },
    function submitUpdate (req, next) {
      if (req.docs && req.docs.length > 0) {
        return db.bulk(req, function checkDeleteResponse (err, results) {
          next(err, results);
        });
      }

      return next(null, null);
    },
    function checkForMore (results, next) {
      var count = makeArray(results).length;
      next(null, count === options.limit);
    }
  ], callback);
}

function runReferenceUpdate (db, tenant, classid, callback) {
  updateReferencesBatch(db, tenant, classid, function nextStep (err, moretoupdate) {
    if (err) {
      return callback(err);
    }
    if (moretoupdate) {
      return runReferenceUpdate(db, tenant, classid, callback);
    }

    return callback();
  });
}

/**
 * Deletes an existing class.
 *
 * @param {String} tenant - ID of the tenant to delete the class from
 * @param {String} id - ID of the class to delete
 * @param {String} rev - version of the class to delete, or '*' as a wildcard
 * @param {Function} callback - called once complete
 * @returns {void}
 */
module.exports.deleteClass = function deleteClass (tenant, id, rev, callback) {

  async.waterfall([
    function getCurrentClass (next) {
      getClass(tenant, id, function getCallback (err, classification) {
        if (err) {
          return callback(err);
        }

        // check that we have the right version (or a wildcard)
        //  before trying to do the delete
        if (rev === '*') {
          rev = classification._rev;
        } else if (rev !== classification._rev) {
          return callback(dberrors.rev());
        }

        next(null, classification);
      });
    },
    function deleteClass (classification, next) {
      db.destroy(id, classification._rev, next);
    },
    function removeReferences (status, resp, next) {
      runReferenceUpdate(db, tenant, id, next);
    }], callback);
};

module.exports.getClasses = function getClasses (tenant, options, callback) {
  dbfetch.getClasses(db, tenant, options, callback);
};
module.exports.countClasses = function countClasses (tenant, callback) {
  dbviews.countClasses(db, tenant, callback);
};
module.exports.getClass = getClass;


function getTextByValue (tenant, value, callback) {
  dbviews.getTextByValue(db, tenant, value, callback);
}

function checkIfTextExists (tenant, value, callback) {
  getTextByValue(tenant, value, function handleExistCheck (err, existing) {
    if (err && err.error === dberrors.NOT_FOUND) {
      return callback(null, null);
    } else if (err) {
      return callback(err);
    } else {
      return callback(null, existing);
    }
  });
}

/**
 * Creates a new text.
 *
 *  This will store a new document to represent the text.
 *
 * @param {String} tenant - ID of the tenant to store the class in
 * @param {Object} attrs - attributes of the text to store
 * @param {Function} callback - callback(err, text) - called once complete
 * @returns {void}
 */
module.exports.createText = function createText (tenant, attrs, callback) {

  // check for required parameter
  if (!attrs.value) {
    return callback(dberrors.missingrequired('Missing required text value'));
  }

  async.waterfall([
    function uniqueCheck (next) {
      checkIfTextExists(tenant, attrs.value, function handleExisting (err, result) {
        if (result) {
          return next(dberrors.nonunique(util.format('Text [%s] already exists', attrs.value)));
        }

        return next(err);
      });
    },
    function doCreate (next) {

      var text = dbobjects.prepareTextInfo(tenant, attrs);

      db.insert(text, function checkResponse (err, docstatus) {
        if (err) {
          return callback(err);
        }

        // store the rev to return to the caller
        text._rev = docstatus.rev;

        // return the stored question
        callback(null, text);

      });

    }], callback)

};

function getText (tenant, id, callback) {
  dbfetch.getText(db, tenant, id, callback);
}

/**
 * Adds classes to an existing text (if that class is not already present on the text).
 *
 * @param {String} tenant - ID of the tenant the owns the data
 * @param {String} text - ID of the text to update
 * @param {String[]} classes - IDs of the classes to add
 * @param {Function} callback - called once complete
 * @returns {void}
 */
function addClassesToText (tenant, text, classes, callback) {

  log.debug({
    text : text,
    classes : classes
  }, 'Adding classes to text');

  dbhandlers.addClassesToText(db, tenant, text, makeArray(classes), callback);

}

module.exports.addClassesToText = addClassesToText;

/**
 * Removes classes from an existing text (if that class is present on the text).
 *
 *
 * @param {String} tenant - ID of the tenant the owns the data
 * @param {String} text - ID of the text to update
 * @param {String[]} classes - IDs of the classes to remove
 * @param {Function} callback - called once complete
 * @returns {void}
 */
function removeClassesFromText (tenant, text, classes, callback) {

  log.debug({
    text : text,
    classes : classes
  }, 'Removing classes from text');

  dbhandlers.removeClassesFromText(db, tenant, text, makeArray(classes), callback);
}

module.exports.removeClassesFromText = removeClassesFromText;

module.exports.updateTextMetadata = function updateTextMetadata (tenant, id, metadata, callback) {

  async.waterfall([
    function uniqueCheck (next) {
      checkIfTextExists(tenant, metadata.value, function handleExisting (err, result) {
        if (result && result.id !== id) {
          return next(dberrors.nonunique(util.format('Text [%s] already exists', metadata.value)));
        }

        return next(err);
      });
    },
    function doPatch (next) {
      dbhandlers.updateTextMetadata(db, tenant, id, metadata, next);
    }], callback)


};

/**
 * Deletes an existing text.
 *
 * @param {String} tenant - ID of the tenant to delete the text from
 * @param {String} id - ID of the text to delete
 * @param {String} rev - version of the text to delete, or '*' as a wildcard
 * @param {Function} callback - called once complete
 * @returns {void}
 */
module.exports.deleteText = function deleteText (tenant, id, rev, callback) {

  async.waterfall([
    function getCurrentText (next) {
      getText(tenant, id, function getCallback (err, text) {
        if (err) {
          return callback(err);
        }

        // check that we have the right version (or a wildcard)
        //  before trying to do the delete
        if (rev === '*') {
          rev = text._rev;
        } else if (rev !== text._rev) {
          return callback(dberrors.rev());
        }

        next(null, text);
      });
    },
    function deleteText (text, next) {
      db.destroy(text._id, text._rev, next);
    }], callback);
};

module.exports.getTexts = function getTexts (tenant, options, callback) {
  dbfetch.getTexts(db, tenant, options, callback);
};
module.exports.countTexts = function countTexts (tenant, callback) {
  dbviews.countTexts(db, tenant, callback);
};
module.exports.getText = getText;

module.exports.deleteTenant = function deleteTenant (tenant, callback) {
  deleteall(db, tenant, callback);
};


function handleImportClassEntries (tenant, classes, callback) {
  if (makeArray(classes).length > 0) {
    return async.waterfall([
      function lookupClasses (next) {
        dbviews.lookupClassesByName(db, tenant, classes, next);
      },
      function processClasses (existingClasses, next) {
        existingClasses = makeArray(existingClasses);
        var newClasses = classes;
        if (existingClasses.length > 0) {
          newClasses = classes.filter(function find (elem) {
            return !(_.find(existingClasses, function exist (existing) {
              return elem === existing.key[1]
            }));
          });
        }

        async.mapLimit(newClasses, 10, function createNew (classname, nextclass) {
          var classification = dbobjects.prepareClassInfo(tenant, {name : classname});
          db.insert(classification, function checkResponse (err, docstatus) {
            if (err) {
              return nextclass(null, {name : classname, error : err});
            }

            return nextclass(null, {id : classification._id, name : classification.name, created : true});

          });
        }, function handleResults (err, results) {
          var classEntries = existingClasses.map(function transform (elem) {
            return {id : elem.id, name : elem.key[1], created : false}
          }).concat(results);

          next(err, classEntries);
        });
      }], callback);
  } else {
    callback(null, []);
  }
}

function initImportEntry (tenant, entry, callback) {
  async.parallel([
    function checkText (done) {
      checkIfTextExists(tenant, entry.text, done);
    },
    function handleClasses (done) {
      handleImportClassEntries(tenant, entry.classes, done)
    }], callback);
}

function handleExistingTextEntry (tenant, text, classes, callback) {

    var classesDelta = classes.filter(function filterNew (elem) {
      return (makeArray(text.classes).indexOf(elem.id) === -1);
    });

    var result = {
      id : text.id,
      value : text.value,
      created : false,
      classes : classesDelta
    };

    var deltaArray = classesDelta.map(function convert (delta) {
      return delta.id;
    });

    dbhandlers.addClassesToText(db, tenant, text.id, deltaArray, function handleUpdate (err, result) {
      if (err) {
        result.error = err;
      }

      callback(null, result);
    });
}

function handleNewTextEntry (tenant, value, classes, callback) {

    var classArray = classes.map(function convert (elem) {
      return elem.id;
    });

    var text = dbobjects.prepareTextInfo(tenant, {value : value, classes : classArray});

    var result = {
      id : text._id,
      value : text.value,
      created : true,
      classes : classes
    };

    db.insert(text, function checkResponse (err, docstatus) {
      if (err) {
        result.error = err;
      }

      return callback(null, result);

    });
}
/**
 * Processes a specific entry during import.  Ensures all referenced entities
 * exist and are properly correlated.
 *
 * @param {String} tenant - ID of the tenant to delete the text from
 * @param {Object} entry - import entry
 * @param {Function} callback - called once complete
 * @returns {void}
 */
module.exports.processImportEntry = function processImportEntry (tenant, entry, callback) {

  var result = {};

  var requestedClasses = makeArray(entry.classes);

  async.waterfall([
    function init (next) {
      initImportEntry(tenant, entry, function handleResults (err, results) {
        //results[0] === text ? null
        // results[1] == classes formatted for response
        result.classes = results[1].filter(function filterNew (elem) {
          return elem.created;
        });
        next(err, results[0], results[1]);
      });
    },
    function handleText (text, classes, next) {

      var handleTextResult = function handleResult (err, textResult) {
        if (err) {
          textResult.error = err;
        }
        result.text = textResult;
        next();
      };

      if (text) {
        return handleExistingTextEntry (tenant, text, classes, handleTextResult);
      } else {
        return handleNewTextEntry (tenant, entry.text, classes, handleTextResult);
      }
    }], function handleResult (err) {
      if (err) {
        result.error = err;
      }

    return callback(null, result);

  });
};
