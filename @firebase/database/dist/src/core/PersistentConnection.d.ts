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
import { ServerActions } from './ServerActions';
import { AuthTokenProvider } from './AuthTokenProvider';
import { RepoInfo } from './RepoInfo';
import { Query } from '../api/Query';
/**
 * Firebase connection.  Abstracts wire protocol and handles reconnecting.
 *
 * NOTE: All JSON objects sent to the realtime connection must have property names enclosed
 * in quotes to make sure the closure compiler does not minify them.
 */
export declare class PersistentConnection extends ServerActions {
    private repoInfo_;
    private onDataUpdate_;
    private onConnectStatus_;
    private onServerInfoUpdate_;
    private authTokenProvider_;
    private authOverride_?;
    id: number;
    private log_;
    private interruptReasons_;
    /** Map<path, Map<queryId, ListenSpec>> */
    private readonly listens;
    private outstandingPuts_;
    private outstandingPutCount_;
    private onDisconnectRequestQueue_;
    private connected_;
    private reconnectDelay_;
    private maxReconnectDelay_;
    private securityDebugCallback_;
    lastSessionId: string | null;
    private establishConnectionTimer_;
    private visible_;
    private requestCBHash_;
    private requestNumber_;
    private realtime_;
    private authToken_;
    private forceTokenRefresh_;
    private invalidAuthTokenCount_;
    private firstConnection_;
    private lastConnectionAttemptTime_;
    private lastConnectionEstablishedTime_;
    private static nextPersistentConnectionId_;
    /**
     * Counter for number of connections created. Mainly used for tagging in the logs
     */
    private static nextConnectionId_;
    /**
     * @implements {ServerActions}
     * @param repoInfo_ Data about the namespace we are connecting to
     * @param onDataUpdate_ A callback for new data from the server
     */
    constructor(repoInfo_: RepoInfo, onDataUpdate_: (a: string, b: any, c: boolean, d: number | null) => void, onConnectStatus_: (a: boolean) => void, onServerInfoUpdate_: (a: any) => void, authTokenProvider_: AuthTokenProvider, authOverride_?: Object | null);
    protected sendRequest(action: string, body: any, onResponse?: (a: any) => void): void;
    /**
     * @inheritDoc
     */
    listen(query: Query, currentHashFn: () => string, tag: number | null, onComplete: (a: string, b: any) => void): void;
    private sendListen_;
    private static warnOnListenWarnings_;
    /**
     * @inheritDoc
     */
    refreshAuthToken(token: string): void;
    private reduceReconnectDelayIfAdminCredential_;
    /**
     * Attempts to authenticate with the given credentials. If the authentication attempt fails, it's triggered like
     * a auth revoked (the connection is closed).
     */
    tryAuth(): void;
    /**
     * @inheritDoc
     */
    unlisten(query: Query, tag: number | null): void;
    private sendUnlisten_;
    /**
     * @inheritDoc
     */
    onDisconnectPut(pathString: string, data: any, onComplete?: (a: string, b: string) => void): void;
    /**
     * @inheritDoc
     */
    onDisconnectMerge(pathString: string, data: any, onComplete?: (a: string, b: string) => void): void;
    /**
     * @inheritDoc
     */
    onDisconnectCancel(pathString: string, onComplete?: (a: string, b: string) => void): void;
    private sendOnDisconnect_;
    /**
     * @inheritDoc
     */
    put(pathString: string, data: any, onComplete?: (a: string, b: string) => void, hash?: string): void;
    /**
     * @inheritDoc
     */
    merge(pathString: string, data: any, onComplete: (a: string, b: string | null) => void, hash?: string): void;
    putInternal(action: string, pathString: string, data: any, onComplete: (a: string, b: string | null) => void, hash?: string): void;
    private sendPut_;
    /**
     * @inheritDoc
     */
    reportStats(stats: {
        [k: string]: any;
    }): void;
    private onDataMessage_;
    private onDataPush_;
    private onReady_;
    private scheduleConnect_;
    private onVisible_;
    private onOnline_;
    private onRealtimeDisconnect_;
    private establishConnection_;
    interrupt(reason: string): void;
    resume(reason: string): void;
    private handleTimestamp_;
    private cancelSentTransactions_;
    private onListenRevoked_;
    private removeListen_;
    private onAuthRevoked_;
    private onSecurityDebugPacket_;
    private restoreState_;
    /**
     * Sends client stats for first connection
     */
    private sendConnectStats_;
    private shouldReconnect_;
}
