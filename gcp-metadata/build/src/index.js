"use strict";
/**
 * Copyright 2018 Google LLC
 *
 * Distributed under MIT license.
 * See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
const gaxios_1 = require("gaxios");
const jsonBigint = require('json-bigint');
exports.HOST_ADDRESS = 'http://169.254.169.254';
exports.BASE_PATH = '/computeMetadata/v1';
exports.BASE_URL = exports.HOST_ADDRESS + exports.BASE_PATH;
exports.SECONDARY_HOST_ADDRESS = 'http://metadata.google.internal.';
exports.SECONDARY_BASE_URL = exports.SECONDARY_HOST_ADDRESS + exports.BASE_PATH;
exports.HEADER_NAME = 'Metadata-Flavor';
exports.HEADER_VALUE = 'Google';
exports.HEADERS = Object.freeze({ [exports.HEADER_NAME]: exports.HEADER_VALUE });
// Accepts an options object passed from the user to the API. In previous
// versions of the API, it referred to a `Request` or an `Axios` request
// options object.  Now it refers to an object with very limited property
// names. This is here to help ensure users don't pass invalid options when
// they  upgrade from 0.4 to 0.5 to 0.8.
function validate(options) {
    Object.keys(options).forEach(key => {
        switch (key) {
            case 'params':
            case 'property':
            case 'headers':
                break;
            case 'qs':
                throw new Error(`'qs' is not a valid configuration option. Please use 'params' instead.`);
            default:
                throw new Error(`'${key}' is not a valid configuration option.`);
        }
    });
}
async function metadataAccessor(type, options, noResponseRetries = 3, fastFail = false) {
    options = options || {};
    if (typeof options === 'string') {
        options = { property: options };
    }
    let property = '';
    if (typeof options === 'object' && options.property) {
        property = '/' + options.property;
    }
    validate(options);
    try {
        const requestMethod = fastFail ? fastFailMetadataRequest : gaxios_1.request;
        const res = await requestMethod({
            url: `${exports.BASE_URL}/${type}${property}`,
            headers: Object.assign({}, exports.HEADERS, options.headers),
            retryConfig: { noResponseRetries },
            params: options.params,
            responseType: 'text',
            timeout: 3000,
        });
        // NOTE: node.js converts all incoming headers to lower case.
        if (res.headers[exports.HEADER_NAME.toLowerCase()] !== exports.HEADER_VALUE) {
            throw new Error(`Invalid response from metadata service: incorrect ${exports.HEADER_NAME} header.`);
        }
        else if (!res.data) {
            throw new Error('Invalid response from the metadata service');
        }
        if (typeof res.data === 'string') {
            try {
                return jsonBigint.parse(res.data);
            }
            catch (_a) {
                /* ignore */
            }
        }
        return res.data;
    }
    catch (e) {
        if (e.response && e.response.status !== 200) {
            e.message = `Unsuccessful response status code. ${e.message}`;
        }
        throw e;
    }
}
async function fastFailMetadataRequest(options) {
    const secondaryOptions = Object.assign(Object.assign({}, options), { url: options.url.replace(exports.BASE_URL, exports.SECONDARY_BASE_URL) });
    return Promise.race([gaxios_1.request(options), gaxios_1.request(secondaryOptions)]);
}
// tslint:disable-next-line no-any
function instance(options) {
    return metadataAccessor('instance', options);
}
exports.instance = instance;
// tslint:disable-next-line no-any
function project(options) {
    return metadataAccessor('project', options);
}
exports.project = project;
/**
 * Determine if the metadata server is currently available.
 */
async function isAvailable() {
    try {
        // Attempt to read instance metadata. As configured, this will
        // retry 3 times if there is a valid response, and fail fast
        // if there is an ETIMEDOUT or ENOTFOUND error.
        await metadataAccessor('instance', undefined, 0, true);
        return true;
    }
    catch (err) {
        if (err.type === 'request-timeout') {
            // If running in a GCP environment, metadata endpoint should return
            // within ms.
            return false;
        }
        else if (err.code &&
            (err.code === 'ENOTFOUND' || err.code === 'ENOENT')) {
            // Failure to resolve the metadata service means that it is not available.
            return false;
        }
        // Throw unexpected errors.
        throw err;
    }
}
exports.isAvailable = isAvailable;
//# sourceMappingURL=index.js.map