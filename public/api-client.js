/**
 * EVID-DGC API Client
 * Centralized, secure API communication with JWT + optional wallet signing
 */
class APIClient {
    constructor() {
        this.baseUrl = window.config?.API_BASE_URL || '/api';
        // Cache the connected MetaMask address so we don't query the wallet on
        // every request. Refreshed automatically when the wallet emits
        // accountsChanged (account switch, disconnect, or reconnect).
        this._connectedWallet = null;
        if (window.ethereum && typeof window.ethereum.on === 'function') {
            try {
                window.ethereum.on('accountsChanged', (accounts) => {
                    this._connectedWallet = (accounts && accounts[0]) ? accounts[0] : null;
                });
            } catch (_) { /* ignore */ }
        }
    }

    /**
     * Resolves the connected MetaMask address.
     * Uses a cached value refreshed via the accountsChanged event, falling back
     * to a silent eth_accounts query (no popup) on first use.
     * @returns {string|null}
     */
    async getActiveWalletAddress() {
        if (!window.ethereum) return null;
        if (this._connectedWallet) return this._connectedWallet;
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            this._connectedWallet = (accounts && accounts[0]) ? accounts[0] : null;
            return this._connectedWallet;
        } catch (_) {
            return null;
        }
    }

    /**
     * Generates wallet-signing headers for requests that need on-chain identity proof.
     * Returns empty object if MetaMask is not available or no accounts connected.
     *
     * SECURITY FIX: When a JWT session already exists (authToken present), the
     * server trusts the signed JWT — verifySignature middleware skips the
     * wallet-signature requirement for valid Bearer tokens and derives the wallet
     * identity from the JWT claims. Signing here would only re-open the MetaMask
     * confirmation popup on every request. A signature is therefore only produced
     * when no session exists yet (pre-auth login/registration flows).
     */
    async getWalletAuthHeaders(method, path) {
        try {
            const walletAddress = await this.getActiveWalletAddress();
            if (!walletAddress) return {};

            const token = localStorage.getItem('authToken');
            if (token) {
                return { 'x-user-wallet': walletAddress };
            }

            // Only sign if ethers is available (not always needed for JWT-authed endpoints)
            if (typeof ethers === 'undefined') return { 'x-user-wallet': walletAddress };

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const nonce = Math.random().toString(36).substring(2, 15);
            const timestamp = new Date().toISOString();

            const payload = JSON.stringify({
                nonce,
                timestamp,
                method: method.toUpperCase(),
                path: path.split('?')[0]
            });

            const signature = await signer.signMessage(payload);

            return {
                'message': payload,
                'signature': signature,
                'x-user-wallet': walletAddress
            };
        } catch (error) {
            // Don't throw — silently return empty headers if wallet signing fails
            console.warn('Wallet auth headers skipped:', error.message);
            return {};
        }
    }

    /**
     * Returns JWT auth headers (Authorization bearer). Includes the connected
     * wallet address as a convenience header when available (no signing).
     * @returns {object}
     */
    getAuthHeaders() {
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const wallet = this.getConnectedWallet();
        if (wallet) {
            headers['x-user-wallet'] = wallet;
        }
        return headers;
    }

    /**
     * Resolves the currently signed-in user object from local storage.
     * Falls back to the connected MetaMask wallet address if no stored user.
     * @returns {object|null}
     */
    getCurrentUser() {
        const currentUserKey = localStorage.getItem('currentUser');
        if (!currentUserKey) return null;

        try {
            const stored = localStorage.getItem('evidUser_' + currentUserKey);
            if (stored) return JSON.parse(stored);
            const alt = localStorage.getItem('evidUser_' + currentUserKey.toLowerCase());
            if (alt) return JSON.parse(alt);
        } catch (_) {
            // fall through
        }

        return null;
    }

    /**
     * Returns the connected MetaMask address, if any.
     * @returns {string|null}
     */
    getConnectedWallet() {
        try {
            const stored = this.getCurrentUser();
            if (stored?.walletAddress || stored?.wallet_address) {
                return stored.walletAddress || stored.wallet_address;
            }
        } catch (_) { /* ignore */ }
        return localStorage.getItem('currentUser') || null;
    }

    /**
     * Serializes an object of query parameters into a query string.
     */
    buildQueryString(params) {
        if (!params || typeof params !== 'object') return '';
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null || value === '') continue;
            qs.append(key, value);
        }
        const str = qs.toString();
        return str ? (str.startsWith('?') ? str : '?' + str) : '';
    }

    /**
     * Generic request wrapper.
     * @param {string} path - API path
     * @param {object} options - fetch options
     * @param {boolean} options.skipAuth - If true, skip all auth headers (for public/login endpoints)
     * @param {boolean} options.skipWalletAuth - If true, skip wallet signing (JWT only)
     * @param {object} options.params - Query parameters appended to the URL
     * @param {*} options.body - Optional body. FormData/Blob passed through untouched so the
     *                           browser sets the multipart boundary (do NOT JSON.stringify).
     */
    async request(path, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const skipAuth = options.skipAuth || false;
        const skipWallet = options.skipWalletAuth || false;

        let url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
        if (options.params) {
            url += this.buildQueryString(options.params);
        }

        let authHeaders = {};

        if (!skipAuth) {
            const token = localStorage.getItem('authToken');
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            }

            if (!skipWallet) {
                try {
                    const walletHeaders = await this.getWalletAuthHeaders(method, path);
                    authHeaders = { ...authHeaders, ...walletHeaders };
                } catch (_) {
                    // Wallet headers optional — JWT alone is sufficient for most routes
                }
            }
        }

        // Remove non-fetch options before passing to fetch
        const { skipAuth: _, skipWalletAuth: __, params: ___, ...fetchOptions } = options;

        const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
        const isBlob = typeof Blob !== 'undefined' && fetchOptions.body instanceof Blob;
        const isArrayBuffer = fetchOptions.body instanceof ArrayBuffer;

        // fetch() stringifies a plain object body as "[object Object]". Serialize object
        // bodies ourselves so the server receives valid JSON (this broke all POST logins).
        let bodyToSend = fetchOptions.body;
        if (
            bodyToSend !== undefined &&
            bodyToSend !== null &&
            !isFormData &&
            !isBlob &&
            !isArrayBuffer &&
            typeof bodyToSend === 'object'
        ) {
            bodyToSend = JSON.stringify(bodyToSend);
        }

        const headers = {
            ...authHeaders,
            ...fetchOptions.headers
        };
        if (!isFormData && bodyToSend !== undefined) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }

        const requestInit = {
            ...fetchOptions,
            method,
            headers,
            credentials: 'include'
        };
        if (bodyToSend !== undefined) {
            requestInit.body = bodyToSend;
        }

        const response = await fetch(url, requestInit);

        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (response.status === 204) {
            data = { success: true };
        } else if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Centralized auth-state handling. Server is the source of truth for
        // authorization, so a 401 means the session is gone and a 403 means the
        // role lacks permission. This is a UX layer only — enforcement is server-side.
        if (response.status === 401 && localStorage.getItem('authToken')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            if (!window.__evidAuthRedirected) {
                window.__evidAuthRedirected = true;
                window.location.href = '/?auth=expired';
            }
        } else if (response.status === 403) {
            if (typeof window.showAlert === 'function') {
                window.showAlert('Access denied. You do not have permission to view this.', 'error');
            }
        }

        if (!response.ok || (data && typeof data === 'object' && data.success === false)) {
            const error = new Error((data && data.error) || `HTTP error ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // Convenience methods
    async get(path, options = {}) {
        return this.request(path, { ...options, method: 'GET' });
    }

    async post(path, body, options = {}) {
        return this.request(path, { ...options, method: 'POST', body });
    }

    async put(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PUT', body });
    }

    async delete(path, options = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }

    async patch(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PATCH', body });
    }

    /**
     * Multipart file upload (FormData passthrough with auth headers).
     * @param {string} path - API path
     * @param {FormData} formData - multipart form data (file fields + metadata)
     * @param {Function|object} onProgressOrOptions - progress callback fn(percent) OR standard
     *                                                request options (skipWalletAuth, params,
     *                                                onProgress).
     */
    async upload(path, formData, onProgressOrOptions = {}) {
        if (!(formData instanceof FormData)) {
            throw new Error('upload() expects a FormData body');
        }

        let options = {};
        let onProgress = null;
        if (typeof onProgressOrOptions === 'function') {
            onProgress = onProgressOrOptions;
        } else if (onProgressOrOptions && typeof onProgressOrOptions === 'object') {
            options = onProgressOrOptions;
            onProgress = onProgressOrOptions.onProgress || null;
        }

        if (!onProgress) {
            return this.request(path, { ...options, method: 'POST', body: formData });
        }

        // XHR path when a progress callback is requested
        const method = 'POST';
        const skipAuth = options.skipAuth || false;
        const skipWallet = options.skipWalletAuth || false;

        let url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
        if (options.params) {
            url += this.buildQueryString(options.params);
        }

        const headers = {};
        if (!skipAuth) {
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            if (!skipWallet) {
                try {
                    const walletHeaders = await this.getWalletAuthHeaders(method, path);
                    Object.assign(headers, walletHeaders);
                } catch (_) {
                    // Wallet headers optional — JWT alone is sufficient for most routes
                }
            }
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            };

            xhr.onload = () => {
                let data = null;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (_) {
                    data = { success: xhr.status < 400, error: xhr.responseText };
                }
                if (xhr.status >= 400 || (data && typeof data === 'object' && data.success === false)) {
                    const error = new Error((data && data.error) || `HTTP error ${xhr.status}`);
                    error.status = xhr.status;
                    error.data = data;
                    reject(error);
                } else {
                    resolve(data);
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(formData);
        });
    }
}

window.apiClient = new APIClient();