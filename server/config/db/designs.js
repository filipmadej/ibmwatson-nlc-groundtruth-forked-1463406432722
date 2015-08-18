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
/* eslint func-names: 0, no-undef: 0, block-scoped-var: 0, max-statements: 0, complexity: 0, max-depth: 0 */
/* jshint node:true */
/* globals emit*/

var classViews = {
    views : {
        class : {
            version : 1,
            map : function (doc) {
                if (doc.schema === 'class' && doc.tenant && doc.name) {
                    emit([doc.tenant, doc.name], doc._id);
                }
            },
            reduce : '_count'
        }
    }
};

var textViews = {
    views : {
        text : {
            version : 1,
            map : function (doc) {
                if (doc.schema === 'text' && doc.tenant && doc.value) {
                    emit([doc.tenant, doc.value], doc._id);
                }
            },
            reduce : '_count'
        },
        'by-class' : {
            version : 1,
            map : function (doc) {
                if (doc.schema === 'text' && doc.tenant && doc.classes) {
                    for (var i=0; i < doc.classes.length; i++) {
                        emit(doc.tenant, doc.classes[i], doc._id);
                    }
                }
            },
            reduce : '_count'
        }
    },
    updates : {
        version : 1,
        'add-classes' : function (doc, req) {
            if (!doc) {
                return [null, '{ \"error\" : \"not_found\", \"code\" : 404 }'];
            }

            if (doc.schema !== 'text') {
                return [null, '{ \"error\" : \"unexpected_object_type\", \"code\" : 400 }'];
            }

            var parameters = JSON.parse(req.body);

            var additions = parameters.classes;
            if (!additions) {
                return [null, '{ \"error\" : \"required_field_missing\", \"code\" : 400 }'];
            }

            if (!doc.classes) {
                doc.classes = [];
            }

            var classes = doc.classes;
            for (var i=0; i<additions.length; i++) {
                if (classes.indexOf(additions[i]) === -1) {
                    classes.push(additions[i]);
                }
            }

            return [doc, '{ \"ok\" : true }'];
        },
        'remove-classes' : function (doc, req) {
            if (!doc) {
                return [null, '{ \"error\" : \"not_found\", \"code\" : 404 }'];
            }

            if (doc.schema !== 'text') {
                return [null, '{ \"error\" : \"unexpected_object_type\", \"code\" : 400 }'];
            }

            var parameters = JSON.parse(req.body);

            var deletions = parameters.classes;
            if (!deletions) {
                return [null, '{ \"error\" : \"required_field_missing\", \"code\" : 400 }'];
            }

            var classes = doc.classes;
            if (classes) {
                for (var i=0; i<deletions.length; i++) {
                    var idx = classes.indexOf(deletions[i]);
                    if (idx !== -1) {
                        classes.splice(idx, 1);
                    }
                }
            }

            return [doc, '{ \"ok\" : true }'];
        },
        'update-metadata' : function (doc, req) {
            if (!doc) {
                return [null, '{ \"error\" : \"not_found\", \"code\" : 404 }'];
            }

            if (doc.schema !== 'text') {
                return [null, '{ \"error\" : \"unexpected_object_type\", \"code\" : 400 }'];
            }

            var parameters = JSON.parse(req.body);

            var metadata = parameters.metadata;
            if (!metadata) {
                return [null, '{ \"error\" : \"required_field_missing\", \"code\" : 400 }'];
            }

            Object.keys(metadata).forEach(function (attribute) {
                doc[attribute] = metadata[attribute];
            });

            return [doc, '{ \"ok\" : true }'];
        }
    }
};

var basicClassIndex = {
    index : {
        fields : ['tenant', 'schema', 'name']
    },
    name : 'search-class',
    type : 'json'
};

var basicTextIndex = {
    index : {
        fields : ['tenant', 'schema', 'value']
    },
    name : 'search-text',
    type : 'json'
};

var textWithClassIndex = {
    index : {
        fields : ['tenant', 'schema', 'value', 'classes']
    },
    name : 'search-text-with-class',
    type : 'json'
};


var tenantViews = {
    views : {
        tenant : {
            version : 1,
            map : function (doc) {
                if (doc.tenant) {
                    emit(doc.tenant, {_id : doc._id, _rev : doc._rev});
                }
            },
            reduce : '_count'
        }
    }
};

var profileViews = {
    views: {
        'by-username': {

          map: function (doc) {
            if (doc.schema === 'profile' && doc.username) {
                emit(doc.username, doc._id);
            }
        }
    }
  }
};

var basicProfileIndex = {
    index : {
        fields : ['schema', 'username']
    },
    version : 1,
    name : 'profile-search',
    type : 'json'
};

var classConfig = {
    name : 'class',
    ddocs : [classViews]
};

var classSearchConfig = {
    name : 'search-class',
    indexes : [basicClassIndex]
};

var textConfig = {
    name : 'text',
    ddocs : [textViews]
};

var textSearchConfig = {
    name : 'search-text',
    indexes : [basicTextIndex]
};

var textWithClassSearchConfig = {
    name : 'search-text-with-class',
    indexes : [textWithClassIndex]
};

var tenantConfig = {
    name : 'tenant',
    ddocs : [tenantViews]
};

var profileConfig = {
    name : 'profile',
    ddocs : [profileViews]
};

var profileSearchConfig = {
    name : 'search-profile',
    indexes : [basicProfileIndex]
};

module.exports = [tenantConfig, classConfig, classSearchConfig, textConfig, textSearchConfig, textWithClassSearchConfig, profileConfig, profileSearchConfig];
