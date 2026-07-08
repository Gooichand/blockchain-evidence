/**
 * EVID-DGC API Client
 * Centralized, secure API communication with cryptographic signing
 */
class APIClient {
    constructor() {
        this.baseUrl = window.config?.API_BASE_URL || '/api';
    }

    /**
     * SECURITY FIX: Generates a cryptographic signature for the request.
     * This proves wallet ownership for every sensitive API call.
     */
    async getAuthHeaders(method, path) {
        try {
            if (!window.ethereum) return {};

            // Get connected account
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return {};

            const walletAddress = accounts[0];
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Create payload for domain binding
            const nonce = Math.random().toString(36).substring(2, 15);
            const timestamp = new Date().toISOString();
            
            // SECURITY FIX: Bind the signature to the specific request
            const payload = JSON.stringify({
                nonce,
                timestamp,
                method: method.toUpperCase(),
                path: path.split('?')[0] // Bind to path without query params
            });

            const signature = await signer.signMessage(payload);

            return {
                'message': payload,
                'signature': signature,
                'x-user-wallet': walletAddress
            };
        } catch (error) {
            console.error('Failed to generate auth headers:', error);
            return {};
        }
    }

    /**
     * Generic request wrapper with auth headers.
     * @param {string} path - API path
     * @param {object} options - fetch options
     * @param {boolean} options.skipAuth - If true, skip MetaMask signing (for read-only public endpoints)
     */
    async request(path, options = {}) {
        const method = options.method || 'GET';
        const skipAuth = options.skipAuth || false;
        const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
        
        // Add auth headers only when needed
        const authHeaders = skipAuth ? {} : await this.getAuthHeaders(method, path);
        
        // Remove non-fetch options before passing to fetch
        const { skipAuth: _, ...fetchOptions } = options;

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

        // Handle standardized response format
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
