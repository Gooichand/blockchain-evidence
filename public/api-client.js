/**
 * EVID-DGC API Client
 * Centralized, secure API communication with JWT + optional wallet signing
 */
class APIClient {
    constructor() {
        this.baseUrl = window.config?.API_BASE_URL || '/api';
    }

    /**
     * Generates wallet-signing headers for requests that need on-chain identity proof.
     * Returns empty object if MetaMask is not available or no accounts connected.
     */
    async getWalletAuthHeaders(method, path) {
        try {
            if (!window.ethereum) return {};

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return {};

            const walletAddress = accounts[0];

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
     * Generic request wrapper.
     * @param {string} path - API path
     * @param {object} options - fetch options
     * @param {boolean} options.skipAuth - If true, skip all auth headers (for public/login endpoints)
     */
    async request(path, options = {}) {
        const method = options.method || 'GET';
        const skipAuth = options.skipAuth || false;
        const skipWallet = options.skipWalletAuth || false;
        const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;

        let authHeaders = {};

        if (!skipAuth) {
            // Always include JWT token if available (works for both wallet and email users)
            const token = localStorage.getItem('authToken');
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            }

            // Additionally include wallet signing headers if MetaMask is active
            // (these are used by admin/blockchain endpoints that verify on-chain identity)
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
        const { skipAuth: _, skipWalletAuth: __, ...fetchOptions } = options;

        const headers = {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...fetchOptions.headers
        };

        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            const error = new Error(data.error || `HTTP error ${response.status}`);
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
        return this.request(path, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}

window.apiClient = new APIClient();
