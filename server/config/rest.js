'use strict';

function hideImplementationDetails (object) {
    if (object._id) {
        object.id = object._id;
        delete object._id;
    }
    delete object._rev;
    delete object.schema;
    delete object.tenant;
    delete object.password; // For profile objects
    return object;
}

function sanitizeMetadata (value) {
    if (value && (value.value || value.metadata) ) {

        var patch = {
            value : value.value,
            metadata : value.metadata
        };

        return patch;
    }

    return null;
}


module.exports = {
  hideImplementationDetails: hideImplementationDetails,
  sanitizeMetadata: sanitizeMetadata
};