"use strict";
/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const validate_1 = require("./validate");
/*! The Firestore library version */
let libVersion;
/*! The external function used to emit logs. */
let logFunction = (msg) => { };
/**
 * Log function to use for debug output. By default, we don't perform any
 * logging.
 *
 * @private
 */
function logger(methodName, requestTag, logMessage, ...additionalArgs) {
    requestTag = requestTag || '#####';
    const formattedMessage = util.format(logMessage, ...additionalArgs);
    const time = new Date().toISOString();
    logFunction(`Firestore (${libVersion}) ${time} ${requestTag} [${methodName}]: ` +
        formattedMessage);
}
exports.logger = logger;
/**
 * Sets the log function for all active Firestore instances.
 */
function setLogFunction(logger) {
    validate_1.validateFunction('logger', logger);
    logFunction = logger;
}
exports.setLogFunction = setLogFunction;
/**
 * Sets the log function for all active Firestore instances.
 *
 * @private
 */
function setLibVersion(version) {
    libVersion = version;
}
exports.setLibVersion = setLibVersion;
//# sourceMappingURL=logger.js.map