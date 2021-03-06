"use strict";
// Copyright 2018, Google, LLC.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extend_1 = __importDefault(require("extend"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const querystring_1 = __importDefault(require("querystring"));
const stream_1 = __importDefault(require("stream"));
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
const isbrowser_1 = require("./isbrowser");
const retry_1 = require("./retry");
// tslint:disable no-any
const URL = isbrowser_1.isBrowser() ? window.URL : url_1.default.URL;
const fetch = isbrowser_1.isBrowser() ? window.fetch : node_fetch_1.default;
// tslint:disable-next-line variable-name
let HttpsProxyAgent;
// Figure out if we should be using a proxy. Only if it's required, load
// the https-proxy-agent module as it adds startup cost.
function loadProxy() {
    const proxy = process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        process.env.HTTP_PROXY ||
        process.env.http_proxy;
    if (proxy) {
        HttpsProxyAgent = require('https-proxy-agent');
    }
    return proxy;
}
loadProxy();
class Gaxios {
    /**
     * The Gaxios class is responsible for making HTTP requests.
     * @param defaults The default set of options to be used for this instance.
     */
    constructor(defaults) {
        this.agentCache = new Map();
        this.defaults = defaults || {};
    }
    /**
     * Perform an HTTP request with the given options.
     * @param opts Set of HTTP options that will be used for this HTTP request.
     */
    async request(opts = {}) {
        opts = this.validateOpts(opts);
        try {
            let translatedResponse;
            if (opts.adapter) {
                translatedResponse = await opts.adapter(opts);
            }
            else {
                const res = await fetch(opts.url, opts);
                const data = await this.getResponseData(opts, res);
                translatedResponse = this.translateResponse(opts, res, data);
            }
            if (!opts.validateStatus(translatedResponse.status)) {
                throw new common_1.GaxiosError(`Request failed with status code ${translatedResponse.status}`, opts, translatedResponse);
            }
            return translatedResponse;
        }
        catch (e) {
            const err = e;
            err.config = opts;
            const { shouldRetry, config } = await retry_1.getRetryConfig(e);
            if (shouldRetry && config) {
                err.config.retryConfig.currentRetryAttempt = config.retryConfig.currentRetryAttempt;
                return this.request(err.config);
            }
            throw err;
        }
    }
    async getResponseData(opts, res) {
        switch (opts.responseType) {
            case 'stream':
                return res.body;
            case 'json':
                let data = await res.text();
                try {
                    data = JSON.parse(data);
                }
                catch (e) { }
                return data;
            case 'arraybuffer':
                return res.arrayBuffer();
            case 'blob':
                return res.blob();
            default:
                return res.text();
        }
    }
    /**
     * Validates the options, and merges them with defaults.
     * @param opts The original options passed from the client.
     */
    validateOpts(options) {
        const opts = extend_1.default(true, {}, this.defaults, options);
        if (!opts.url) {
            throw new Error('URL is required.');
        }
        // baseUrl has been deprecated, remove in 2.0
        const baseUrl = opts.baseUrl || opts.baseURL;
        if (baseUrl) {
            opts.url = baseUrl + opts.url;
        }
        const parsedUrl = new URL(opts.url);
        opts.url = `${parsedUrl.origin}${parsedUrl.pathname}`;
        opts.params = extend_1.default(querystring_1.default.parse(parsedUrl.search.substr(1)), // removes leading ?
        opts.params);
        opts.paramsSerializer = opts.paramsSerializer || this.paramsSerializer;
        if (opts.params) {
            parsedUrl.search = opts.paramsSerializer(opts.params);
        }
        opts.url = parsedUrl.href;
        if (typeof options.maxContentLength === 'number') {
            opts.size = options.maxContentLength;
        }
        if (typeof options.maxRedirects === 'number') {
            opts.follow = options.maxRedirects;
        }
        opts.headers = opts.headers || {};
        if (opts.data) {
            if (this.isReadableStream(opts.data)) {
                opts.body = opts.data;
            }
            else if (typeof opts.data === 'object') {
                opts.body = JSON.stringify(opts.data);
                opts.headers['Content-Type'] = 'application/json';
            }
            else {
                opts.body = opts.data;
            }
        }
        opts.validateStatus = opts.validateStatus || this.validateStatus;
        opts.responseType = opts.responseType || 'json';
        if (!opts.headers['Accept'] && opts.responseType === 'json') {
            opts.headers['Accept'] = 'application/json';
        }
        opts.method = opts.method || 'GET';
        const proxy = loadProxy();
        if (proxy) {
            if (this.agentCache.has(proxy)) {
                opts.agent = this.agentCache.get(proxy);
            }
            else {
                opts.agent = new HttpsProxyAgent(proxy);
                this.agentCache.set(proxy, opts.agent);
            }
        }
        return opts;
    }
    /**
     * By default, throw for any non-2xx status code
     * @param status status code from the HTTP response
     */
    validateStatus(status) {
        return status >= 200 && status < 300;
    }
    /**
     * Encode a set of key/value pars into a querystring format (?foo=bar&baz=boo)
     * @param params key value pars to encode
     */
    paramsSerializer(params) {
        return querystring_1.default.stringify(params);
    }
    isReadableStream(obj) {
        return obj instanceof stream_1.default.Readable && typeof obj._read === 'function';
    }
    translateResponse(opts, res, data) {
        // headers need to be converted from a map to an obj
        const headers = {};
        res.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return {
            config: opts,
            data: data,
            headers,
            status: res.status,
            statusText: res.statusText,
        };
    }
}
exports.Gaxios = Gaxios;
//# sourceMappingURL=gaxios.js.map