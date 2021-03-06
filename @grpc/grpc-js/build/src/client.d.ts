/// <reference types="node" />
import { ClientDuplexStream, ClientReadableStream, ClientUnaryCall, ClientWritableStream, ServiceError } from './call';
import { CallCredentials } from './call-credentials';
import { Deadline } from './call-stream';
import { Channel } from './channel';
import { ChannelCredentials } from './channel-credentials';
import { ChannelOptions } from './channel-options';
import { Metadata } from './metadata';
declare const CHANNEL_SYMBOL: unique symbol;
export interface UnaryCallback<ResponseType> {
    (err: ServiceError | null, value?: ResponseType): void;
}
export interface CallOptions {
    deadline?: Deadline;
    host?: string;
    propagate_flags?: number;
    credentials?: CallCredentials;
}
export declare type ClientOptions = Partial<ChannelOptions> & {
    channelOverride?: Channel;
    channelFactoryOverride?: (address: string, credentials: ChannelCredentials, options: ClientOptions) => Channel;
};
/**
 * A generic gRPC client. Primarily useful as a base class for all generated
 * clients.
 */
export declare class Client {
    private readonly [CHANNEL_SYMBOL];
    constructor(address: string, credentials: ChannelCredentials, options?: ClientOptions);
    close(): void;
    getChannel(): Channel;
    waitForReady(deadline: Deadline, callback: (error?: Error) => void): void;
    private handleUnaryResponse;
    private checkOptionalUnaryResponseArguments;
    makeUnaryRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, argument: RequestType, metadata: Metadata, options: CallOptions, callback: UnaryCallback<ResponseType>): ClientUnaryCall;
    makeUnaryRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, argument: RequestType, metadata: Metadata, callback: UnaryCallback<ResponseType>): ClientUnaryCall;
    makeUnaryRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, argument: RequestType, options: CallOptions, callback: UnaryCallback<ResponseType>): ClientUnaryCall;
    makeUnaryRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, argument: RequestType, callback: UnaryCallback<ResponseType>): ClientUnaryCall;
    makeClientStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, metadata: Metadata, options: CallOptions, callback: UnaryCallback<ResponseType>): ClientWritableStream<RequestType>;
    makeClientStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, metadata: Metadata, callback: UnaryCallback<ResponseType>): ClientWritableStream<RequestType>;
    makeClientStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, options: CallOptions, callback: UnaryCallback<ResponseType>): ClientWritableStream<RequestType>;
    makeClientStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, callback: UnaryCallback<ResponseType>): ClientWritableStream<RequestType>;
    private checkMetadataAndOptions;
    makeServerStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, argument: RequestType, metadata: Metadata, options?: CallOptions): ClientReadableStream<ResponseType>;
    makeServerStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, argument: RequestType, options?: CallOptions): ClientReadableStream<ResponseType>;
    makeBidiStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, metadata: Metadata, options?: CallOptions): ClientDuplexStream<RequestType, ResponseType>;
    makeBidiStreamRequest<RequestType, ResponseType>(method: string, serialize: (value: RequestType) => Buffer, deserialize: (value: Buffer) => ResponseType, options?: CallOptions): ClientDuplexStream<RequestType, ResponseType>;
}
export {};
