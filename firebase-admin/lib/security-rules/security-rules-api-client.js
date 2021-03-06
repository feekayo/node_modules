/*! firebase-admin v8.6.0 */
"use strict";
/*!
 * Copyright 2019 Google Inc.
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
var security_rules_utils_1 = require("./security-rules-utils");
var validator = require("../utils/validator");
var RULES_V1_API = 'https://firebaserules.googleapis.com/v1';
/**
 * Class that facilitates sending requests to the Firebase security rules backend API.
 *
 * @private
 */
var SecurityRulesApiClient = /** @class */ (function () {
    function SecurityRulesApiClient(httpClient, projectId) {
        this.httpClient = httpClient;
        if (!validator.isNonNullObject(httpClient)) {
            throw new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'HttpClient must be a non-null object.');
        }
        if (!validator.isNonEmptyString(projectId)) {
            throw new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Failed to determine project ID. Initialize the SDK with service account credentials, or '
                + 'set project ID as an app option. Alternatively, set the GOOGLE_CLOUD_PROJECT '
                + 'environment variable.');
        }
        this.projectIdPrefix = "projects/" + projectId;
        this.url = RULES_V1_API + "/" + this.projectIdPrefix;
    }
    SecurityRulesApiClient.prototype.getRuleset = function (name) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            return _this.getRulesetName(name);
        })
            .then(function (rulesetName) {
            return _this.getResource(rulesetName);
        });
    };
    SecurityRulesApiClient.prototype.createRuleset = function (ruleset) {
        if (!validator.isNonNullObject(ruleset) ||
            !validator.isNonNullObject(ruleset.source) ||
            !validator.isNonEmptyArray(ruleset.source.files)) {
            var err = new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Invalid rules content.');
            return Promise.reject(err);
        }
        for (var _i = 0, _a = ruleset.source.files; _i < _a.length; _i++) {
            var rf = _a[_i];
            if (!validator.isNonNullObject(rf) ||
                !validator.isNonEmptyString(rf.name) ||
                !validator.isNonEmptyString(rf.content)) {
                var err = new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', "Invalid rules file argument: " + JSON.stringify(rf));
                return Promise.reject(err);
            }
        }
        var request = {
            method: 'POST',
            url: this.url + "/rulesets",
            data: ruleset,
        };
        return this.sendRequest(request);
    };
    SecurityRulesApiClient.prototype.deleteRuleset = function (name) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            return _this.getRulesetName(name);
        })
            .then(function (rulesetName) {
            var request = {
                method: 'DELETE',
                url: _this.url + "/" + rulesetName,
            };
            return _this.sendRequest(request);
        });
    };
    SecurityRulesApiClient.prototype.listRulesets = function (pageSize, pageToken) {
        if (pageSize === void 0) { pageSize = 100; }
        if (!validator.isNumber(pageSize)) {
            var err = new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Invalid page size.');
            return Promise.reject(err);
        }
        if (pageSize < 1 || pageSize > 100) {
            var err = new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Page size must be between 1 and 100.');
            return Promise.reject(err);
        }
        if (typeof pageToken !== 'undefined' && !validator.isNonEmptyString(pageToken)) {
            var err = new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Next page token must be a non-empty string.');
            return Promise.reject(err);
        }
        var data = {
            pageSize: pageSize,
            pageToken: pageToken,
        };
        if (!pageToken) {
            delete data.pageToken;
        }
        var request = {
            method: 'GET',
            url: this.url + "/rulesets",
            data: data,
        };
        return this.sendRequest(request);
    };
    SecurityRulesApiClient.prototype.getRelease = function (name) {
        return this.getResource("releases/" + name);
    };
    SecurityRulesApiClient.prototype.updateRelease = function (name, rulesetName) {
        var data = {
            release: this.getReleaseDescription(name, rulesetName),
        };
        var request = {
            method: 'PATCH',
            url: this.url + "/releases/" + name,
            data: data,
        };
        return this.sendRequest(request);
    };
    /**
     * Gets the specified resource from the rules API. Resource names must be the short names without project
     * ID prefix (e.g. `rulesets/ruleset-name`).
     *
     * @param {string} name Full qualified name of the resource to get.
     * @returns {Promise<T>} A promise that fulfills with the resource.
     */
    SecurityRulesApiClient.prototype.getResource = function (name) {
        var request = {
            method: 'GET',
            url: this.url + "/" + name,
        };
        return this.sendRequest(request);
    };
    SecurityRulesApiClient.prototype.getReleaseDescription = function (name, rulesetName) {
        return {
            name: this.projectIdPrefix + "/releases/" + name,
            rulesetName: this.projectIdPrefix + "/" + this.getRulesetName(rulesetName),
        };
    };
    SecurityRulesApiClient.prototype.getRulesetName = function (name) {
        if (!validator.isNonEmptyString(name)) {
            throw new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Ruleset name must be a non-empty string.');
        }
        if (name.indexOf('/') !== -1) {
            throw new security_rules_utils_1.FirebaseSecurityRulesError('invalid-argument', 'Ruleset name must not contain any "/" characters.');
        }
        return "rulesets/" + name;
    };
    SecurityRulesApiClient.prototype.sendRequest = function (request) {
        var _this = this;
        return this.httpClient.send(request)
            .then(function (resp) {
            return resp.data;
        })
            .catch(function (err) {
            throw _this.toFirebaseError(err);
        });
    };
    SecurityRulesApiClient.prototype.toFirebaseError = function (err) {
        if (err instanceof error_1.PrefixedFirebaseError) {
            return err;
        }
        var response = err.response;
        if (!response.isJson()) {
            return new security_rules_utils_1.FirebaseSecurityRulesError('unknown-error', "Unexpected response with status: " + response.status + " and body: " + response.text);
        }
        var error = response.data.error || {};
        var code = ERROR_CODE_MAPPING[error.status] || 'unknown-error';
        var message = error.message || "Unknown server error: " + response.text;
        return new security_rules_utils_1.FirebaseSecurityRulesError(code, message);
    };
    return SecurityRulesApiClient;
}());
exports.SecurityRulesApiClient = SecurityRulesApiClient;
var ERROR_CODE_MAPPING = {
    INVALID_ARGUMENT: 'invalid-argument',
    NOT_FOUND: 'not-found',
    RESOURCE_EXHAUSTED: 'resource-exhausted',
    UNAUTHENTICATED: 'authentication-error',
    UNKNOWN: 'unknown-error',
};
