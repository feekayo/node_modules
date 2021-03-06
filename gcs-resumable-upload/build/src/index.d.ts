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
/// <reference types="node" />
import * as ConfigStore from 'configstore';
import { GoogleAuth, GoogleAuthOptions } from 'google-auth-library';
import * as Pumpify from 'pumpify';
export interface ErrorWithCode extends Error {
    code: number;
}
export declare type CreateUriCallback = (err: Error | null, uri?: string) => void;
export interface Encryption {
    key: {};
    hash: {};
}
export interface UploadConfig {
    /**
     * The API endpoint used for the request.
     * Defaults to `storage.googleapis.com`.
     */
    apiEndpoint?: string;
    /**
     * The name of the destination bucket.
     */
    bucket: string;
    /**
     * The name of the destination file.
     */
    file: string;
    /**
     * The GoogleAuthOptions passed to google-auth-library
     */
    authConfig?: GoogleAuthOptions;
    /**
     * If you want to re-use an auth client from google-auto-auth, pass an
     * instance here.
     */
    authClient?: GoogleAuth;
    /**
     * Where the gcs-resumable-upload configuration file should be stored on your
     * system. This maps to the configstore option by the same name.
     */
    configPath?: string;
    /**
     * This will cause the upload to fail if the current generation of the remote
     * object does not match the one provided here.
     */
    generation?: number;
    /**
     * A customer-supplied encryption key. See
     * https://cloud.google.com/storage/docs/encryption#customer-supplied.
     */
    key?: string | Buffer;
    /**
     * Resource name of the Cloud KMS key, of the form
     * `projects/my-project/locations/global/keyRings/my-kr/cryptoKeys/my-key`,
     * that will be used to encrypt the object. Overrides the object metadata's
     * `kms_key_name` value, if any.
     */
    kmsKeyName?: string;
    /**
     * Any metadata you wish to set on the object.
     */
    metadata?: ConfigMetadata;
    /**
     * The starting byte of the upload stream, for resuming an interrupted upload.
     * See
     * https://cloud.google.com/storage/docs/json_api/v1/how-tos/resumable-upload#resume-upload.
     */
    offset?: number;
    /**
     * Set an Origin header when creating the resumable upload URI.
     */
    origin?: string;
    /**
     * Apply a predefined set of access controls to the created file.
     */
    predefinedAcl?: 'authenticatedRead' | 'bucketOwnerFullControl' | 'bucketOwnerRead' | 'private' | 'projectPrivate' | 'publicRead';
    /**
     * Make the uploaded file private. (Alias for config.predefinedAcl =
     * 'private')
     */
    private?: boolean;
    /**
     * Make the uploaded file public. (Alias for config.predefinedAcl =
     * 'publicRead')
     */
    public?: boolean;
    /**
     * If you already have a resumable URI from a previously-created resumable
     * upload, just pass it in here and we'll use that.
     */
    uri?: string;
    /**
     * If the bucket being accessed has requesterPays functionality enabled, this
     * can be set to control which project is billed for the access of this file.
     */
    userProject?: string;
}
export interface ConfigMetadata {
    [key: string]: any;
    /**
     * Set the length of the file being uploaded.
     */
    contentLength?: number;
    /**
     * Set the content type of the incoming data.
     */
    contentType?: string;
}
export declare class Upload extends Pumpify {
    bucket: string;
    file: string;
    apiEndpoint: string;
    authConfig?: {
        scopes?: string[];
    };
    authClient: GoogleAuth;
    cacheKey: string;
    generation?: number;
    key?: string | Buffer;
    kmsKeyName?: string;
    metadata: ConfigMetadata;
    offset?: number;
    origin?: string;
    predefinedAcl?: 'authenticatedRead' | 'bucketOwnerFullControl' | 'bucketOwnerRead' | 'private' | 'projectPrivate' | 'publicRead';
    private?: boolean;
    public?: boolean;
    uri?: string;
    userProject?: string;
    encryption?: Encryption;
    configStore: ConfigStore;
    uriProvidedManually: boolean;
    numBytesWritten: number;
    numRetries: number;
    contentLength: number | '*';
    private bufferStream?;
    private offsetStream?;
    private readonly baseURI;
    constructor(cfg: UploadConfig);
    createURI(): Promise<string>;
    createURI(callback: CreateUriCallback): void;
    protected createURIAsync(): Promise<string>;
    private continueUploading;
    private startUploading;
    private onChunk;
    private getAndSetOffset;
    private makeRequest;
    private makeRequestStream;
    private restart;
    private get;
    private set;
    deleteConfig(): void;
    /**
     * @return {bool} is the request good?
     */
    private onResponse;
}
export declare function upload(cfg: UploadConfig): Upload;
export declare function createURI(cfg: UploadConfig): Promise<string>;
export declare function createURI(cfg: UploadConfig, callback: CreateUriCallback): void;
