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
import { FirebaseApp } from '@firebase/app-types';
import { FirebaseAuthTokenData } from '@firebase/app-types/private';
/**
 * An interface for token fetchers.
 */
export interface AuthTokenProvider {
    /**
     * @param {boolean} forceRefresh
     * @return {!Promise<FirebaseAuthTokenData>}
     */
    getToken(forceRefresh: boolean): Promise<FirebaseAuthTokenData>;
    addTokenChangeListener(listener: (token: string | null) => void): any;
    removeTokenChangeListener(listener: (token: string | null) => void): any;
    notifyForInvalidToken(): any;
}
/**
 * Abstraction around FirebaseApp's token fetching capabilities.
 */
export declare class FirebaseAuthTokenProvider implements AuthTokenProvider {
    private app_;
    constructor(app_: FirebaseApp);
    getToken(forceRefresh: boolean): Promise<FirebaseAuthTokenData>;
    addTokenChangeListener(listener: (token: string | null) => void): void;
    removeTokenChangeListener(listener: (token: string | null) => void): void;
    notifyForInvalidToken(): void;
}
