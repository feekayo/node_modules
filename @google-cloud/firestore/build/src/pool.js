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
const assert = require("assert");
const logger_1 = require("./logger");
/**
 * An auto-resizing pool that distributes concurrent operations over multiple
 * clients of type `T`.
 *
 * ClientPool is used within Firestore to manage a pool of GAPIC clients and
 * automatically initializes multiple clients if we issue more than 100
 * concurrent operations.
 *
 * @private
 */
class ClientPool {
    /**
     * @param concurrentOperationLimit The number of operations that each client
     * can handle.
     * @param clientFactory A factory function called as needed when new clients
     * are required.
     */
    constructor(concurrentOperationLimit, clientFactory) {
        this.concurrentOperationLimit = concurrentOperationLimit;
        this.clientFactory = clientFactory;
        /**
         * Stores each active clients and how many operations it has outstanding.
         * @private
         */
        this.activeClients = new Map();
    }
    /**
     * Returns an already existing client if it has less than the maximum number
     * of concurrent operations or initializes and returns a new client.
     *
     * @private
     */
    acquire(requestTag) {
        let selectedClient = null;
        let selectedRequestCount = 0;
        this.activeClients.forEach((requestCount, client) => {
            if (!selectedClient && requestCount < this.concurrentOperationLimit) {
                logger_1.logger('ClientPool.acquire', requestTag, 'Re-using existing client with %s remaining operations', this.concurrentOperationLimit - requestCount);
                selectedClient = client;
                selectedRequestCount = requestCount;
            }
        });
        if (!selectedClient) {
            logger_1.logger('ClientPool.acquire', requestTag, 'Creating a new client');
            selectedClient = this.clientFactory();
            assert(!this.activeClients.has(selectedClient), 'The provided client factory returned an existing instance');
        }
        this.activeClients.set(selectedClient, selectedRequestCount + 1);
        return selectedClient;
    }
    /**
     * Reduces the number of operations for the provided client, potentially
     * removing it from the pool of active clients.
     * @private
     */
    release(requestTag, client) {
        let requestCount = this.activeClients.get(client) || 0;
        assert(requestCount > 0, 'No active request');
        requestCount = requestCount - 1;
        this.activeClients.set(client, requestCount);
        if (requestCount === 0) {
            const deletedCount = this.garbageCollect();
            if (deletedCount) {
                logger_1.logger('ClientPool.release', requestTag, 'Garbage collected %s clients', deletedCount);
            }
        }
    }
    /**
     * The number of currently registered clients.
     *
     * @return Number of currently registered clients.
     * @private
     */
    // Visible for testing.
    get size() {
        return this.activeClients.size;
    }
    /**
     * The number of currently active operations.
     *
     * @return Number of currently active operations.
     * @private
     */
    // Visible for testing.
    get opCount() {
        let activeOperationCount = 0;
        this.activeClients.forEach(count => (activeOperationCount += count));
        return activeOperationCount;
    }
    /**
     * Runs the provided operation in this pool. This function may create an
     * additional client if all existing clients already operate at the concurrent
     * operation limit.
     *
     * @param requestTag A unique client-assigned identifier for this operation.
     * @param op A callback function that returns a Promise. The client T will
     * be returned to the pool when callback finishes.
     * @return A Promise that resolves with the result of `op`.
     * @private
     */
    run(requestTag, op) {
        const client = this.acquire(requestTag);
        return op(client)
            .catch(err => {
            this.release(requestTag, client);
            return Promise.reject(err);
        })
            .then(res => {
            this.release(requestTag, client);
            return res;
        });
    }
    /**
     * Deletes clients that are no longer executing operations. Keeps up to one
     * idle client to reduce future initialization costs.
     *
     * @return Number of clients deleted.
     * @private
     */
    garbageCollect() {
        let idleClients = 0;
        this.activeClients.forEach((requestCount, client) => {
            if (requestCount === 0) {
                ++idleClients;
                if (idleClients > 1) {
                    this.activeClients.delete(client);
                }
            }
        });
        return idleClients - 1;
    }
}
exports.ClientPool = ClientPool;
//# sourceMappingURL=pool.js.map