/**
 * EVID-DGC Public Viewer API client.
 * Thin, read-only wrapper around the /api/public endpoints. Safe to call from
 * anonymous visitors (the endpoints never require a wallet or JWT session).
 */
(function (globalScope) {
  const PUBLIC_PATHS = {
    statistics: '/public/statistics',
    cases: '/public/cases',
  };

  async function request(path, options) {
    const opts = options || {};
    const method = opts.method || 'GET';

    let headers = { 'Content-Type': 'application/json' };
    let body;
    if (method === 'POST' && opts.body) {
      body = JSON.stringify(opts.body);
    }

    let url = '/api' + path;
    if (window.config && window.config.API_BASE_URL) {
      url = window.config.API_BASE_URL + path;
    }

    let response;
    if (window.apiClient && typeof window.apiClient.request === 'function') {
      // Reuse the shared client but never attach wallet-signing headers here.
      const data = await window.apiClient.request(path, {
        method,
        body: opts.body,
        skipAuth: true,
      });
      return data;
    }

    response = await fetch(url, { method, headers, body });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      const err = new Error(data.message || data.error || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return data;
  }

  const PUBLIC_API = {
    getStatistics() {
      return request(PUBLIC_PATHS.statistics);
    },
    getCases(params) {
      const qs = params
        ? Object.keys(params)
            .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
            .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
            .join('&')
        : '';
      return request(PUBLIC_PATHS.cases + (qs ? `?${qs}` : ''));
    },
    getCase(id) {
      return request(`/public/cases/${encodeURIComponent(id)}`);
    },
    getCaseEvidence(id) {
      return request(`/public/cases/${encodeURIComponent(id)}/evidence`);
    },
    verify(payload) {
      return request('/public/verify', { method: 'POST', body: payload });
    },
  };

  window.publicAPI = PUBLIC_API;
})(window);