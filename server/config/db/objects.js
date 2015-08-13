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
 * Creates and manipulates documents for storing in Cloudant.
 *
 *  Expected schemas:
 *
 *    classes
 *      {
 *          _id : <id of the class>,
 *          _rev : <version of the class>,
 *          schema : 'class',
 *          tenant : <ID of the tenant the class is in>,
 *          name : <class name>,
 *          description : <short description of class>
 *      }
 *
 *    texts
 *      {
 *          _id : <id of the text>,
 *          _rev : <version of the text>,
 *          schema : 'text',
 *          tenant : <ID of the tenant the text is in>,
 *          value : <text value>,
 *          classes : [<class ID>...]
 *      }
 *
 *
 *
 * @module ibmwatson-nlc-store/lib/db/objects
 * @author Andy Stoneberg
 */

// external dependencies
var uuid = require('node-uuid');

// ----------------------------------------------------------
//  Prepare objects for storing as a Cloudant document
// ----------------------------------------------------------


/**
 * Creates an object to represent a class for storing in Cloudant.
 *
 * @param {String} tenant - the tenant to store the class in
 * @param {Object} attrs - attributes of the class to store
 * @returns {Object} class object
 */
module.exports.prepareClassInfo = function prepareClassInfo (tenant, attrs) {
    var classification = {
        _id : attrs.id ? attrs.id : uuid.v1(),
        tenant : tenant,
        schema : 'class',
        name : attrs.name,
        description : attrs.description
    };

    return classification;
};

/**
 * Creates an object to represent a text for storing in Cloudant.
 *
 * @param {String} tenant - the tenant to store the text in
 * @param {Object} attrs - attributes of the text to store
 * @returns {Object} text object
 */
module.exports.prepareTextInfo = function prepareTextInfo (tenant, attrs) {
    var text = {
        _id : attrs.id ? attrs.id : uuid.v1(),
        tenant : tenant,
        schema : 'text',
        value : attrs.value
    };

    if (attrs.classes) {
        text.classes = attrs.classes;
    }

    return text;
};

/**
 * Creates an object to represent a profile for storing in Cloudant.
 *
 * @param {Object} attrs - attributes of the profile to store
 * @returns {Object} profile object
 */
module.exports.prepareProfileInfo = function prepareProfileInfo (attrs) {

    var profile = {
        _id : attrs.id ? attrs.id : uuid.v1(),
        schema : 'profile',
        username : attrs.username
    };

    return profile;
};
