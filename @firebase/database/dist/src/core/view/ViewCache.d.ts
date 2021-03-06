/**
 * @license
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
import { CacheNode } from './CacheNode';
import { Node } from '../snap/Node';
/**
 * Stores the data we have cached for a view.
 *
 * serverSnap is the cached server data, eventSnap is the cached event data (server data plus any local writes).
 *
 * @constructor
 */
export declare class ViewCache {
    private readonly eventCache_;
    private readonly serverCache_;
    /**
     *
     * @param {!CacheNode} eventCache_
     * @param {!CacheNode} serverCache_
     */
    constructor(eventCache_: CacheNode, serverCache_: CacheNode);
    /**
     * @const
     * @type {ViewCache}
     */
    static Empty: ViewCache;
    /**
     * @param {!Node} eventSnap
     * @param {boolean} complete
     * @param {boolean} filtered
     * @return {!ViewCache}
     */
    updateEventSnap(eventSnap: Node, complete: boolean, filtered: boolean): ViewCache;
    /**
     * @param {!Node} serverSnap
     * @param {boolean} complete
     * @param {boolean} filtered
     * @return {!ViewCache}
     */
    updateServerSnap(serverSnap: Node, complete: boolean, filtered: boolean): ViewCache;
    /**
     * @return {!CacheNode}
     */
    getEventCache(): CacheNode;
    /**
     * @return {?Node}
     */
    getCompleteEventSnap(): Node | null;
    /**
     * @return {!CacheNode}
     */
    getServerCache(): CacheNode;
    /**
     * @return {?Node}
     */
    getCompleteServerSnap(): Node | null;
}
