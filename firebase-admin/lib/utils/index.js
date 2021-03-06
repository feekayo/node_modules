/*! firebase-admin v8.6.0 */
"use strict";
/*!
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var credential_1 = require("../auth/credential");
var validator = require("./validator");
/**
 * Renames properties on an object given a mapping from old to new property names.
 *
 * For example, this can be used to map underscore_cased properties to camelCase.
 *
 * @param {object} obj The object whose properties to rename.
 * @param {object} keyMap The mapping from old to new property names.
 */
function renameProperties(obj, keyMap) {
    Object.keys(keyMap).forEach(function (oldKey) {
        if (oldKey in obj) {
            var newKey = keyMap[oldKey];
            // The old key's value takes precedence over the new key's value.
            obj[newKey] = obj[oldKey];
            delete obj[oldKey];
        }
    });
}
exports.renameProperties = renameProperties;
/**
 * Defines a new read-only property directly on an object and returns the object.
 *
 * @param {object} obj The object on which to define the property.
 * @param {string} prop The name of the property to be defined or modified.
 * @param {any} value The value associated with the property.
 */
function addReadonlyGetter(obj, prop, value) {
    Object.defineProperty(obj, prop, {
        value: value,
        // Make this property read-only.
        writable: false,
        // Include this property during enumeration of obj's properties.
        enumerable: true,
    });
}
exports.addReadonlyGetter = addReadonlyGetter;
/**
 * Determines the Google Cloud project ID associated with a Firebase app by examining
 * the Firebase app options, credentials and the local environment in that order.
 *
 * @param {FirebaseApp} app A Firebase app to get the project ID from.
 *
 * @return {string} A project ID string or null.
 */
function getProjectId(app) {
    var options = app.options;
    if (validator.isNonEmptyString(options.projectId)) {
        return options.projectId;
    }
    var cert = credential_1.tryGetCertificate(options.credential);
    if (cert != null && validator.isNonEmptyString(cert.projectId)) {
        return cert.projectId;
    }
    var projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
    if (validator.isNonEmptyString(projectId)) {
        return projectId;
    }
    return null;
}
exports.getProjectId = getProjectId;
/**
 * Encodes data using web-safe-base64.
 *
 * @param {Buffer} data The raw data byte input.
 * @return {string} The base64-encoded result.
 */
function toWebSafeBase64(data) {
    return data.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
exports.toWebSafeBase64 = toWebSafeBase64;
/**
 * Formats a string of form 'project/{projectId}/{api}' and replaces
 * with corresponding arguments {projectId: '1234', api: 'resource'}
 * and returns output: 'project/1234/resource'.
 *
 * @param {string} str The original string where the param need to be
 *     replaced.
 * @param {object=} params The optional parameters to replace in the
 *     string.
 * @return {string} The resulting formatted string.
 */
function formatString(str, params) {
    var formatted = str;
    Object.keys(params || {}).forEach(function (key) {
        formatted = formatted.replace(new RegExp('{' + key + '}', 'g'), params[key]);
    });
    return formatted;
}
exports.formatString = formatString;
/**
 * Generates the update mask for the provided object.
 * Note this will ignore the last key with value undefined.
 *
 * @param {[key: string]: any} obj The object to generate the update mask for.
 * @return {Array<string>} The computed update mask list.
 */
function generateUpdateMask(obj) {
    var updateMask = [];
    if (!validator.isNonNullObject(obj)) {
        return updateMask;
    }
    var _loop_1 = function (key) {
        if (obj.hasOwnProperty(key) && typeof obj[key] !== 'undefined') {
            var maskList = generateUpdateMask(obj[key]);
            if (maskList.length > 0) {
                maskList.forEach(function (mask) {
                    updateMask.push(key + "." + mask);
                });
            }
            else {
                updateMask.push(key);
            }
        }
    };
    for (var key in obj) {
        _loop_1(key);
    }
    return updateMask;
}
exports.generateUpdateMask = generateUpdateMask;
