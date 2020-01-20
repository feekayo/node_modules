/*! firebase-admin v8.6.0 */
"use strict";
/*!
 * Copyright 2018 Google Inc.
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
var error_1 = require("../utils/error");
var validator = require("../utils/validator");
var project_management_api_request_1 = require("./project-management-api-request");
var app_metadata_1 = require("./app-metadata");
var IosApp = /** @class */ (function () {
    function IosApp(appId, requestHandler) {
        this.appId = appId;
        this.requestHandler = requestHandler;
        if (!validator.isNonEmptyString(appId)) {
            throw new error_1.FirebaseProjectManagementError('invalid-argument', 'appId must be a non-empty string.');
        }
        this.resourceName = "projects/-/iosApps/" + appId;
    }
    IosApp.prototype.getMetadata = function () {
        return this.requestHandler.getResource(this.resourceName)
            .then(function (responseData) {
            project_management_api_request_1.assertServerResponse(validator.isNonNullObject(responseData), responseData, 'getMetadata()\'s responseData must be a non-null object.');
            var requiredFieldsList = ['name', 'appId', 'projectId', 'bundleId'];
            requiredFieldsList.forEach(function (requiredField) {
                project_management_api_request_1.assertServerResponse(validator.isNonEmptyString(responseData[requiredField]), responseData, "getMetadata()'s responseData." + requiredField + " must be a non-empty string.");
            });
            var metadata = {
                platform: app_metadata_1.AppPlatform.IOS,
                resourceName: responseData.name,
                appId: responseData.appId,
                displayName: responseData.displayName || null,
                projectId: responseData.projectId,
                bundleId: responseData.bundleId,
            };
            return metadata;
        });
    };
    IosApp.prototype.setDisplayName = function (newDisplayName) {
        return this.requestHandler.setDisplayName(this.resourceName, newDisplayName);
    };
    /**
     * @return {Promise<string>} A promise that resolves to a UTF-8 XML string, typically intended to
     *     be written to a plist file.
     */
    IosApp.prototype.getConfig = function () {
        return this.requestHandler.getConfig(this.resourceName)
            .then(function (responseData) {
            project_management_api_request_1.assertServerResponse(validator.isNonNullObject(responseData), responseData, 'getConfig()\'s responseData must be a non-null object.');
            var base64ConfigFileContents = responseData.configFileContents;
            project_management_api_request_1.assertServerResponse(validator.isBase64String(base64ConfigFileContents), responseData, "getConfig()'s responseData.configFileContents must be a base64 string.");
            return Buffer.from(base64ConfigFileContents, 'base64').toString('utf8');
        });
    };
    return IosApp;
}());
exports.IosApp = IosApp;
