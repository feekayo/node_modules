import { Deserialize, Serialize, ServiceDefinition } from './make-client';
import { HandleCall } from './server-call';
import { ServerCredentials } from './server-credentials';
export declare type UntypedHandleCall = HandleCall<any, any>;
export interface UntypedServiceImplementation {
    [name: string]: UntypedHandleCall;
}
export declare class Server {
    private http2Server;
    private handlers;
    private sessions;
    private started;
    constructor(options?: object);
    addProtoService(): void;
    addService(service: ServiceDefinition, implementation: UntypedServiceImplementation): void;
    bind(port: string, creds: ServerCredentials): void;
    bindAsync(port: string, creds: ServerCredentials, callback: (error: Error | null, port: number) => void): void;
    forceShutdown(): void;
    register<RequestType, ResponseType>(name: string, handler: HandleCall<RequestType, ResponseType>, serialize: Serialize<ResponseType>, deserialize: Deserialize<RequestType>, type: string): boolean;
    start(): void;
    tryShutdown(callback: (error?: Error) => void): void;
    addHttp2Port(): void;
    private _setupHandlers;
}
