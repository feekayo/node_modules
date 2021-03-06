"use strict";
/*!
 * Copyright 2018 Google LLC
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
const abort_controller_1 = require("abort-controller");
const ConfigStore = require("configstore");
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const Pumpify = require("pumpify");
const stream_1 = require("stream");
const streamEvents = require("stream-events");
const TERMINATED_UPLOAD_STATUS_CODE = 410;
const RESUMABLE_INCOMPLETE_STATUS_CODE = 308;
const RETRY_LIMIT = 5;
class Upload extends Pumpify {
    constructor(cfg) {
        super();
        this.numBytesWritten = 0;
        this.numRetries = 0;
        streamEvents(this);
        cfg = cfg || {};
        if (!cfg.bucket || !cfg.file) {
            throw new Error('A bucket and file name are required');
        }
        cfg.authConfig = cfg.authConfig || {};
        cfg.authConfig.scopes = [
            'https://www.googleapis.com/auth/devstorage.full_control',
        ];
        this.authClient = cfg.authClient || new google_auth_library_1.GoogleAuth(cfg.authConfig);
        this.apiEndpoint = cfg.apiEndpoint || 'storage.googleapis.com';
        this.bucket = cfg.bucket;
        const cacheKeyElements = [cfg.bucket, cfg.file];
        if (typeof cfg.generation === 'number') {
            cacheKeyElements.push(`${cfg.generation}`);
        }
        this.cacheKey = cacheKeyElements.join('/');
        this.file = cfg.file;
        this.generation = cfg.generation;
        this.kmsKeyName = cfg.kmsKeyName;
        this.metadata = cfg.metadata || {};
        this.offset = cfg.offset;
        this.origin = cfg.origin;
        this.userProject = cfg.userProject;
        if (cfg.key) {
            /**
             * NOTE: This is `as string` because there appears to be some weird kind
             * of TypeScript bug as 2.8. Tracking the issue here:
             * https://github.com/Microsoft/TypeScript/issues/23155
             */
            const base64Key = Buffer.from(cfg.key).toString('base64');
            this.encryption = {
                key: base64Key,
                hash: crypto_1.createHash('sha256')
                    .update(cfg.key)
                    .digest('base64'),
            };
        }
        this.predefinedAcl = cfg.predefinedAcl;
        if (cfg.private)
            this.predefinedAcl = 'private';
        if (cfg.public)
            this.predefinedAcl = 'publicRead';
        const configPath = cfg.configPath;
        this.configStore = new ConfigStore('gcs-resumable-upload', null, {
            configPath,
        });
        this.uriProvidedManually = !!cfg.uri;
        this.uri = cfg.uri || this.get('uri');
        this.numBytesWritten = 0;
        this.numRetries = 0;
        const contentLength = cfg.metadata
            ? Number(cfg.metadata.contentLength)
            : NaN;
        this.contentLength = isNaN(contentLength) ? '*' : contentLength;
        this.once('writing', () => {
            if (this.uri) {
                this.continueUploading();
            }
            else {
                this.createURI(err => {
                    if (err) {
                        return this.destroy(err);
                    }
                    this.startUploading();
                });
            }
        });
    }
    get baseURI() {
        return `https://${this.apiEndpoint}/upload/storage/v1/b`;
    }
    createURI(callback) {
        if (!callback) {
            return this.createURIAsync();
        }
        this.createURIAsync().then(r => callback(null, r), callback);
    }
    async createURIAsync() {
        const metadata = this.metadata;
        const reqOpts = {
            method: 'POST',
            url: [this.baseURI, this.bucket, 'o'].join('/'),
            params: { name: this.file, uploadType: 'resumable' },
            data: metadata,
            headers: {},
        };
        if (metadata.contentLength) {
            reqOpts.headers['X-Upload-Content-Length'] = metadata.contentLength.toString();
        }
        if (metadata.contentType) {
            reqOpts.headers['X-Upload-Content-Type'] = metadata.contentType;
        }
        if (typeof this.generation !== 'undefined') {
            reqOpts.params.ifGenerationMatch = this.generation;
        }
        if (this.kmsKeyName) {
            reqOpts.params.kmsKeyName = this.kmsKeyName;
        }
        if (this.predefinedAcl) {
            reqOpts.params.predefinedAcl = this.predefinedAcl;
        }
        if (this.origin) {
            reqOpts.headers.Origin = this.origin;
        }
        const resp = await this.makeRequest(reqOpts);
        const uri = resp.headers.location;
        this.uri = uri;
        this.set({ uri });
        this.offset = 0;
        return uri;
    }
    async continueUploading() {
        if (typeof this.offset === 'number') {
            this.startUploading();
            return;
        }
        await this.getAndSetOffset();
        this.startUploading();
    }
    async startUploading() {
        // The buffer stream allows us to keep chunks in memory
        // until we are sure we can successfully resume the upload.
        const bufferStream = this.bufferStream || new stream_1.PassThrough();
        this.bufferStream = bufferStream;
        // The offset stream allows us to analyze each incoming
        // chunk to analyze it against what the upstream API already
        // has stored for this upload.
        const offsetStream = (this.offsetStream = new stream_1.Transform({
            transform: this.onChunk.bind(this),
        }));
        // The delay stream gives us a chance to catch the response
        // from the API request before we signal to the user that
        // the upload was successful.
        const delayStream = new stream_1.PassThrough();
        // The request library (authClient.request()) requires the
        // stream to be sent within the request options.
        const requestStreamEmbeddedStream = new stream_1.PassThrough();
        delayStream.on('prefinish', () => {
            // Pause the stream from finishing so we can process the
            // response from the API.
            this.cork();
        });
        // Process the API response to look for errors that came in
        // the response body.
        this.on('response', (resp) => {
            if (resp.data.error) {
                this.destroy(resp.data.error);
                return;
            }
            if (resp.status < 200 || resp.status > 299) {
                this.destroy(new Error('Upload failed'));
                return;
            }
            if (resp && resp.data) {
                resp.data.size = Number(resp.data.size);
            }
            this.emit('metadata', resp.data);
            this.deleteConfig();
            // Allow the stream to continue naturally so the user's
            // "finish" event fires.
            this.uncork();
        });
        this.setPipeline(bufferStream, offsetStream, delayStream);
        this.pipe(requestStreamEmbeddedStream);
        this.once('restart', () => {
            // The upload is being re-attempted. Disconnect the request
            // stream, so it won't receive more data.
            this.unpipe(requestStreamEmbeddedStream);
        });
        const reqOpts = {
            method: 'PUT',
            url: this.uri,
            headers: {
                'Content-Range': 'bytes ' + this.offset + '-*/' + this.contentLength,
            },
            body: requestStreamEmbeddedStream,
        };
        try {
            await this.makeRequestStream(reqOpts);
        }
        catch (e) {
            this.destroy(e);
        }
    }
    onChunk(chunk, enc, next) {
        const offset = this.offset;
        const numBytesWritten = this.numBytesWritten;
        this.emit('progress', {
            bytesWritten: this.numBytesWritten,
            contentLength: this.contentLength,
        });
        // check if this is the same content uploaded previously. this caches a
        // slice of the first chunk, then compares it with the first byte of
        // incoming data
        if (numBytesWritten === 0) {
            let cachedFirstChunk = this.get('firstChunk');
            const firstChunk = chunk.slice(0, 16).valueOf();
            if (!cachedFirstChunk) {
                // This is a new upload. Cache the first chunk.
                this.set({ uri: this.uri, firstChunk });
            }
            else {
                // this continues an upload in progress. check if the bytes are the same
                cachedFirstChunk = Buffer.from(cachedFirstChunk);
                const nextChunk = Buffer.from(firstChunk);
                if (Buffer.compare(cachedFirstChunk, nextChunk) !== 0) {
                    // this data is not the same. start a new upload
                    this.bufferStream.unshift(chunk);
                    this.bufferStream.unpipe(this.offsetStream);
                    this.restart();
                    return;
                }
            }
        }
        let length = chunk.length;
        if (typeof chunk === 'string')
            length = Buffer.byteLength(chunk, enc);
        if (numBytesWritten < offset)
            chunk = chunk.slice(offset - numBytesWritten);
        this.numBytesWritten += length;
        // only push data from the byte after the one we left off on
        next(undefined, this.numBytesWritten > offset ? chunk : undefined);
    }
    async getAndSetOffset() {
        const opts = {
            method: 'PUT',
            url: this.uri,
            headers: { 'Content-Length': 0, 'Content-Range': 'bytes */*' },
        };
        try {
            const resp = await this.makeRequest(opts);
            if (resp.status === RESUMABLE_INCOMPLETE_STATUS_CODE) {
                if (resp.headers.range) {
                    const range = resp.headers.range;
                    this.offset = Number(range.split('-')[1]) + 1;
                    return;
                }
            }
            this.offset = 0;
        }
        catch (err) {
            const resp = err.response;
            // we don't return a 404 to the user if they provided the resumable
            // URI. if we're just using the configstore file to tell us that this
            // file exists, and it turns out that it doesn't (the 404), that's
            // probably stale config data.
            if (resp && resp.status === 404 && !this.uriProvidedManually) {
                this.restart();
                return;
            }
            // this resumable upload is unrecoverable (bad data or service error).
            //  -
            //  https://github.com/stephenplusplus/gcs-resumable-upload/issues/15
            //  -
            //  https://github.com/stephenplusplus/gcs-resumable-upload/pull/16#discussion_r80363774
            if (resp && resp.status === TERMINATED_UPLOAD_STATUS_CODE) {
                this.restart();
                return;
            }
            this.destroy(err);
        }
    }
    async makeRequest(reqOpts) {
        if (this.encryption) {
            reqOpts.headers = reqOpts.headers || {};
            reqOpts.headers['x-goog-encryption-algorithm'] = 'AES256';
            reqOpts.headers['x-goog-encryption-key'] = this.encryption.key.toString();
            reqOpts.headers['x-goog-encryption-key-sha256'] = this.encryption.hash.toString();
        }
        if (this.userProject) {
            reqOpts.params = reqOpts.params || {};
            reqOpts.params.userProject = this.userProject;
        }
        // Let gaxios know we will handle a 308 error code ourselves.
        reqOpts.validateStatus = (status) => {
            return ((status >= 200 && status < 300) ||
                status === RESUMABLE_INCOMPLETE_STATUS_CODE);
        };
        const res = await this.authClient.request(reqOpts);
        if (res.data && res.data.error) {
            throw res.data.error;
        }
        return res;
    }
    async makeRequestStream(reqOpts) {
        const controller = new abort_controller_1.default();
        this.once('error', () => controller.abort());
        if (this.userProject) {
            reqOpts.params = reqOpts.params || {};
            reqOpts.params.userProject = this.userProject;
        }
        reqOpts.signal = controller.signal;
        reqOpts.validateStatus = () => true;
        const res = await this.authClient.request(reqOpts);
        this.onResponse(res);
        return res;
    }
    restart() {
        this.emit('restart');
        this.numBytesWritten = 0;
        this.deleteConfig();
        this.createURI(err => {
            if (err) {
                return this.destroy(err);
            }
            this.startUploading();
        });
    }
    get(prop) {
        const store = this.configStore.get(this.cacheKey);
        return store && store[prop];
    }
    // tslint:disable-next-line no-any
    set(props) {
        this.configStore.set(this.cacheKey, props);
    }
    deleteConfig() {
        this.configStore.delete(this.cacheKey);
    }
    /**
     * @return {bool} is the request good?
     */
    onResponse(resp) {
        if (resp.status === 404) {
            if (this.numRetries < RETRY_LIMIT) {
                this.numRetries++;
                this.startUploading();
            }
            else {
                this.destroy(new Error('Retry limit exceeded - ' + resp.data));
            }
            return false;
        }
        if (resp.status > 499 && resp.status < 600) {
            if (this.numRetries < RETRY_LIMIT) {
                const randomMs = Math.round(Math.random() * 1000);
                const waitTime = Math.pow(2, this.numRetries) * 1000 + randomMs;
                this.numRetries++;
                setTimeout(this.continueUploading.bind(this), waitTime);
            }
            else {
                this.destroy(new Error('Retry limit exceeded - ' + resp.data));
            }
            return false;
        }
        this.emit('response', resp);
        return true;
    }
}
exports.Upload = Upload;
function upload(cfg) {
    return new Upload(cfg);
}
exports.upload = upload;
function createURI(cfg, callback) {
    const up = new Upload(cfg);
    if (!callback) {
        return up.createURI();
    }
    up.createURI().then(r => callback(null, r), callback);
}
exports.createURI = createURI;
//# sourceMappingURL=index.js.map