/* ============================================================================
   EVID-DGC Digital Forensics Laboratory
   Framework + placeholder engine. No real forensic algorithms yet.
   ============================================================================ */
(function () {
  'use strict';

  const SVC = {
    hash: { name: 'HashToolService', label: 'Hash & Integrity Engine', module: 'HASH-INTEGRITY-MODULE', version: 'v2.1.0' },
    image: { name: 'ImageForensicsService', label: 'Image Forensics Engine', module: 'IMAGE-FORENSICS-MODULE', version: 'v1.4.0' },
    document: { name: 'DocumentForensicsService', label: 'Document Forensics Engine', module: 'DOCUMENT-FORENSICS-MODULE', version: 'v1.2.0' },
    video: { name: 'VideoForensicsService', label: 'Video Forensics Engine', module: 'VIDEO-FORENSICS-MODULE', version: 'v1.1.0' },
    audio: { name: 'AudioForensicsService', label: 'Audio Forensics Engine', module: 'AUDIO-FORENSICS-MODULE', version: 'v1.0.0' },
    blockchain: { name: 'BlockchainService', label: 'Blockchain Verification Engine', module: 'BLOCKCHAIN-VERIFY-MODULE', version: 'v3.0.0' },
    crypto: { name: 'CryptographyService', label: 'Cryptography Engine', module: 'CRYPTO-MODULE', version: 'v1.0.0' },
    metadata: { name: 'MetadataService', label: 'Metadata Extraction Engine', module: 'METADATA-MODULE', version: 'v2.0.0' },
    timeline: { name: 'TimelineService', label: 'Timeline Reconstruction Engine', module: 'TIMELINE-MODULE', version: 'v1.3.0' },
    utility: { name: 'UtilityService', label: 'Utility Engine', module: 'UTILITY-MODULE', version: 'v1.0.0' },
    ai: { name: 'AIService', label: 'AI Analysis Engine', module: 'AI-ANALYSIS-MODULE', version: 'v0.9.0' },
  };

  const CATALOG = [
    {
      id: 'hash', icon: 'fingerprint', name: 'Hash & Integrity',
      desc: 'Cryptographic hashing and file integrity verification.',
      formats: ['SHA-256', 'SHA-1', 'MD5', 'BIN', 'TXT'],
      tools: [
        { id: 'sha256', name: 'SHA-256 Generator', icon: 'hash', status: 'available', desc: 'Generate SHA-256 hashes for evidence integrity.' },
        { id: 'hash-compare', name: 'Hash Comparison', icon: 'git-compare', status: 'available', desc: 'Compare evidence hashes against verified records.' },
        { id: 'integrity-check', name: 'File Integrity Checker', icon: 'file-check', status: 'available', desc: 'Detect alterations in collected evidence files.' },
        { id: 'blockchain-verify', name: 'Blockchain Verification', icon: 'link', status: 'beta', desc: 'Verify hash anchoring on the Polygon blockchain.' },
        { id: 'multi-hash', name: 'Multi Hash Generator', icon: 'layers', status: 'available', desc: 'Generate multiple digest algorithms at once.' },
      ],
    },
    {
      id: 'image', icon: 'image', name: 'Image Forensics',
      desc: 'Tamper detection and forgery analysis for images.',
      formats: ['JPG', 'PNG', 'WebP', 'TIFF', 'GIF', 'BMP'],
      tools: [
        { id: 'ela', name: 'Error Level Analysis', icon: 'contrast', status: 'beta', desc: 'Re-compression analysis to expose edited regions.' },
        { id: 'clone-detect', name: 'Clone Detection', icon: 'copy', status: 'beta', desc: 'Detect duplicated and cloned image regions.' },
        { id: 'noise-analysis', name: 'Noise Analysis', icon: 'activity', status: 'beta', desc: 'Sensor noise pattern analysis for source attribution.' },
        { id: 'img-metadata', name: 'Metadata Viewer', icon: 'tags', status: 'available', desc: 'EXIF, GPS and camera metadata extraction.' },
        { id: 'histogram', name: 'Histogram Analysis', icon: 'bar-chart-3', status: 'available', desc: 'Pixel distribution analysis across color channels.' },
        { id: 'compression', name: 'Compression Analysis', icon: 'archive', status: 'available', desc: 'Detect double-compression artifacts.' },
        { id: 'color-channels', name: 'Color Channel Analysis', icon: 'palette', status: 'beta', desc: 'Isolate and inspect individual color channels.' },
        { id: 'edge-detect', name: 'Edge Detection', icon: 'scan-line', status: 'available', desc: 'Edge maps to highlight composited regions.' },
        { id: 'ai-tamper', name: 'AI Tampering Detection', icon: 'sparkles', status: 'coming-soon', desc: 'Deepfake and AI-manipulation detection.' },
      ],
    },
    {
      id: 'document', icon: 'file-text', name: 'Document Forensics',
      desc: 'PDF and office document investigation tools.',
      formats: ['PDF', 'DOCX', 'DOC', 'ODT', 'TXT'],
      tools: [
        { id: 'pdf-inspector', name: 'PDF Inspector', icon: 'file-search', status: 'available', desc: 'Deep inspection of PDF structure and objects.' },
        { id: 'doc-metadata', name: 'Metadata Viewer', icon: 'tags', status: 'available', desc: 'Hidden authorship and history metadata.' },
        { id: 'ocr', name: 'OCR Engine', icon: 'scan-text', status: 'coming-soon', desc: 'Optical character recognition for scanned documents.' },
        { id: 'hidden-text', name: 'Hidden Text Detector', icon: 'eye-off', status: 'beta', desc: 'Uncover hidden and white-on-white text.' },
        { id: 'signature', name: 'Signature Verification', icon: 'pen-tool', status: 'beta', desc: 'Digital signature validation and analysis.' },
        { id: 'doc-compare', name: 'Document Comparison', icon: 'file-diff', status: 'beta', desc: 'Diff and change detection across revisions.' },
      ],
    },
    {
      id: 'video', icon: 'video', name: 'Video Forensics',
      desc: 'Video evidence analysis and reconstruction.',
      formats: ['MP4', 'AVI', 'MKV', 'MOV', 'WEBM'],
      tools: [
        { id: 'vid-metadata', name: 'Metadata Viewer', icon: 'tags', status: 'available', desc: 'Container and codec metadata extraction.' },
        { id: 'frame-extract', name: 'Frame Extraction', icon: 'film', status: 'available', desc: 'Extract still frames from video evidence.' },
        { id: 'vid-timeline', name: 'Timeline Viewer', icon: 'timeline', status: 'beta', desc: 'Visual event timeline across footage.' },
        { id: 'keyframe', name: 'Keyframe Analysis', icon: 'camera', status: 'beta', desc: 'Keyframe grouping and anomaly detection.' },
        { id: 'video-inspector', name: 'Video Inspector', icon: 'video', status: 'beta', desc: 'Container and stream integrity inspection.' },
      ],
    },
    {
      id: 'audio', icon: 'music', name: 'Audio Forensics',
      desc: 'Audio evidence enhancement and analysis.',
      formats: ['MP3', 'WAV', 'FLAC', 'M4A', 'OGG'],
      tools: [
        { id: 'waveform', name: 'Waveform Viewer', icon: 'audio-waveform', status: 'available', desc: 'Waveform rendering and zoom analysis.' },
        { id: 'spectrogram', name: 'Spectrogram', icon: 'activity', status: 'coming-soon', desc: 'Frequency spectrum visualization.' },
        { id: 'aud-metadata', name: 'Metadata Viewer', icon: 'tags', status: 'available', desc: 'Encoding and recording metadata.' },
        { id: 'fingerprint', name: 'Audio Fingerprinting', icon: 'fingerprint', status: 'beta', desc: 'Acoustic fingerprint matching.' },
      ],
    },
    {
      id: 'blockchain', icon: 'link-2', name: 'Blockchain',
      desc: 'On-chain verification and evidence provenance.',
      formats: ['JSON', 'TXT', 'HEX', 'CSV'],
      tools: [
        { id: 'tx-verify', name: 'Transaction Verification', icon: 'receipt', status: 'available', desc: 'Verify transactions on supported chains.' },
        { id: 'evidence-verify', name: 'Evidence Verification', icon: 'shield-check', status: 'available', desc: 'Verify evidence anchoring records.' },
        { id: 'block-explorer', name: 'Block Explorer', icon: 'blocks', status: 'beta', desc: 'Browse blocks and confirmations.' },
        { id: 'ipfs-viewer', name: 'IPFS Viewer', icon: 'database', status: 'coming-soon', desc: 'Inspect IPFS-stored evidence objects.' },
        { id: 'chain-custody', name: 'Chain of Custody', icon: 'link', status: 'available', desc: 'Follow custody events on-chain.' },
        { id: 'provenance', name: 'Evidence Provenance', icon: 'waypoints', status: 'beta', desc: 'Trace evidence origin and history.' },
      ],
    },
    {
      id: 'crypto', icon: 'key', name: 'Cryptography',
      desc: 'Encryption, keys and signature analysis.',
      formats: ['PEM', 'DER', 'TXT', 'JWK', 'HEX'],
      tools: [
        { id: 'aes', name: 'AES Analysis', icon: 'lock', status: 'available', desc: 'AES key analysis and decryption utilities.' },
        { id: 'rsa', name: 'RSA Analysis', icon: 'key', status: 'beta', desc: 'RSA key inspection and validation.' },
        { id: 'jwt', name: 'JWT Decoder', icon: 'code', status: 'available', desc: 'Decode and inspect JSON web tokens.' },
        { id: 'cert-viewer', name: 'Certificate Viewer', icon: 'award', status: 'beta', desc: 'X.509 certificate chain inspection.' },
        { id: 'digisig', name: 'Digital Signature', icon: 'signature', status: 'beta', desc: 'Digital signature generation and validation.' },
      ],
    },
    {
      id: 'metadata', icon: 'tags', name: 'Metadata',
      desc: 'Metadata extraction across file types.',
      formats: ['JPG', 'PNG', 'PDF', 'DOCX', 'MP3', 'MP4'],
      tools: [
        { id: 'exif', name: 'EXIF Viewer', icon: 'camera', status: 'available', desc: 'Full EXIF tag extraction.' },
        { id: 'gps', name: 'GPS Viewer', icon: 'map-pin', status: 'available', desc: 'Geolocation data from captured media.' },
        { id: 'camera-info', name: 'Camera Information', icon: 'aperture', status: 'available', desc: 'Camera model, lens and settings extraction.' },
        { id: 'office-metadata', name: 'Office Metadata', icon: 'file-spreadsheet', status: 'available', desc: 'Author and revision history from office files.' },
        { id: 'pdf-metadata', name: 'PDF Metadata', icon: 'file-text', status: 'available', desc: 'PDF document properties and history.' },
      ],
    },
    {
      id: 'timeline', icon: 'clock', name: 'Timeline',
      desc: 'Event reconstruction and time correlation.',
      formats: ['JSON', 'CSV', 'TXT'],
      tools: [
        { id: 'evidence-timeline', name: 'Evidence Timeline', icon: 'list-ordered', status: 'available', desc: 'Chronological reconstruction of evidence events.' },
        { id: 'invest-timeline', name: 'Investigation Timeline', icon: 'history', status: 'available', desc: 'Case activity correlation across sources.' },
        { id: 'custody-timeline', name: 'Chain of Custody Timeline', icon: 'link', status: 'beta', desc: 'Visual custody transfer sequence.' },
      ],
    },
    {
      id: 'utility', icon: 'wrench', name: 'Utilities',
      desc: 'Quick technical helpers for evidence processing.',
      formats: ['TXT', 'BIN', 'HEX', 'JSON'],
      tools: [
        { id: 'base64', name: 'Base64', icon: 'code', status: 'available', desc: 'Encode and decode base64 payloads.' },
        { id: 'url-encoder', name: 'URL Encoder', icon: 'link-2', status: 'available', desc: 'URL encode and decode strings.' },
        { id: 'hex-viewer', name: 'Hex Viewer', icon: 'hexagon', status: 'available', desc: 'Hexadecimal and byte inspection.' },
        { id: 'uuid', name: 'UUID Generator', icon: 'key-round', status: 'available', desc: 'Generate RFC 4122 UUIDs.' },
        { id: 'timestamp', name: 'Timestamp Converter', icon: 'clock', status: 'available', desc: 'Convert between epoch and readable time.' },
        { id: 'qr-generator', name: 'QR Generator', icon: 'qr-code', status: 'available', desc: 'Generate QR codes for evidence links.' },
        { id: 'qr-scanner', name: 'QR Scanner', icon: 'scan', status: 'coming-soon', desc: 'Decode QR codes from images.' },
      ],
    },
    {
      id: 'ai', icon: 'sparkles', name: 'AI Assistant',
      desc: 'AI-assisted analysis and reporting.',
      formats: ['TXT', 'PDF', 'DOCX', 'JSON'],
      tools: [
        { id: 'ai-assistant', name: 'AI Investigation Assistant', icon: 'bot', status: 'coming-soon', desc: 'Conversational support for investigations.' },
        { id: 'ai-summary', name: 'AI Evidence Summary', icon: 'file-text', status: 'coming-soon', desc: 'Automated evidence summarization.' },
        { id: 'ai-report', name: 'AI Report Generator', icon: 'file-output', status: 'coming-soon', desc: 'Draft forensic reports from analysis data.' },
        { id: 'ai-tamper', name: 'AI Tampering Detection', icon: 'sparkles', status: 'coming-soon', desc: 'ML-based manipulation detection.' },
      ],
    },
  ];

  /* ------------------------------------------------------------- services */
  CATALOG.forEach((c, i) => {
    CATALOG[i].tools = c.tools.map((t) => Object.assign({}, t, { svc: c.id }));
  });

  function mockResponse(tool, svc, file) {
    return {
      status: 'pending',
      message: 'This forensic engine is currently under development.',
      module: svc.module,
      version: svc.version,
      service: svc.name,
      estimate: 'Future Release',
      tool: tool.name,
      file: file ? file.name : null,
    };
  }

  const ForensicServices = {
    HashToolService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.hash, file)) },
    ImageForensicsService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.image, file)) },
    DocumentForensicsService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.document, file)) },
    VideoForensicsService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.video, file)) },
    AudioForensicsService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.audio, file)) },
    BlockchainService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.blockchain, file)) },
    CryptographyService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.crypto, file)) },
    MetadataService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.metadata, file)) },
    TimelineService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.timeline, file)) },
    UtilityService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.utility, file)) },
    AIService: { run: (tool, file) => Promise.resolve(mockResponse(tool, SVC.ai, file)) },
  };
  if (typeof window !== 'undefined') window.ForensicServices = ForensicServices;

  /* ------------------------------------------------------------- helpers */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(node.style, attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    const appendChildList = (list) => {
      (list || []).forEach((c) => {
        if (c) {
          if (typeof c === 'string') node.appendChild(document.createTextNode(c));
          else if (Array.isArray(c)) appendChildList(c);
          else node.appendChild(c);
        }
      });
    };
    appendChildList(children);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch (e) { /* noop */ }
    }
  }

  function fmtBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function nowStamp() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
  }

  function nowDate() {
    return new Date().toLocaleDateString('en-GB') + ' ' + nowStamp();
  }

  function findCategory(catId) {
    return CATALOG.find((c) => c.id === catId);
  }

  function findTool(catId, toolId) {
    const cat = findCategory(catId);
    if (!cat) return null;
    return cat.tools.find((t) => t.id === toolId) || null;
  }

  function serviceFor(tool) {
    return SVC[tool.svc] || SVC.utility;
  }

  const STATUS_TEXT = { available: 'Available', beta: 'Beta', 'coming-soon': 'Coming Soon' };

  function statusBadge(status) {
    return el('span', { class: 'fl-badge ' + status, text: STATUS_TEXT[status] || status });
  }

  function statusDot(status) {
    return el('span', { class: 'fl-dot ' + status });
  }

  /* ------------------------------------------------------------- state */
  const state = {
    initialized: false,
    currentCat: null,
    currentTool: null,
    file: null,
    analyzing: false,
    timers: [],
    lastRun: null,
    vaultMin: false,
  };

  function clearTimers() {
    state.timers.forEach((t) => clearTimeout(t));
    state.timers = [];
  }

  /* ------------------------------------------------------------- sidebar */
  function renderSidebar(root) {
    clear(root);
    root.appendChild(el('div', { class: 'fl-sidebar-head' },
      el('span', { class: 'fl-mark' }, [el('i', { 'data-lucide': 'microscope', style: 'width:18px;height:18px;' })]),
      el('div', {},
        el('h3', { text: 'Forensic Lab' }),
        el('p', { text: 'Evidence analysis modules' }),
      ),
    ));
    const nav = el('div', { class: 'fl-sidebar-nav' });
    root.appendChild(nav);
    root.appendChild(el('div', { class: 'fl-sidebar-foot' },
      el('i', { 'data-lucide': 'shield-check', style: 'width:13px;height:13px;' }),
      el('span', { text: 'Engines pending integration' }),
    ));

    CATALOG.forEach((cat, idx) => {
      const catDiv = el('div', { class: 'fl-category' + (idx === 0 ? ' open' : '') });
      const head = el('button', {
        class: 'fl-cat-head',
        type: 'button',
        'aria-expanded': idx === 0 ? 'true' : 'false',
      },
        el('span', { class: 'fl-cat-ico' }, [el('i', { 'data-lucide': cat.icon, style: 'width:14px;height:14px;' })]),
        el('span', { text: cat.name }),
        el('span', { class: 'fl-cat-count', text: String(cat.tools.length) }),
        el('i', { class: 'fl-chevy', 'data-lucide': 'chevron-right', style: 'width:14px;height:14px;' }),
      );
      head.addEventListener('click', () => {
        const open = catDiv.classList.toggle('open');
        head.setAttribute('aria-expanded', String(open));
      });
      const toolsWrap = el('div', { class: 'fl-tools' },
        el('div', { class: 'fl-tools-inner' },
          cat.tools.map((tool) => {
            const btn = el('button', {
              class: 'fl-tool-item',
              type: 'button',
              'data-tool': tool.id,
              title: tool.desc,
            },
              el('i', { 'data-lucide': tool.icon, style: 'width:15px;height:15px;' }),
              el('span', { class: 'fl-tool-name', text: tool.name }),
              statusDot(tool.status),
            );
            btn.addEventListener('click', () => openTool(cat.id, tool.id));
            return btn;
          }),
        ),
      );
      catDiv.appendChild(head);
      catDiv.appendChild(toolsWrap);
      nav.appendChild(catDiv);
    });
    refreshIcons();
  }

  /* ------------------------------------------------------------- workspace */
  function renderWelcome(ws) {
    clear(ws);
    ws.appendChild(el('div', { class: 'fl-empty fl-fade-in' },
      el('i', { 'data-lucide': 'microscope', style: 'width:44px;height:44px;' }),
      el('h4', { text: 'Select a forensic tool' }),
      el('p', { text: 'Choose a module from the laboratory sidebar to begin.' }),
    ));
    refreshIcons();
  }

  function breadcrumb(cat, tool, onHome) {
    const bc = el('nav', { class: 'fl-breadcrumb', 'aria-label': 'Breadcrumb' },
      el('a', { text: 'Workstation', title: 'Back to lab home' }),
      el('i', { 'data-lucide': 'chevron-right', style: 'width:13px;height:13px;' }),
      el('a', { text: cat.name, title: 'Back to lab home' }),
      el('i', { 'data-lucide': 'chevron-right', style: 'width:13px;height:13px;' }),
      el('span', { text: tool.name }),
    );
    bc.querySelectorAll('a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); onHome(); }));
    return bc;
  }

  function renderVault(vault) {
    clear(vault);
    vault.classList.toggle('minimized', state.vaultMin);
    const minimized = vault.classList.contains('minimized');

    const minToggle = el('button', {
      class: 'fl-vault-min',
      type: 'button',
      'aria-label': minimized ? 'Expand evidence vault' : 'Minimize evidence vault',
      title: minimized ? 'Expand' : 'Minimize',
    }, [el('i', { 'data-lucide': minimized ? 'chevron-down' : 'chevron-up', style: 'width:15px;height:15px;' })]);

    const head = el('div', { class: 'fl-vault-head' },
      el('span', { class: 'fl-vault-ico' }, [el('i', { 'data-lucide': 'database', style: 'width:15px;height:15px;' })]),
      el('div', {},
        el('h3', { text: 'Evidence Vault' }),
        el('p', { text: minimized ? (state.file ? state.file.name + ' · ready for analysis' : 'Minimized') : 'Add evidence once — every tool analyses this file' }),
      ),
      minToggle,
    );
    minToggle.addEventListener('click', () => setVaultMinimized(!state.vaultMin));

    vault.appendChild(head);

    if (minimized) {
      vault.appendChild(el('div', { class: 'fl-vault-mini fl-fade-in' },
        el('i', { 'data-lucide': state.file ? 'check-circle-2' : 'database', style: 'width:15px;height:15px;' }),
        el('span', { class: 'fl-vault-mini-file', text: state.file ? state.file.name : 'No evidence added' }),
        el('span', { class: 'fl-vault-mini-size', text: state.file ? fmtBytes(state.file.size) : '' }),
        state.file ? (() => {
          const rem = el('button', { class: 'fl-file-clear', type: 'button', 'aria-label': 'Remove evidence' },
            el('i', { 'data-lucide': 'x', style: 'width:13px;height:13px;' }));
          rem.addEventListener('click', () => clearEvidence());
          return rem;
        })() : document.createTextNode(''),
      ));
      refreshIcons();
      return;
    }

    const input = el('input', { type: 'file', id: 'flFileInput', style: 'display:none;', 'aria-hidden': 'true' });
    const zone = el('div', { class: 'fl-upload', tabindex: '0', role: 'button', 'aria-label': 'Upload evidence file' },
      el('i', { class: 'fl-upload-ico', 'data-lucide': 'upload', style: 'width:20px;height:20px;' }),
      el('p', { text: 'Drag & drop evidence file here' }),
      el('small', { text: 'or select a file from your workstation' }),
      el('div', { class: 'fl-or', text: '—' }),
      el('button', { class: 'fl-browse', type: 'button' },
        el('i', { 'data-lucide': 'folder-open', style: 'width:14px;height:14px;' }),
        el('span', { text: 'Browse Files' }),
      ),
      el('div', { class: 'fl-formats' }, ['PDF', 'JPG', 'PNG', 'MP4', 'MP3', 'DOCX', 'TXT', 'JSON', 'BIN'].map((f) => el('span', { class: 'fl-format-chip', text: f }))),
      el('div', { id: 'flVaultFileRow' }),
      input,
    );

    function pick(files) {
      const f = files && files[0];
      if (!f) return;
      setEvidence(f);
    }

    zone.querySelector('.fl-browse').addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => pick(input.files));
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag');
      pick(e.dataTransfer.files);
    });
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });

    vault.appendChild(zone);

    if (state.file) {
      const row = el('div', { class: 'fl-file-row fl-fade-in' },
        el('i', { 'data-lucide': 'file', style: 'width:20px;height:20px;' }),
        el('div', { class: 'fn' },
          el('strong', { text: state.file.name }),
          el('small', { text: fmtBytes(state.file.size) + ' · ' + (state.file.type || 'unknown type') }),
        ),
        (() => {
          const btn = el('button', { class: 'fl-file-clear', type: 'button', 'aria-label': 'Remove evidence' },
            el('i', { 'data-lucide': 'x', style: 'width:13px;height:13px;' }));
          btn.addEventListener('click', () => clearEvidence());
          return btn;
        })(),
      );
      zone.appendChild(row);
      vault.appendChild(el('div', { class: 'fl-vault-ready fl-fade-in' },
        el('i', { 'data-lucide': 'check-circle-2', style: 'width:16px;height:16px;' }),
        el('span', { text: 'Evidence Ready for Analysis' }),
      ));
    }

    vault.appendChild(el('div', { class: 'fl-vault-hint' },
      el('i', { 'data-lucide': 'shield-check', style: 'width:13px;height:13px;' }),
      el('span', { text: 'Vault evidence is shared across all forensic tools in this laboratory.' }),
    ));
    refreshIcons();
  }

  function setVaultMinimized(min) {
    state.vaultMin = min;
    renderVault(document.querySelector('.fl-vault'));
  }

  function setEvidence(f) {
    state.file = f;
    clearTimers();
    state.analyzing = false;
    state.lastRun = null;
    state.vaultMin = true;
    renderVault(document.querySelector('.fl-vault'));
    if (state.currentTool && state.currentCat) {
      const cat = findCategory(state.currentCat);
      const tool = state.currentTool;
      if (cat) renderWorkspace(cat, tool);
    }
  }

  function clearEvidence() {
    state.file = null;
    clearTimers();
    state.analyzing = false;
    state.lastRun = null;
    state.vaultMin = false;
    renderVault(document.querySelector('.fl-vault'));
    if (state.currentTool && state.currentCat) {
      const cat = findCategory(state.currentCat);
      const tool = state.currentTool;
      if (cat) renderWorkspace(cat, tool);
    }
  }

  function renderWorkspace(cat, tool) {
    const ws = document.getElementById('flWorkspace');
    if (!ws) return;
    clear(ws);

    const home = () => { state.currentCat = null; state.currentTool = null; clearTimers(); state.analyzing = false; renderWelcome(ws); };
    const svc = serviceFor(tool);
    const hasEvidence = !!state.file;

    const head = el('div', { class: 'fl-ws-head fl-fade-in' },
      el('div', { class: 'fl-ws-icon' }, [el('i', { 'data-lucide': tool.icon, style: 'width:22px;height:22px;' })]),
      el('div', {},
        el('h2', { text: tool.name }),
        el('p', { text: tool.desc }),
        el('div', { class: 'fl-ws-meta' },
          statusBadge(tool.status),
          (function () {
            const b = el('span', { class: 'fl-badge module' },
              el('i', { 'data-lucide': 'cpu', style: 'width:12px;height:12px;' }),
              el('span', { text: svc.module }),
            );
            return b;
          })(),
        ),
      ),
    );

    const statusBanner = el('div', { class: 'fl-engine-status fl-fade-in' },
      el('div', { class: 'fl-es-ico' }, [el('i', { 'data-lucide': 'hammer', style: 'width:20px;height:20px;' })]),
      el('div', {},
        el('h4', { text: 'This Tool Is Under Development' }),
        el('p', {
          text: 'The ' + tool.name + ' module framework is prepared as part of the Digital Forensics Laboratory. The ' +
            svc.label + ' is currently being built and will power this tool in an upcoming release.',
        }),
        el('div', { class: 'fl-es-meta' },
          el('span', { class: 'fl-dev-chip', html: 'Module: <b>' + svc.module + '</b>' }),
          el('span', { class: 'fl-dev-chip', html: 'Version: <b>' + svc.version + '</b>' }),
          el('span', { class: 'fl-dev-chip', html: 'Release: <b>Pending Integration</b>' }),
        ),
      ),
    );

    const evidenceHint = el('div', { class: 'fl-vault-hint', style: 'margin:0 0 16px;' },
      el('i', { 'data-lucide': hasEvidence ? 'check-circle-2' : 'file-plus', style: 'width:13px;height:13px;' }),
      el('span', { text: hasEvidence ? 'Running against: ' + state.file.name : 'No evidence in the Evidence Vault yet — add a file above to begin analysis.' }),
    );

    const actions = el('div', { class: 'fl-actions' },
      (() => {
        const btn = el('button', { class: 'fl-btn fl-btn-primary', type: 'button', id: 'flAnalyzeBtn' },
          el('i', { 'data-lucide': 'play-circle', style: 'width:15px;height:15px;' }),
          el('span', { text: 'Analyze' }),
        );
        if (!hasEvidence) {
          btn.setAttribute('disabled', 'disabled');
          btn.title = 'Add evidence to the Evidence Vault first.';
        }
        btn.addEventListener('click', () => runAnalysis());
        return btn;
      })(),
      (() => {
        const btn = el('button', { class: 'fl-btn fl-btn-ghost', type: 'button', id: 'flReportBtn' },
          el('i', { 'data-lucide': 'file-text', style: 'width:15px;height:15px;' }),
          el('span', { text: 'Report Preview' }),
        );
        btn.addEventListener('click', () => renderReport(cat, tool));
        btn.title = 'Available after forensic engine integration.';
        return btn;
      })(),
    );

    const grid = el('div', { class: 'fl-grid' });
    const previewPanel = el('div', { class: 'fl-panel' },
      el('div', { class: 'fl-panel-head' }, [el('i', { 'data-lucide': 'file-search', style: 'width:15px;height:15px;' }), el('span', { text: 'Original Evidence' })]),
      el('div', { id: 'flPreviewBody' }),
    );
    const processPanel = el('div', { class: 'fl-panel' },
      el('div', { class: 'fl-panel-head' }, [el('i', { 'data-lucide': 'cpu', style: 'width:15px;height:15px;' }), el('span', { text: 'Processing Engine' })]),
      el('div', { id: 'flProcessBody' }),
    );
    const resultsPanel = el('div', { class: 'fl-panel' },
      el('div', { class: 'fl-panel-head' }, [el('i', { 'data-lucide': 'clipboard-list', style: 'width:15px;height:15px;' }), el('span', { text: 'Analysis Results' })]),
      el('div', { id: 'flResultsBody' }),
    );
    grid.appendChild(previewPanel);
    grid.appendChild(processPanel);
    grid.appendChild(resultsPanel);

    const bottom = el('div', { class: 'fl-bottom', id: 'flBottom' });

    ws.appendChild(breadcrumb(cat, tool, home));
    ws.appendChild(head);
    ws.appendChild(statusBanner);
    ws.appendChild(evidenceHint);
    ws.appendChild(actions);
    ws.appendChild(grid);
    ws.appendChild(bottom);
    refreshIcons();

    renderPreview(ws, state.file);
    renderProcessing(ws, state.file ? 'idle' : 'no-evidence');
    renderResults(ws, null);
    renderBottom(ws, null);
  }

  /* ------------------------------------------------------------- panels */
  function renderPreview(ws, f) {
    const body = ws.querySelector('#flPreviewBody');
    if (!body) return;
    clear(body);
    if (!f) {
      body.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'image' }),
        el('p', { text: 'Add evidence in the Evidence Vault to preview its contents here.' }),
      ));
    } else {
      body.appendChild(el('div', { class: 'fl-tile fl-fade-in' },
        el('div', { class: 'thumb' }, [el('i', { 'data-lucide': 'file', style: 'width:38px;height:38px;' })]),
        el('div', { class: 'fin-name', text: f.name }),
        el('div', { class: 'fin-sz', text: fmtBytes(f.size) }),
      ));
      body.appendChild(el('dl', { class: 'fl-kv' },
        el('dt', { text: 'File' }), el('dd', { text: f.name }),
        el('dt', { text: 'Size' }), el('dd', { text: fmtBytes(f.size) }),
        el('dt', { text: 'Type' }), el('dd', { text: f.type || 'unknown' }),
        el('dt', { text: 'Modified' }), el('dd', { text: f.lastModified ? new Date(f.lastModified).toLocaleString() : '—' }),
      ));
    }
    refreshIcons();
  }

  function renderProcessing(ws, phase) {
    const body = ws.querySelector('#flProcessBody');
    if (!body) return;
    clear(body);
    if (phase === 'loading') {
      const steps = [
        { id: 1, label: 'Acquiring evidence file', icon: 'folder-open' },
        { id: 2, label: 'Computing integrity hashes', icon: 'hash' },
        { id: 3, label: 'Running forensic engine', icon: 'cpu' },
        { id: 4, label: 'Verifying blockchain records', icon: 'shield-check' },
        { id: 5, label: 'Compiling results', icon: 'file-check' },
      ];
      body.appendChild(el('div', { class: 'fl-loader fl-fade-in' },
        el('div', { class: 'fl-skel', style: 'height:12px;width:70%;' }),
        el('div', { class: 'fl-skel', style: 'height:12px;width:85%;' }),
        el('div', { class: 'fl-skel', style: 'height:12px;width:60%;' }),
        el('div', { class: 'fl-analysis-steps' }, steps.map((s) =>
          el('div', { class: 'fl-step' + (s.id === 1 ? ' active' : '') + (s.id < 1 ? ' done' : ''), 'data-step': s.id },
            el('span', { class: 'fl-step-ico' }, [el('i', { 'data-lucide': s.icon, style: 'width:12px;height:12px;' })]),
            el('span', { text: s.label }),
          )),
        ),
      ));
    } else if (phase === 'dev') {
      const svc = state.currentTool ? serviceFor(state.currentTool) : SVC.utility;
      body.appendChild(el('div', { class: 'fl-dev-card fl-fade-in' },
        el('i', { class: 'fl-dev-ico', 'data-lucide': 'construction', style: 'width:26px;height:26px;' }),
        el('h4', { text: 'Forensic Engine Under Development' }),
        el('p', {
          text: 'This workspace has been prepared as part of the Digital Forensics Laboratory framework. The ' +
            svc.label + ' will power this module once the engine is integrated.',
        }),
        el('div', { class: 'fl-dev-meta' },
          el('span', { class: 'fl-dev-chip', html: 'Status: <b>Coming Soon</b>' }),
          el('span', { class: 'fl-dev-chip', html: 'Module: <b>' + svc.module + '</b>' }),
          el('span', { class: 'fl-dev-chip', html: 'Version: <b>' + svc.version + '</b>' }),
        ),
      ));
    } else if (phase === 'no-evidence') {
      body.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'database' }),
        el('p', { text: 'Add evidence in the Evidence Vault above, then start the analysis.' }),
      ));
    } else {
      body.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'cpu' }),
        el('p', { text: 'The processing engine will execute here after integration.' }),
      ));
    }
    refreshIcons();
  }

  function renderResults(ws, mode) {
    const body = ws.querySelector('#flResultsBody');
    if (!body) return;
    clear(body);
    if (mode === 'dev') {
      const cards = [
        { icon: 'badge-check', title: 'Integrity', text: 'Awaiting forensic engine.' },
        { icon: 'tags', title: 'Metadata', text: 'Awaiting forensic engine.' },
        { icon: 'link-2', title: 'Blockchain', text: 'Awaiting forensic engine.' },
        { icon: 'sparkles', title: 'AI Findings', text: 'Awaiting forensic engine.' },
        { icon: 'shield-alert', title: 'Risk Level', text: 'Awaiting forensic engine.' },
        { icon: 'clock', title: 'Evidence Timeline', text: 'Awaiting forensic engine.' },
        { icon: 'sticky-note', title: 'Notes', text: 'Awaiting forensic engine.' },
        { icon: 'list-checks', title: 'Recommendations', text: 'Awaiting forensic engine.' },
      ];
      cards.forEach((c) => {
        body.appendChild(el('div', { class: 'fl-result-card fl-fade-in' },
          el('div', { class: 'fl-rc-head' },
            el('i', { 'data-lucide': c.icon, style: 'width:15px;height:15px;' }),
            el('span', { text: c.title }),
          ),
          el('div', { class: 'fl-rc-body' },
            el('i', { 'data-lucide': 'hourglass', style: 'width:13px;height:13px;' }),
            el('span', { text: c.text }),
          ),
        ));
      });
    } else {
      body.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'clipboard-list' }),
        el('p', { text: 'Analysis results will appear here once the forensic engine is integrated.' }),
      ));
    }
    refreshIcons();
  }

  function renderBottom(ws, mode) {
    const bottom = ws.querySelector('#flBottom');
    if (!bottom) return;
    clear(bottom);
    const tabs = [
      { id: 'log', label: 'Processing Log', icon: 'terminal' },
      { id: 'timeline', label: 'Activity Timeline', icon: 'history' },
      { id: 'history', label: 'Analysis History', icon: 'archive' },
    ];
    const bar = el('div', { class: 'fl-tabs', role: 'tablist' });
    const panes = {};
    tabs.forEach((t, i) => {
      const btn = el('button', { class: 'fl-tab-btn' + (i === 0 ? ' active' : ''), type: 'button', role: 'tab', 'data-tab': t.id },
        el('i', { 'data-lucide': t.icon, style: 'width:14px;height:14px;' }),
        el('span', { text: t.label }),
      );
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.fl-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        Object.keys(panes).forEach((k) => panes[k].classList.toggle('active', k === t.id));
      });
      bar.appendChild(btn);
      const pane = el('div', { class: 'fl-tab-pane' + (i === 0 ? ' active' : ''), role: 'tabpanel', id: 'flPane-' + t.id });
      bottom.appendChild(pane);
      panes[t.id] = pane;
    });
    bottom.insertBefore(bar, bottom.firstChild);

    const logPane = panes.log;
    const tlPane = panes.timeline;
    const histPane = panes.history;

    if (mode === 'dev') {
      const lines = [
        { t: nowStamp(), cls: 'ok', txt: '[engine] forensic engine module loaded' },
        { t: nowStamp(), cls: 'info', txt: '[engine] module ' + serviceFor(state.currentTool).module + ' queued' },
        { t: nowStamp(), cls: 'info', txt: '[engine] engine integration pending' },
        { t: nowStamp(), cls: 'warn', txt: '[engine] placeholder mode — no forensic algorithms executed' },
        { t: nowStamp(), cls: 'info', txt: '[engine] results pipeline prepared' },
      ];
      logPane.appendChild(el('div', { class: 'fl-console' }, lines.map((l) =>
        el('div', { class: 'fl-log-line' },
          el('span', { class: 't', text: l.t }),
          el('span', { class: l.cls, text: l.txt }),
        ),
      )));

      tlPane.appendChild(el('div', { class: 'fl-timeline' },
        el('div', { class: 'fl-tl-item' },
          el('div', { class: 'h', text: 'Analysis session opened' }),
          el('div', { class: 's', text: nowDate() + ' · ' + state.currentTool.name }),
        ),
        el('div', { class: 'fl-tl-item' },
          el('div', { class: 'h', text: 'Evidence staged for analysis' }),
          el('div', { class: 's', text: nowDate() + ' · ' + (state.file ? state.file.name : '—') }),
        ),
        el('div', { class: 'fl-tl-item' },
          el('div', { class: 'h', text: 'Engine response received' }),
          el('div', { class: 's', text: nowDate() + ' · pending integration' }),
        ),
      ));

      const entry = el('div', { class: 'fl-h-item fl-fade-in' },
        el('i', { 'data-lucide': 'microscope' }),
        el('span', { text: state.currentTool.name }),
        el('span', { class: 'when', text: nowStamp() }),
      );
      histPane.appendChild(el('div', { class: 'fl-history' }, [entry]));
    } else {
      logPane.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'terminal' }),
        el('p', { text: 'Engine activity will be logged here.' }),
      ));
      tlPane.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'history' }),
        el('p', { text: 'Activity events will appear here.' }),
      ));
      histPane.appendChild(el('div', { class: 'fl-placeholder-body' },
        el('i', { 'data-lucide': 'archive' }),
        el('p', { text: 'Past analysis sessions will appear here.' }),
      ));
    }
    refreshIcons();
  }

  /* ------------------------------------------------------------- analyze */
  function runAnalysis() {
    if (!state.currentTool || !state.file || state.analyzing) return;
    state.analyzing = true;
    clearTimers();
    const ws = document.getElementById('flWorkspace');
    const analyzeBtn = ws && ws.querySelector('#flAnalyzeBtn');
    if (analyzeBtn) analyzeBtn.setAttribute('disabled', 'disabled');

    renderProcessing(ws, 'loading');
    renderResults(ws, null);
    renderBottom(ws, null);

    const steps = ws.querySelectorAll('.fl-step');
    const timer = (ms, fn) => {
      const t = setTimeout(fn, ms);
      state.timers.push(t);
      return t;
    };

    timer(450, () => stepActive(0));
    timer(900, () => stepActive(1));
    timer(1350, () => stepActive(2));
    timer(1800, () => stepActive(3));

    const svc = serviceFor(state.currentTool);
    const tool = state.currentTool;
    timer(2300, async () => {
      let result;
      try {
        const svcImpl = ForensicServices[svc.name];
        result = await (svcImpl ? svcImpl.run(tool, state.file) : mockResponse(tool, svc, state.file));
      } catch (e) {
        result = mockResponse(tool, svc, state.file);
      }
      state.analyzing = false;
      state.lastRun = result;
      renderProcessing(ws, 'dev');
      renderResults(ws, 'dev');
      renderBottom(ws, 'dev');
      if (analyzeBtn) analyzeBtn.removeAttribute('disabled');
    });

    function stepActive(idx) {
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === idx);
        s.classList.toggle('done', i < idx);
      });
    }
  }

  /* ------------------------------------------------------------- report */
  function renderReport(cat, tool) {
    const ws = document.getElementById('flWorkspace');
    if (!ws) return;
    clear(ws);

    const home = () => { state.currentCat = null; state.currentTool = null; clearTimers(); state.analyzing = false; renderWelcome(ws); };
    const svc = serviceFor(tool);
    const file = state.file;

    const report = el('div', { class: 'fl-report fl-fade-in' });

    report.appendChild(el('div', { class: 'fl-report-head' },
      el('h3', {},
        el('i', { 'data-lucide': 'file-text', style: 'width:18px;height:18px;' }),
        el('span', { text: 'Forensic Analysis Report — ' + tool.name }),
      ),
      el('span', { class: 'fl-badge coming-soon', text: 'Preview' }),
    ));

    const panels = [
      { icon: 'briefcase', title: 'Executive Summary', hint: 'Summary generated after engine integration.' },
      { icon: 'file', title: 'Evidence Information', hint: file ? file.name + ' · ' + fmtBytes(file.size) : 'Evidence details appear here.' },
      { icon: 'search', title: 'Analysis Findings', hint: 'Engine findings appear here.' },
      { icon: 'link-2', title: 'Blockchain Verification', hint: 'Blockchain anchoring results appear here.' },
      { icon: 'sticky-note', title: 'Analyst Notes', hint: 'Analyst observations appear here.' },
      { icon: 'paperclip', title: 'Attachments', hint: 'Supporting exhibits appear here.' },
      { icon: 'pen-tool', title: 'Digital Signature', hint: 'Signed by the analyst workstation after engine integration.' },
      { icon: 'scale', title: 'Court Ready Report', hint: 'Formatting and certification applied on export.' },
    ];

    panels.forEach((p) => {
      report.appendChild(el('div', { class: 'fl-report-panel' },
        el('div', { class: 'fl-rp-head' },
          el('i', { 'data-lucide': p.icon, style: 'width:16px;height:16px;' }),
          el('span', { text: p.title }),
        ),
        el('div', { class: 'fl-rp-body fl-rp-placeholder' },
          el('p', { text: p.hint }),
        ),
      ));
    });

    report.appendChild(el('div', { class: 'fl-sig' },
      el('i', { 'data-lucide': 'shield-check', style: 'width:20px;height:20px;' }),
      el('span', { text: 'Available after forensic engine integration. Reports will be signed, timestamped and anchored to the blockchain.' }),
    ));

    ws.appendChild(breadcrumb(cat, tool, home));
    ws.appendChild(el('div', { class: 'fl-ws-head fl-fade-in' },
      el('div', { class: 'fl-ws-icon' }, [el('i', { 'data-lucide': tool.icon, style: 'width:22px;height:22px;' })]),
      el('div', {},
        el('h2', { text: 'Report Preview' }),
        el('p', { text: tool.desc }),
        el('div', { class: 'fl-ws-meta' }, statusBadge(tool.status)),
      ),
    ));
    ws.appendChild(el('div', { class: 'fl-report-actions' },
      (() => {
        const btn = el('button', { class: 'fl-btn fl-btn-primary', type: 'button', disabled: 'disabled', title: 'Available after forensic engine integration.' },
          el('i', { 'data-lucide': 'save', style: 'width:15px;height:15px;' }),
          el('span', { text: 'Save Report' }),
        );
        return btn;
      })(),
      (() => {
        const btn = el('button', { class: 'fl-btn fl-btn-ghost', type: 'button', disabled: 'disabled', title: 'Available after forensic engine integration.' },
          el('i', { 'data-lucide': 'download', style: 'width:15px;height:15px;' }),
          el('span', { text: 'Export PDF' }),
        );
        return btn;
      })(),
      (() => {
        const btn = el('button', { class: 'fl-btn fl-btn-ghost', type: 'button', title: 'Back to analysis workspace' },
          el('i', { 'data-lucide': 'arrow-left', style: 'width:15px;height:15px;' }),
          el('span', { text: 'Back to Workspace' }),
        );
        btn.addEventListener('click', () => { if (state.currentCat && state.currentTool) renderWorkspace(findCategory(state.currentCat), state.currentTool); });
        return btn;
      })(),
    ));
    ws.appendChild(report);
    refreshIcons();
  }

  /* ------------------------------------------------------------- open */
  function openTool(catId, toolId) {
    const cat = findCategory(catId);
    const tool = findTool(catId, toolId);
    if (!cat || !tool) return;
    state.currentCat = catId;
    state.currentTool = tool;
    clearTimers();
    renderWorkspace(cat, tool);
    document.querySelectorAll('.fl-tool-item').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === toolId);
    });
  }

  function ensureInit() {
    if (state.initialized) return;
    const lab = document.getElementById('flLab');
    if (!lab) return;
    state.initialized = true;
    const sidebar = el('aside', { class: 'fl-sidebar', 'aria-label': 'Forensic tool categories' });
    const col = el('div', { class: 'fl-col' });
    const vault = el('section', { class: 'fl-vault' });
    const ws = el('main', { class: 'fl-workspace', id: 'flWorkspace', 'aria-live': 'polite' });
    col.appendChild(vault);
    col.appendChild(ws);
    lab.appendChild(sidebar);
    lab.appendChild(col);
    renderSidebar(sidebar);
    renderVault(vault);
    renderWelcome(ws);
  }

  window.ForensicLab = {
    ensureInit: ensureInit,
    openTool: openTool,
    setVaultMinimized: setVaultMinimized,
    getState: () => state,
    catalog: CATALOG,
    services: ForensicServices,
  };
})();
