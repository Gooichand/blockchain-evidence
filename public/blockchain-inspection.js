/* Read-only Amoy lookups. Never submits transactions. Optional fixed public-gateway retrieval is explicit and CID-verified locally. */
(function (root) {
  'use strict';
  const guides = {
    'tx-verify': [
      'Amoy Transaction Receipt',
      'Enter a complete 0x transaction hash. Reads its receipt and matching block directly from the configured Amoy RPC. Success means execution only, not evidence anchoring; pending/not-found is not proof of invalidity.',
    ],
    'evidence-verify': [
      'Amoy Evidence Hash Lookup',
      'Enter a SHA-256 digest (64 hexadecimal characters). Checks bare and legacy 0x-prefixed contract indexes against the stored hash at one block; conflicting records fail closed. Anchoring is a contract record, not proof of authenticity or legal admissibility.',
    ],
    'block-explorer': [
      'Amoy Block Inspector',
      'Enter a block number or latest. Reads the block, confirmations and first 100 transaction hashes. Confirmation counts may change after a reorganization; no mainnet or other chains are supported.',
    ],
    'ipfs-viewer': [
      'Verified IPFS / UnixFS Object Viewer',
      'Paste a raw or DAG-PB SHA-256 CID. Choose local CAR to verify and reconstruct the linked UnixFS file/directory from a supplied CAR, or explicit public-gateway mode to retrieve a CAR through the signed-in server, then verify every block and link locally. Local raw mode checks a selected raw block only. Public gateway requests disclose the CID to trustless-gateway.link; no evidence is uploaded or pinned. Maximum 10 MiB CAR/1000 blocks/5 MiB reconstructed file/200 directory entries, 25-second worker. Previews are inert untrusted text; downloads may be unsafe to open. Pin status, authorship, malware safety and continued availability are not verified. Missing blocks, tampering and unsupported objects fail closed.',
    ],
    'chain-custody': [
      'Recent Stored/Sealed Events',
      'Enter an evidence ID. Reads only Stored and Sealed events in the last 2000 blocks, capped at 200 logs. The contract has no custody-transfer event, so a complete chain of custody is unavailable. Missing recent events do not mean no history exists.',
    ],
    provenance: [
      'Amoy Evidence Record',
      'Enter an evidence ID. Reads the stored hash, untrusted metadata, uploader address, timestamp and seal flag at one block. These are contract claims, not physical-world origin, verified identity or full provenance.',
    ],
  };
  const kinds = {
    'tx-verify': 'transaction',
    'block-explorer': 'block',
    'chain-custody': 'events',
    provenance: 'record',
  };
  function validate(id, value) {
    value = String(value).trim();
    if (id === 'evidence-verify') {
      if (!/^[a-fA-F0-9]{64}$/.test(value)) throw Error('Enter a 64-character SHA-256 digest.');
      return value.toLowerCase();
    }
    if (id === 'tx-verify') {
      if (!/^0x[a-fA-F0-9]{64}$/.test(value)) throw Error('Enter a complete 0x transaction hash.');
      return value;
    }
    if (id === 'block-explorer' && value === 'latest') return value;
    if (
      !/^(0|[1-9][0-9]{0,14})$/.test(value) ||
      (['chain-custody', 'provenance'].includes(id) && value === '0')
    )
      throw Error('Enter a valid nonnegative block number or positive evidence ID.');
    return value;
  }
  async function inspectRaw(cid, file) {
    if (!root.LocalCID) throw Error('CID parser/hash dependency unavailable.');
    if (!file || file.size > 5 * 1024 * 1024) throw Error('Select a raw block file up to 5 MiB.');
    const parsed = root.LocalCID.CID.parse(cid.trim());
    if (
      parsed.version !== 1 ||
      parsed.code !== 0x55 ||
      parsed.multihash.code !== 0x12 ||
      parsed.multihash.size !== 32
    )
      throw Error(
        'Only CIDv1 raw codec with SHA-256 is supported; DAG-PB/UnixFS is not a raw block.',
      );
    const bytes = new Uint8Array(await file.arrayBuffer()),
      digest = await root.LocalCID.sha256.digest(bytes);
    const match = digest.digest.every((b, i) => b === parsed.multihash.digest[i]);
    const prefix = bytes.slice(0, 4096);
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(prefix);
    } catch (_) {
      text = null;
    }
    return {
      cid: parsed.toString(),
      matchesBlockBytes: match,
      byteLength: bytes.length,
      previewBytes: prefix.length,
      previewTruncated: prefix.length < bytes.length,
      untrustedUtf8Preview: match ? text : null,
      hexPrefix: match
        ? Array.from(prefix.slice(0, 128), (b) => b.toString(16).padStart(2, '0')).join(' ')
        : null,
      limit:
        'Local raw block only. No gateway retrieval, pin status, authorship or safety verdict.',
    };
  }
  async function inspectCAR(cid, bytes) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('/ipfs-evidence-worker.js');
      const finish = (error, result) => {
        clearTimeout(timer);
        worker.terminate();
        error ? reject(Error(error)) : resolve(result);
      };
      const timer = setTimeout(() => finish('CAR verification exceeded 25 seconds.'), 25000);
      worker.onmessage = (e) =>
        e.data.ok
          ? finish(null, e.data.result)
          : finish(e.data.error || 'CAR verification failed.');
      worker.onerror = () => finish('CAR worker unavailable.');
      worker.postMessage({ cid, bytes });
    });
  }
  async function inspectObject(cid, file, mode, gateway) {
    if (mode === 'raw') return inspectRaw(cid, file);
    const canonical = root.LocalCID.CID.parse(cid.trim()).toV1().toString();
    let bytes;
    if (mode === 'gateway') {
      if (!['trustless'].includes(gateway)) throw Error('Choose a supported public gateway.');
      const response = await fetch('/api/blockchain/ipfs/read-car/' + gateway + '/' + canonical, {
        credentials: 'same-origin',
        headers: root.apiClient?.getAuthHeaders?.() || {},
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        let detail;
        try {
          detail = await response.json();
        } catch (_) {}
        throw Error(detail?.error || 'Gateway retrieval unavailable; nothing verified.');
      }
      bytes = await response.arrayBuffer();
    } else if (mode === 'car') {
      if (!file || file.size > 10 * 1024 * 1024) throw Error('Select a CAR file up to 10 MiB.');
      bytes = await file.arrayBuffer();
    } else throw Error('Unsupported IPFS mode.');
    const result = await inspectCAR(canonical, bytes);
    return {
      ...result,
      retrieval:
        mode === 'gateway'
          ? 'Public gateway ' + gateway + '; CID disclosed, no upload/pinning'
          : 'Local supplied CAR; no gateway request',
    };
  }
  async function analyze(id, value, file, mode = 'raw', gateway = 'trustless') {
    if (id === 'ipfs-viewer') return inspectObject(value, file, mode, gateway);
    const v = validate(id, value),
      url =
        id === 'evidence-verify'
          ? '/api/blockchain/verify-hash/' + v
          : '/api/blockchain/inspect/' + kinds[id] + '/' + v,
      r = await fetch(url, { credentials: 'same-origin', headers: root.apiClient?.getAuthHeaders?.() || {}, signal: AbortSignal.timeout(20000) });
    let result;
    try {
      result = await r.json();
    } catch (_) {
      throw Error('Authenticated server unavailable.');
    }
    if (!r.ok || !result.success)
      throw Error(result.error || 'Lookup unavailable; nothing confirmed.');
    return result;
  }
  function ready(id) {
    return id === 'ipfs-viewer' && !!root.LocalCID;
  }
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id];
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        style:
          'padding:16px;background:#f8fafc;line-height:1.6;border:1px solid #ddd;border-radius:10px;',
      }),
    );
    ws.appendChild(
      n(
        'p',
        tool.id === 'ipfs-viewer'
          ? 'Default: local CAR verification, no network requests. Public-gateway mode sends the CID to the chosen free gateway only when you click Run. No pinning or uploads.'
          : 'Read-only, zero gas. Requires signed-in server session and configured Amoy RPC/contract. Nothing is written on-chain. Results are point-in-time, not continuously refreshed.',
      ),
    );
    const dot = document.querySelector('[data-tool="' + tool.id + '"] .fl-dot');
    if (dot) {
      dot.className = 'fl-dot ' + (ready(tool.id) ? 'available' : 'beta');
      dot.title =
        tool.id === 'ipfs-viewer'
          ? 'Local CID/CAR worker available; public gateway availability is not a guarantee'
          : 'Live operation not yet confirmed in this session';
    }
    const input = n('input', undefined, {
        type: 'text',
        'aria-label': 'Blockchain lookup value',
        placeholder:
          tool.id === 'block-explorer'
            ? 'latest'
            : tool.id === 'tx-verify'
              ? '0x transaction hash'
              : tool.id === 'evidence-verify'
                ? 'SHA-256 digest'
                : tool.id === 'ipfs-viewer'
                  ? 'Raw or DAG-PB SHA-256 CID'
                  : 'Evidence ID',
        style: 'width:100%;box-sizing:border-box;margin-bottom:12px;',
      }),
      run = n('button', tool.id === 'ipfs-viewer' ? 'Inspect IPFS object' : 'Read live Amoy', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = n('button', tool.id === 'ipfs-viewer' ? '▶ Try example' : '▶ Try live example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try blockchain example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    const mode = n('select', undefined, { 'aria-label': 'IPFS source mode' }),
      gateway = n('select', undefined, { 'aria-label': 'Public IPFS gateway' });
    if (tool.id === 'ipfs-viewer') {
      for (const [value, label] of [
        ['car', 'Local CAR file'],
        ['raw', 'Local raw block'],
        ['gateway', 'Public gateway (CID disclosed)'],
      ])
        mode.appendChild(n('option', label, { value }));
      for (const [value, label] of [['trustless', 'trustless-gateway.link']])
        gateway.appendChild(n('option', label, { value }));
      ws.append(mode, gateway);
    }
    ws.append(input, run, demo, out);
    async function execute(example) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(
        n(
          'p',
          tool.id === 'ipfs-viewer' ? 'Reading and verifying IPFS object...' : 'Reading Amoy...',
        ),
      );
      try {
        let file = getFile && getFile();
        let rawCID;
        if (example && tool.id === 'ipfs-viewer') {
          const response = await fetch('/samples/ipfs/example.json');
          if (!response.ok) throw Error('CAR example unavailable.');
          const manifest = await response.json(),
            car = await fetch('/samples/ipfs/demo.car');
          if (!car.ok) throw Error('CAR example unavailable.');
          file = new File([await car.arrayBuffer()], 'Original-demo.car');
          rawCID = manifest.cid;
        }
        const value =
          rawCID ||
          (example
            ? tool.id === 'block-explorer'
              ? 'latest'
              : tool.id === 'tx-verify'
                ? '0x' + '0'.repeat(64)
                : tool.id === 'evidence-verify'
                  ? '0'.repeat(64)
                  : '1'
            : input.value);
        const result = await analyze(
          tool.id,
          value,
          file,
          example && tool.id === 'ipfs-viewer' ? 'car' : mode.value,
          gateway.value,
        );
        const { verifiedFileBytes, ...report } = result;
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (example)
          out.appendChild(
            n(
              'strong',
              tool.id === 'ipfs-viewer'
                ? 'DEMO SAMPLE - actual verified reconstruction from an original multi-block UnixFS CAR; your input and evidence are unchanged.'
                : 'LIVE EXAMPLE LOOKUP - no fabricated record; it may be absent or unavailable. Your input is unchanged.',
            ),
          );
        out.appendChild(
          n('pre', JSON.stringify(report, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;',
          }),
        );
        if (verifiedFileBytes) {
          const save = n('button', 'Download verified bytes (untrusted content)', {
            type: 'button',
            class: 'fl-btn fl-btn-ghost',
          });
          save.onclick = () => {
            const url = URL.createObjectURL(
              new Blob([verifiedFileBytes], { type: 'application/octet-stream' }),
            );
            const a = n('a', undefined, { href: url, download: 'ipfs-verified-object.bin' });
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          };
          out.appendChild(save);
        }
        if (dot && tool.id !== 'ipfs-viewer') {
          dot.className = 'fl-dot available';
          dot.title =
            'Read succeeded at ' + new Date().toISOString() + '; not a current health guarantee';
          setTimeout(() => {
            dot.className = 'fl-dot beta';
            dot.title = 'Read result is over 60 seconds old; run again';
          }, 60000);
        }
      } catch (e) {
        if (dot) dot.className = 'fl-dot beta';
        if (ws.contains(out))
          out.replaceChildren(n('p', e.message || 'Lookup failed.', { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = { mount, analyze, validate, ready, inspectRaw, inspectObject, guides };
  root.BlockchainInspection = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
