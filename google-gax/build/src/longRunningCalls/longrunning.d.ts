/// <reference types="node" />
import { EventEmitter } from 'events';
import { ResultTuple } from '../apitypes';
import { CancellablePromise } from '../call';
import { BackoffSettings, CallOptions } from '../gax';
import { GoogleError } from '../googleError';
import { Metadata } from '../grpc';
import { LongRunningDescriptor } from './longRunningDescriptor';
/**
 * @callback GetOperationCallback
 * @param {?Error} error
 * @param {?Object} result
 * @param {?Object} metadata
 * @param {?google.longrunning.Operation} rawResponse
 */
export interface GetOperationCallback {
    (err?: Error | null, result?: {}, metadata?: {}, rawResponse?: Operation): void;
}
export declare class Operation extends EventEmitter {
    completeListeners: number;
    hasActiveListeners: boolean;
    latestResponse: Operation;
    longrunningDescriptor: LongRunningDescriptor;
    result: {} | null;
    metadata: Metadata | null;
    backoffSettings: BackoffSettings;
    _callOptions?: CallOptions;
    currentCallPromise_?: CancellablePromise<ResultTuple>;
    name?: string;
    done?: boolean;
    error?: GoogleError;
    response?: {
        value: {};
    };
    /**
     * Wrapper for a google.longrunnung.Operation.
     *
     * @constructor
     *
     * @param {google.longrunning.Operation} grpcOp - The operation to be wrapped.
     * @param {LongRunningDescriptor} longrunningDescriptor - This defines the
     * operations service client and unpacking mechanisms for the operation.
     * @param {BackoffSettings} backoffSettings - The backoff settings used in
     * in polling the operation.
     * @param {CallOptions} callOptions - CallOptions used in making get operation
     * requests.
     */
    constructor(grpcOp: Operation, longrunningDescriptor: LongRunningDescriptor, backoffSettings: BackoffSettings, callOptions?: CallOptions);
    /**
     * Begin listening for events on the operation. This method keeps track of how
     * many "complete" listeners are registered and removed, making sure polling
     * is handled automatically.
     *
     * As long as there is one active "complete" listener, the connection is open.
     * When there are no more listeners, the polling stops.
     *
     * @private
     */
    _listenForEvents(): void;
    /**
     * Cancels current polling api call and cancels the operation.
     *
     * @return {Promise} the promise of the OperationsClient#cancelOperation api
     * request.
     */
    cancel(): CancellablePromise<[import("../apitypes").ResponseType, {
        [index: string]: string;
    } | null | undefined, {} | Operation | undefined]>;
    /**
     * Get the updated status of the operation. If the Operation has previously
     * completed, this will use the status of the cached completed operation.
     *
     *   - callback(err): Operation failed
     *   - callback(null, result, metadata, rawResponse): Operation complete
     *   - callback(null, null, metadata, rawResponse): Operation incomplete
     *
     * @param {getOperationCallback} callback - Callback to handle the polled
     * operation result and metadata.
     * @return {Promise|undefined} - This returns a promise if a callback is not specified.
     * The promise resolves to an array where the first element is the unpacked
     * result, the second element is the metadata, and the third element is the
     * raw response of the api call. The promise rejects if the operation returns
     * an error.
     */
    getOperation(): Promise<{}>;
    getOperation(callback: GetOperationCallback): void;
    _unpackResponse(op: Operation, callback?: GetOperationCallback): void;
    /**
     * Poll `getOperation` to check the operation's status. This runs a loop to
     * ping using the backoff strategy specified at initialization.
     *
     * Note: This method is automatically called once a "complete" event handler
     * is registered on the operation.
     *
     * @private
     */
    startPolling_(): void;
    /**
     * Wraps the `complete` and `error` events in a Promise.
     *
     * @return {promise} - Promise that resolves on operation completion and rejects
     * on operation error.
     */
    promise(): Promise<unknown>;
}
/**
 * Method used to create Operation objects.
 *
 * @constructor
 *
 * @param {google.longrunning.Operation} op - The operation to be wrapped.
 * @param {LongRunningDescriptor} longrunningDescriptor - This defines the
 * operations service client and unpacking mechanisms for the operation.
 * @param {BackoffSettings} backoffSettings - The backoff settings used in
 * in polling the operation.
 * @param {CallOptions=} callOptions - CallOptions used in making get operation
 * requests.
 */
export declare function operation(op: Operation, longrunningDescriptor: LongRunningDescriptor, backoffSettings: BackoffSettings, callOptions?: CallOptions): Operation;
