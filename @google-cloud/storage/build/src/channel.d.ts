/**
 * Copyright 2019 Google LLC
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
import { Metadata, ServiceObject } from '@google-cloud/common';
import { Storage } from './storage';
export interface StopCallback {
    (err: Error | null, apiResponse?: Metadata): void;
}
/**
 * Create a channel object to interact with a Cloud Storage channel.
 *
 * @see [Object Change Notification]{@link https://cloud.google.com/storage/docs/object-change-notification}
 *
 * @class
 *
 * @param {string} id The ID of the channel.
 * @param {string} resourceId The resource ID of the channel.
 *
 * @example
 * const {Storage} = require('@google-cloud/storage');
 * const storage = new Storage();
 * const channel = storage.channel('id', 'resource-id');
 */
declare class Channel extends ServiceObject {
    constructor(storage: Storage, id: string, resourceId: string);
    stop(): Promise<Metadata>;
    stop(callback: StopCallback): void;
}
/**
 * Reference to the {@link Channel} class.
 * @name module:@google-cloud/storage.Channel
 * @see Channel
 */
export { Channel };
