/// <reference types="node" />
import { EventEmitter } from 'events';
import { Call, Deadline, Http2CallStream } from './call-stream';
import { ChannelCredentials } from './channel-credentials';
import { ChannelOptions } from './channel-options';
import { Metadata } from './metadata';
export declare enum ConnectivityState {
    CONNECTING = 0,
    READY = 1,
    TRANSIENT_FAILURE = 2,
    IDLE = 3,
    SHUTDOWN = 4
}
/**
 * An interface that represents a communication channel to a server specified
 * by a given address.
 */
export interface Channel {
    /**
     * Close the channel. This has the same functionality as the existing
     * grpc.Client.prototype.close
     */
    close(): void;
    /**
     * Return the target that this channel connects to
     */
    getTarget(): string;
    /**
     * Get the channel's current connectivity state. This method is here mainly
     * because it is in the existing internal Channel class, and there isn't
     * another good place to put it.
     * @param tryToConnect If true, the channel will start connecting if it is
     *     idle. Otherwise, idle channels will only start connecting when a
     *     call starts.
     */
    getConnectivityState(tryToConnect: boolean): ConnectivityState;
    /**
     * Watch for connectivity state changes. This is also here mainly because
     * it is in the existing external Channel class.
     * @param currentState The state to watch for transitions from. This should
     *     always be populated by calling getConnectivityState immediately
     *     before.
     * @param deadline A deadline for waiting for a state change
     * @param callback Called with no error when a state change, or with an
     *     error if the deadline passes without a state change.
     */
    watchConnectivityState(currentState: ConnectivityState, deadline: Date | number, callback: (error?: Error) => void): void;
    /**
     * Create a call object. Call is an opaque type that is used by the Client
     * class. This function is called by the gRPC library when starting a
     * request. Implementers should return an instance of Call that is returned
     * from calling createCall on an instance of the provided Channel class.
     * @param method The full method string to request.
     * @param deadline The call deadline
     * @param host A host string override for making the request
     * @param parentCall A server call to propagate some information from
     * @param propagateFlags A bitwise combination of elements of grpc.propagate
     *     that indicates what information to propagate from parentCall.
     */
    createCall(method: string, deadline: Deadline | null | undefined, host: string | null | undefined, parentCall: Call | null | undefined, propagateFlags: number | null | undefined): Call;
}
export declare class Http2Channel extends EventEmitter implements Channel {
    readonly credentials: ChannelCredentials;
    private readonly options;
    private readonly userAgent;
    private readonly target;
    private readonly defaultAuthority;
    private connectivityState;
    private connecting;
    private subChannel;
    private filterStackFactory;
    private subChannelConnectCallback;
    private subChannelCloseCallback;
    private backoffTimerId;
    private currentBackoff;
    private currentBackoffDeadline;
    private handleStateChange;
    private transitionToState;
    private startConnecting;
    constructor(address: string, credentials: ChannelCredentials, options: Partial<ChannelOptions>);
    _startHttp2Stream(authority: string, methodName: string, stream: Http2CallStream, metadata: Metadata): void;
    createCall(method: string, deadline: Deadline | null | undefined, host: string | null | undefined, parentCall: Call | null | undefined, propagateFlags: number | null | undefined): Call;
    /**
     * Attempts to connect, returning a Promise that resolves when the connection
     * is successful, or rejects if the channel is shut down.
     */
    private connect;
    getConnectivityState(tryToConnect: boolean): ConnectivityState;
    watchConnectivityState(currentState: ConnectivityState, deadline: Date | number, callback: (error?: Error) => void): void;
    getTarget(): string;
    close(): void;
}
