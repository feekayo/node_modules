"use strict";
/*
 * Copyright 2019 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const http2 = require("http2");
const { HTTP2_HEADER_AUTHORITY, HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_TE, HTTP2_HEADER_USER_AGENT, } = http2.constants;
/* setInterval and setTimeout only accept signed 32 bit integers. JS doesn't
 * have a constant for the max signed 32 bit integer, so this is a simple way
 * to calculate it */
const KEEPALIVE_TIME_MS = ~(1 << 31);
const KEEPALIVE_TIMEOUT_MS = 20000;
class Http2SubChannel extends events_1.EventEmitter {
    constructor(target, connectionOptions, userAgent, channelArgs) {
        super();
        this.refCount = 0;
        this.keepaliveTimeMs = KEEPALIVE_TIME_MS;
        this.keepaliveTimeoutMs = KEEPALIVE_TIMEOUT_MS;
        this.session = http2.connect(target, connectionOptions);
        this.session.unref();
        this.session.on('connect', () => {
            this.emit('connect');
        });
        this.session.on('close', () => {
            this.stopKeepalivePings();
            this.emit('close');
        });
        this.session.on('error', () => {
            this.stopKeepalivePings();
            this.emit('close');
        });
        this.session.on('goaway', () => {
            this.stopKeepalivePings();
            this.emit('close');
        });
        this.userAgent = userAgent;
        if (channelArgs['grpc.keepalive_time_ms']) {
            this.keepaliveTimeMs = channelArgs['grpc.keepalive_time_ms'];
        }
        if (channelArgs['grpc.keepalive_timeout_ms']) {
            this.keepaliveTimeoutMs = channelArgs['grpc.keepalive_timeout_ms'];
        }
        this.keepaliveIntervalId = setTimeout(() => { }, 0);
        clearTimeout(this.keepaliveIntervalId);
        this.keepaliveTimeoutId = setTimeout(() => { }, 0);
        clearTimeout(this.keepaliveTimeoutId);
    }
    ref() {
        if (this.refCount === 0) {
            this.session.ref();
            this.startKeepalivePings();
        }
        this.refCount += 1;
    }
    unref() {
        this.refCount -= 1;
        if (this.refCount === 0) {
            this.session.unref();
            this.stopKeepalivePings();
        }
    }
    sendPing() {
        this.keepaliveTimeoutId = setTimeout(() => {
            this.emit('close');
        }, this.keepaliveTimeoutMs);
        this.session.ping((err, duration, payload) => {
            clearTimeout(this.keepaliveTimeoutId);
        });
    }
    /* TODO(murgatroid99): refactor subchannels so that keepalives can be handled
     * per subchannel */
    startKeepalivePings() {
        this.keepaliveIntervalId = setInterval(() => {
            this.sendPing();
        }, this.keepaliveTimeMs);
        this.sendPing();
    }
    stopKeepalivePings() {
        clearInterval(this.keepaliveIntervalId);
        clearTimeout(this.keepaliveTimeoutId);
    }
    // Prerequisite: this subchannel is connected
    startCallStream(metadata, callStream) {
        const headers = metadata.toHttp2Headers();
        headers[HTTP2_HEADER_AUTHORITY] = callStream.getHost();
        headers[HTTP2_HEADER_USER_AGENT] = this.userAgent;
        headers[HTTP2_HEADER_CONTENT_TYPE] = 'application/grpc';
        headers[HTTP2_HEADER_METHOD] = 'POST';
        headers[HTTP2_HEADER_PATH] = callStream.getMethod();
        headers[HTTP2_HEADER_TE] = 'trailers';
        const http2Stream = this.session.request(headers);
        this.ref();
        http2Stream.on('close', () => {
            this.unref();
        });
        callStream.attachHttp2Stream(http2Stream);
    }
    close() {
        this.session.close();
    }
}
exports.Http2SubChannel = Http2SubChannel;
//# sourceMappingURL=subchannel.js.map