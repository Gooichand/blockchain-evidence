/* Explicit public TLS handshakes, separate from offline supplied-record analysis. */
(function (root) {
  'use strict';
  async function inspect(host) {
    const response = await fetch('/api/network/tls?host=' + encodeURIComponent(host), {
      credentials: 'same-origin',
      headers: root.apiClient?.getAuthHeaders?.() || {},
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Public TLS unavailable.');
    return result;
  }
  function mount(ws) {
    const n = (tag, text, attrs = {}) => {
      const e = document.createElement(tag);
      if (text !== undefined) e.textContent = text;
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      return e;
    };
    const input = n('input', undefined, {
        'aria-label': 'Public TLS hostname',
        type: 'text',
        placeholder: 'example.com',
        maxlength: '253',
        style: 'width:100%;box-sizing:border-box;',
      }),
      run = n('button', 'Inspect public TLS443', {
        class: 'fl-btn fl-btn-primary',
        type: 'button',
      }),
      demo = n('button', '▶ Try live TLS example', {
        class: 'fl-btn fl-btn-ghost',
        type: 'button',
        'aria-label': 'Try live TLS example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(
      n('h2', 'Public TLS Certificate and Configuration Inspection'),
      n(
        'p',
        'Enter a public DNS hostname, then Run. This discloses only that hostname via server DNS and up to3 TLS handshakes to the same validated public IP on port443. No HTTP request, evidence upload, credentials or port scan. Reports peer chain/signatures, Node-default-root validation, hostname/validity, negotiated cipher/ALPN and separate TLS1.2/1.3 attempts. Invalid certificates are displayed as invalid, never treated as trusted. A failed version attempt does not prove a protocol is disabled. No full cipher/vulnerability scan, OCSP/revocation, CT or browser trust claim. Private/special-use addresses and mixed public/private DNS answers are rejected.3requests/minute, about25seconds maximum. The example performs a real example.com handshake; typed input and evidence remain unchanged.',
        {
          class: 'fl-tool-guide',
          style:
            'padding:16px;background:#f8fafc;border:1px solid #ddd;border-radius:10px;line-height:1.6;',
        },
      ),
      input,
      run,
      demo,
      out,
    );
    async function execute(example) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Resolving public address and checking TLS handshakes...'));
      try {
        const result = await inspect(example ? 'example.com' : input.value);
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (example)
          out.append(
            n(
              'strong',
              'LIVE EXAMPLE - actual example.com TLS handshakes. Your input and evidence remain unchanged.',
            ),
          );
        out.append(
          n(
            'p',
            result.negotiated.state === 'CONNECTED'
              ? 'Connected: ' +
                  result.negotiated.protocol +
                  ' | Default-root chain: ' +
                  (result.negotiated.nodeDefaultTrustAuthorized ? 'PASS' : 'FAIL') +
                  ' | Hostname: ' +
                  (result.negotiated.hostnameMatches ? 'MATCH' : 'MISMATCH')
              : 'No successful TLS handshake established.',
          ),
          n('pre', JSON.stringify(result, null, 2), {
            style:
              'white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;background:#f8fafc;padding:16px;',
          }),
        );
      } catch (e) {
        if (ws.contains(out)) out.replaceChildren(n('p', e.message, { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = { inspect, mount };
  root.PublicTLS = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
