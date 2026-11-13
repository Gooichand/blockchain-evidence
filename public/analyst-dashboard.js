/**
 * EVID-DGC Forensic Analyst Workstation — dashboard controller.
 * All data is fetched from the role-scoped /analyst API. No hardcoded records.
 * Dynamic content rendered with textContent / DOM primitives (no unsafe innerHTML).
 */
const AnalystDashboard = (() => {
  let openTaskId = null;
  const queueState = { items: [], status: '', priority: '', search: '', page: 1, limit: 20, total: 0, pages: 0 };
  const reportsState = { items: [], status: '', page: 1, limit: 20, total: 0, pages: 0 };
  let queueSeq = 0;
  let reportsSeq = 0;
  let dashboardSeq = 0;
  let wsEditor = null; // active report editor dirty-tracker, reset per workspace render

  // ---------------------------------------------------------------- helpers
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (v === true) return node.setAttribute(k, '');
      if (k === 'class') return (node.className = v);
      if (k === 'text') return (node.textContent = v);
      if (k.startsWith('on') && typeof v === 'function') return node.addEventListener(k.slice(2), v);
      node.setAttribute(k, v);
    });
    children.flat().forEach((c) => {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function loadingBlock(text) {
    return el('div', { class: 'analyst-loading' },
      el('div', { class: 'spinner', style: 'border-top-color:#7c3aed;' }),
      el('p', { text: text || 'Loading…' }),
    );
  }

  function errorBlock(message, retryFn) {
    const box = el('div', { class: 'analyst-error' },
      el('i', { 'data-lucide': 'triangle-alert', class: 'error-icon' }),
      el('p', { text: message }),
    );
    if (retryFn) {
      box.appendChild(el('button', { class: 'btn btn-outline btn-sm', text: 'Retry', type: 'button', onclick: retryFn }));
    }
    return box;
  }

  function emptyBlock(title, message) {
    return el('div', { class: 'analyst-empty' },
      el('i', { 'data-lucide': 'inbox' }),
      el('strong', { text: title }),
      el('span', { text: message }),
    );
  }

  function badge(text, cls) {
    return el('span', { class: 'evid-badge ' + (cls || ''), text: text });
  }

  function toTitle(s) {
    return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function shortHash(h) {
    if (!h) return '—';
    return h.length > 18 ? h.slice(0, 9) + '…' + h.slice(-6) : h;
  }

  function fmtBytes(bytes) {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = Number(bytes);
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 100 ? 0 : 1) + ' ' + units[i];
  }

  async function copyBtn(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  function copyButton(text, ariaLabel) {
    return el('button', {
      class: 'copy-btn', type: 'button', 'aria-label': ariaLabel || 'Copy to clipboard',
      onclick: async (e) => {
        const btn = e.currentTarget;
        const ok = await copyBtn(text || '');
        if (ok) {
          btn.innerHTML = '';
          btn.appendChild(el('i', { 'data-lucide': 'check' }));
          setTimeout(() => { btn.innerHTML = '<i data-lucide="copy"></i>'; refreshIcons(); }, 1400);
        }
      },
    }, el('i', { 'data-lucide': 'copy' }));
  }

  function qrImg(data, label) {
    const url = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(data);
    return el('img', { src: url, alt: label || 'QR code', class: 'qr-preview', 'aria-label': label || 'QR code' });
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function metaBlock(label, value) {
    return el('span', { class: 'meta-block' },
      el('span', { text: label + ': ' }),
      el('strong', { text: value || '—' }),
    );
  }

  function progressTrack(value, done) {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    const track = el('div', { class: 'progress-track' },
      el('div', { class: 'progress-fill' + (done ? ' done' : ''), style: 'width:' + pct + '%' }),
    );
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuenow', String(pct));
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-label', 'Progress ' + pct + '%');
    return track;
  }

  // Reads the shared {page, limit, total, pages} envelope; returns null when the
  // endpoint does not (yet) return one so callers can fall back gracefully.
  function readPagination(res, rowCount) {
    const p = res && res.pagination;
    if (p && Number.isFinite(Number(p.page)) && Number.isFinite(Number(p.total))) {
      const limit = Number(p.limit) || rowCount || 20;
      const total = Number(p.total) || 0;
      return {
        page: Number(p.page),
        limit: limit,
        total: total,
        pages: Number.isFinite(Number(p.pages)) ? Number(p.pages) : Math.ceil(total / limit),
      };
    }
    return null;
  }

  // Shared pager control: Prev / Page x of y / Next plus a total count.
  function pager(state, onPage, ariaLabel) {
    const pages = Math.max(state.pages || (state.total > 0 ? 1 : 0), 0);
    const wrap = el('div', { class: 'pager', role: 'navigation', 'aria-label': ariaLabel || 'Pages' });
    const prev = el('button', {
      class: 'btn btn-outline btn-sm', type: 'button', text: 'Previous',
      disabled: state.page <= 1, 'aria-label': 'Previous page',
      onclick: () => onPage(state.page - 1),
    });
    const next = el('button', {
      class: 'btn btn-outline btn-sm', type: 'button', text: 'Next',
      disabled: pages === 0 || state.page >= pages, 'aria-label': 'Next page',
      onclick: () => onPage(state.page + 1),
    });
    const label = el('span', {
      class: 'pager-label',
      text: pages === 0 ? 'No pages' : 'Page ' + state.page + ' of ' + pages,
    });
    const total = el('span', { class: 'pager-total', text: state.total + ' total' });
    wrap.appendChild(prev);
    wrap.appendChild(label);
    wrap.appendChild(next);
    wrap.appendChild(total);
    return wrap;
  }

  // Error code from the shared {success:false,error,code} envelope.
  function errCode(error) {
    return (error && error.data && error.data.code) || '';
  }

  function transitionMessage(error) {
    const code = errCode(error);
    if (error && error.status === 409 && code === 'FINALIZED') {
      return 'This report or task is already finalized and is now read-only.';
    }
    if (error && error.status === 409 && code === 'STALE_REVISION') {
      return 'This report changed elsewhere. Reload to review before editing again — your current text is preserved below.';
    }
    if (error && error.status === 409 && code === 'DUPLICATE_REPORTS') {
      return 'Duplicate reports exist for this task. An administrator must review them; no automatic repair is possible.';
    }
    if (error && error.status === 503 && code === 'REPORT_TRANSITION_UNAVAILABLE') {
      return 'Report saving is temporarily unavailable. Retry later — your input is preserved.';
    }
    if (error && error.status === 404) {
      return 'Task unavailable or not assigned to you.';
    }
    if (error && error.status === 429) {
      return 'Too many requests. Wait a moment and try again.';
    }
    return null;
  }

  function statusExplainer(status) {
    const text = {
      pending: 'Pending: assigned to you, analysis not started yet.',
      in_progress: 'In progress: analysis started; drafts and notes can still be edited.',
      submitted: 'Submitted: the report is finalized and immutable; the task is complete.',
      completed: 'Completed: the report is finalized and immutable.',
      archived: 'Archived: retained read-only for the record.',
    }[String(status || '').toLowerCase()];
    return text || 'Status: ' + toTitle(status || 'unknown');
  }

  // ---------------------------------------------------------------- api
  function apiGet(path) { return window.apiClient.get(path, { skipWalletAuth: true }); }
  function apiPost(path, body) { return window.apiClient.post(path, body || {}, { skipWalletAuth: true }); }
  function apiPut(path, body) { return window.apiClient.request(path, { method: 'PUT', body: JSON.stringify(body || {}), skipWalletAuth: true }); }

  // Authenticated file download. Tokens stay in headers, never in URLs.
  // Returns { blob, filename } or throws an Error with .status.
  async function apiDownload(path, fallbackName) {
    const base = (window.config && window.config.API_BASE_URL) || '/api';
    const headers = { credentials: 'include' };
    const init = { credentials: 'include', headers: {} };
    const token = localStorage.getItem('authToken');
    if (token) init.headers['Authorization'] = 'Bearer ' + token;
    const response = await fetch(base + path, init);
    if (!response.ok) {
      let message = 'HTTP error ' + response.status;
      try {
        const data = await response.json();
        if (data && data.error) message = data.error;
      } catch { /* non-JSON error body */ }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    let filename = fallbackName;
    const disp = response.headers.get('content-disposition') || '';
    const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disp);
    if (match) {
      // Keep only a conservative filename character set.
      const cleaned = decodeURIComponent(match[1]).replace(/[^\w.()-]+/g, '_').slice(-120);
      if (cleaned) filename = cleaned;
    }
    return { blob, filename };
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadErrorMessage(error, what) {
    if (error && error.status === 401) return 'Session expired. Sign in again to download the ' + what + '.';
    if (error && error.status === 403) return 'You do not have permission to export this ' + what + '.';
    if (error && error.status === 429) return 'Too many requests. Wait a moment and try again.';
    return 'Could not download the ' + what + '. ' + ((error && error.message) || 'Check your connection.');
  }

  // ---------------------------------------------------------------- session / init
  function loadSession() {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem('evidUser_' + savedUser) ||
        localStorage.getItem('evidUser_' + String(savedUser).toLowerCase()) || '{}');
    } catch { user = {}; }
    return { user, token };
  }

  function init() {
    const { user, token } = loadSession();
    const role = user.role;
    if (!role || !token) {
      window.location.href = 'index.html';
      return;
    }
    if (role !== 'forensic_analyst' && String(role) !== '3') {
      const map = {
        public_viewer: 'dashboard-public.html',
        investigator: 'dashboard-investigator.html',
        legal_professional: 'dashboard-legal.html',
        court_official: 'dashboard-court.html',
        evidence_manager: 'dashboard-manager.html',
        auditor: 'dashboard-auditor.html',
        admin: 'admin.html',
        1: 'dashboard-public.html',
        2: 'dashboard-investigator.html',
        4: 'dashboard-legal.html',
        5: 'dashboard-court.html',
        6: 'dashboard-manager.html',
        7: 'dashboard-auditor.html',
        8: 'admin.html',
      };
      const target = map[role];
      if (target) window.location.href = target;
      return;
    }

    initTabs();
    initQueueToolbar();
    initReportsToolbar();
    initHeroActions();
    initGlobalSearch();
    initModal();
    initDirtyWarning();

    // Initial view from URL hash (e.g. #queue, #reports)
    const hash = (window.location.hash || '').replace('#', '');
    if (hash === 'queue' || hash === 'tools' || hash === 'reports' || hash === 'workspace') {
      showView(hash);
    } else {
      showView('dashboard');
    }
  }

  // ---------------------------------------------------------------- tabs
  // Roving tabindex + arrow-key navigation across the visible view tabs.
  function initTabs() {
    const tabs = Array.from(document.querySelectorAll('.analyst-tab'));
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.dataset.view === 'workspace' && !openTaskId) return;
        showView(tab.dataset.view);
        tab.focus();
      });
    });
    syncTabRoving();
    const nav = tabs[0] && tabs[0].closest('[role="tablist"]');
    if (nav) {
      nav.addEventListener('keydown', (e) => {
        const visible = tabs.filter((t) => !t.hidden);
        const current = visible.indexOf(document.activeElement);
        if (current === -1) return;
        let next = -1;
        if (e.key === 'ArrowRight') next = (current + 1) % visible.length;
        else if (e.key === 'ArrowLeft') next = (current - 1 + visible.length) % visible.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = visible.length - 1;
        if (next === -1) return;
        e.preventDefault();
        const tab = visible[next];
        if (tab.dataset.view === 'workspace' && !openTaskId) return;
        showView(tab.dataset.view);
        tab.focus();
      });
    }
    const backBtn = document.getElementById('workspaceBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (wsEditor && wsEditor.isDirty() && !window.confirm('You have unsaved report text. Leave the workspace and discard those changes?')) {
          return;
        }
        openTaskId = null;
        wsEditor = null;
        const wsTab = document.getElementById('tabWorkspace');
        if (wsTab) wsTab.hidden = true;
        syncTabRoving();
        showView('queue');
      });
    }
  }

  function syncTabRoving() {
    const tabs = Array.from(document.querySelectorAll('.analyst-tab'));
    const active = tabs.find((t) => t.classList.contains('active') && !t.hidden) || tabs.find((t) => !t.hidden);
    tabs.forEach((t) => t.setAttribute('tabindex', t === active ? '0' : '-1'));
  }

  function showView(name) {
    if (name !== 'workspace' && wsEditor && wsEditor.isDirty()) {
      if (!window.confirm('You have unsaved report text in the workspace. Switch view and discard those changes?')) {
        return;
      }
      wsEditor = null;
    }
    ['dashboard', 'queue', 'workspace', 'tools', 'reports'].forEach((v) => {
      const sec = document.getElementById('view-' + v);
      if (sec) sec.hidden = v !== name;
    });
    document.querySelectorAll('.analyst-tab').forEach((t) => {
      const active = t.dataset.view === name && t.hidden !== true;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    syncTabRoving();
    if (name === 'dashboard') loadDashboard();
    if (name === 'queue') loadQueue();
    if (name === 'tools') {
      loadTools();
      if (window.ForensicLab) window.ForensicLab.ensureInit();
    }
    if (name === 'reports') loadReports();
    if (name === 'workspace') loadWorkspace();
  }

  // ---------------------------------------------------------------- dashboard
  // Each panel loads independently: one failing source never erases the others.
  async function loadDashboard(force) {
    const metricsRoot = document.getElementById('analystMetrics');
    if (!metricsRoot) return;
    if (!force && metricsRoot.dataset.loaded === '1') {
      if (window.analystEvidence) window.analystEvidence.init();
      return;
    }
    const seq = ++dashboardSeq;
    clear(metricsRoot);
    metricsRoot.appendChild(loadingBlock('Loading analysis statistics…'));
    try {
      const res = await apiGet('/analyst/stats');
      if (seq !== dashboardSeq) return; // superseded by a newer refresh
      const data = res.data || {};
      renderStats(data);
      renderBlockchain(data.blockchain, data.sources && data.sources.blockchain);
      renderActivity(data.recent_activity, data.sources && data.sources.activity);
      refreshIcons();
      metricsRoot.dataset.loaded = '1';
      markDashboardUpdated(data);
      if (window.analystEvidence) window.analystEvidence.init();
    } catch (error) {
      if (seq !== dashboardSeq) return;
      clear(metricsRoot);
      metricsRoot.appendChild(errorBlock('Could not load statistics. ' + (error.message || 'Check your connection.'), () => loadDashboard(true)));
    }
  }

  function markDashboardUpdated(data) {
    const node = document.getElementById('dashboardUpdated');
    if (!node) return;
    const partial = data && data.partial === true;
    const genAt = data && data.generated_at;
    node.textContent = 'Last updated ' + fmtDate(new Date().toISOString()) +
      (genAt ? ' · data generated ' + fmtDate(genAt) : '') +
      (partial ? ' · some sources unavailable' : '');
    node.classList.toggle('dashboard-stale', partial);
  }

  function sourceState(sources, key) {
    const s = sources && sources[key];
    if (!s || !s.state) return 'ready'; // older backend without the sources envelope
    return s.state;
  }

  function sourceFoot(sources, key) {
    const s = sources && sources[key];
    if (!s) return '';
    const bits = [];
    if (s.checked_at) bits.push('checked ' + fmtDate(s.checked_at));
    if (s.meaning) bits.push(String(s.meaning));
    else if (s.source) bits.push('source: ' + String(s.source));
    return bits.join(' · ');
  }

  // value null/undefined renders as Unknown with a retry hint, never as 0.
  function metricCard(label, value, icon, cls, foot, unavailable) {
    const card = el('div', { class: 'metric-card ' + (cls || '') },
      el('div', { class: 'metric-top' },
        el('div', { class: 'metric-icon' }, el('i', { 'data-lucide': icon })),
      ),
      el('div', { class: 'metric-value', text: unavailable ? 'Unknown' : (value ?? '—') }),
      el('div', { class: 'metric-label', text: label }),
    );
    if (unavailable) card.classList.add('metric-unavailable');
    if (foot) card.appendChild(el('div', { class: 'metric-foot', text: foot }));
    return card;
  }

  function renderStats(s) {
    const root = document.getElementById('analystMetrics');
    if (!root) return;
    clear(root);
    const sources = s.sources || null;
    const tasksDown = sourceState(sources, 'tasks') === 'unavailable';
    const evidenceDown = sourceState(sources, 'evidence') === 'unavailable';
    const tasksFoot = sourceFoot(sources, 'tasks');
    const evidenceFoot = sourceFoot(sources, 'evidence');
    // Stored verification flags are record state, not a fresh integrity check.
    const verifiedFoot = ['Stored record flag, not a fresh integrity check', evidenceFoot].filter(Boolean).join(' · ');
    const cards = [
      metricCard('Assigned Evidence', s.assigned_evidence, 'files', '', evidenceFoot, evidenceDown),
      metricCard('Pending Queue', s.pending, 'clock', 'metric-orange', tasksFoot, tasksDown),
      metricCard('In Progress', s.in_progress, 'loader', 'metric-indigo', tasksFoot, tasksDown),
      metricCard('Completed Reports', s.completed, 'file-check', 'metric-green', tasksFoot, tasksDown),
      metricCard('Evidence Verified', s.evidence_verified, 'shield-check', 'metric-teal', verifiedFoot, evidenceDown),
      metricCard('High Priority', s.critical_priority, 'alert-triangle', 'metric-red', tasksFoot, tasksDown),
      metricCard('Avg Analysis Time', s.average_processing_minutes != null ? s.average_processing_minutes + 'm' : null, 'timer', 'metric-orange', tasksFoot, tasksDown),
      metricCard('Integrity Score', s.integrity_score != null ? s.integrity_score + '%' : null, 'badge-check', 'metric-green', verifiedFoot, evidenceDown),
    ];
    cards.forEach((c) => root.appendChild(c));

    const heroMap = {
      qsAssignedCases: s.assigned_cases,
      qsPending: s.pending,
      qsCompleted: s.completed,
      qsCritical: s.critical_priority,
    };
    Object.entries(heroMap).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value ?? '–';
    });
  }

  function renderBlockchain(bc, source) {
    const root = document.getElementById('analystBlockchain');
    if (!root) return;
    clear(root);
    if (source && source.state === 'unavailable') {
      root.appendChild(errorBlock('Blockchain status source unavailable' +
        (source.checked_at ? ' (last checked ' + fmtDate(source.checked_at) + ')' : '') +
        '. Records remain stored and read-only.', () => loadDashboard(true)));
      return;
    }
    if (!bc) {
      root.appendChild(emptyBlock('No blockchain status', 'Sync status will appear here once available.'));
      return;
    }
    const synced = bc.state === 'synced';
    const extra = [];
    if (bc.checked_at) extra.push('checked ' + fmtDate(bc.checked_at));
    else if (source && source.checked_at) extra.push('checked ' + fmtDate(source.checked_at));
    if (source && source.meaning) extra.push(String(source.meaning));
    const banner = el('div', { class: 'blockchain-banner' },
      el('i', { 'data-lucide': synced ? 'check-circle-2' : 'cloud-off' }),
      el('span', { text: (synced
        ? 'Blockchain node synced' + (bc.network ? ' · ' + bc.network : '') + (bc.block ? ' · block #' + Number(bc.block).toLocaleString() : '')
        : 'Blockchain verification unavailable — records remain stored and read-only.') + (extra.length ? ' · ' + extra.join(' · ') : '') }),
    );
    root.appendChild(banner);
  }

  function renderActivity(list, source) {
    const root = document.getElementById('analystActivity');
    if (!root) return;
    clear(root);
    if (source && source.state === 'unavailable') {
      root.appendChild(errorBlock('Activity feed unavailable' +
        (source.checked_at ? ' (last checked ' + fmtDate(source.checked_at) + ')' : '') + '.', () => loadDashboard(true)));
      return;
    }
    if (!list || list.length === 0) {
      root.appendChild(emptyBlock('No recent activity', 'Your analysis actions will appear here.'));
      return;
    }
    const timeline = el('div', { class: 'custody-timeline' });
    list.slice(0, 8).forEach((a) => {
      timeline.appendChild(el('li', {},
        el('div', { class: 'tl-stage', text: toTitle(a.action) }),
        el('div', { class: 'tl-time', text: fmtDate(a.timestamp) }),
      ));
    });
    root.appendChild(timeline);
  }

  // ---------------------------------------------------------------- queue
  function initQueueToolbar() {
    const search = document.getElementById('queueSearch');
    const status = document.getElementById('queueStatusFilter');
    const priority = document.getElementById('queuePriorityFilter');
    const refresh = document.getElementById('queueRefreshBtn');
    if (search) {
      search.addEventListener('input', debounce(() => {
        queueState.search = search.value.trim();
        queueState.page = 1; // filter change resets paging
        loadQueue();
      }, 400));
    }
    if (status) status.addEventListener('change', () => { queueState.status = status.value; queueState.page = 1; loadQueue(); });
    if (priority) priority.addEventListener('change', () => { queueState.priority = priority.value; queueState.page = 1; loadQueue(); });
    if (refresh) refresh.addEventListener('click', () => loadQueue());
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  async function loadQueue() {
    const list = document.getElementById('queueList');
    if (!list) return;
    const seq = ++queueSeq;
    clear(list);
    list.appendChild(loadingBlock('Loading analysis queue…'));
    const params = new URLSearchParams();
    params.set('page', String(queueState.page));
    params.set('limit', String(queueState.limit));
    if (queueState.status) params.set('status', queueState.status);
    if (queueState.priority) params.set('priority', queueState.priority);
    if (queueState.search) params.set('search', queueState.search);
    try {
      const res = await apiGet('/analyst/queue?' + params.toString());
      if (seq !== queueSeq) return; // a newer search/filter finished first; drop this stale response
      queueState.items = res.data || [];
      const pg = readPagination(res, queueState.items.length);
      if (pg) {
        queueState.page = pg.page;
        queueState.limit = pg.limit;
        queueState.total = pg.total;
        queueState.pages = pg.pages;
      } else {
        queueState.total = queueState.items.length;
        queueState.pages = queueState.items.length ? 1 : 0;
      }
      renderQueue(list);
    } catch (error) {
      if (seq !== queueSeq) return;
      clear(list);
      // Retry keeps the current filters and page.
      list.appendChild(errorBlock('Could not load the queue. ' + (error.message || 'Check your connection.'), loadQueue));
    }
  }

  function renderQueue(root) {
    clear(root);
    const summary = document.getElementById('queueSummary');
    const showing = queueState.items.length;
    const from = showing === 0 ? 0 : (queueState.page - 1) * queueState.limit + 1;
    const to = (queueState.page - 1) * queueState.limit + showing;
    if (summary) {
      summary.textContent = queueState.pages > 1 || queueState.total !== showing
        ? 'Showing ' + from + '–' + to + ' of ' + queueState.total + ' work items'
        : showing + ' work item' + (showing === 1 ? '' : 's') + ' in queue';
    }
    if (!queueState.items.length) {
      root.appendChild(emptyBlock('No analysis assigned',
        queueState.total > 0
          ? 'This page is empty. Go back to an earlier page or change the filters.'
          : 'Evidence assigned to you will appear here. New evidence is routed to the analyst queue when assigned.'));
    } else {
      queueState.items.forEach((item) => root.appendChild(renderWorkItem(item)));
    }
    const pagerHost = document.getElementById('queuePager');
    if (pagerHost) {
      clear(pagerHost);
      pagerHost.appendChild(pager(queueState, (page) => { queueState.page = page; loadQueue(); }, 'Queue pages'));
    }
    refreshIcons();
  }

  function renderWorkItem(item) {
    const ev = item.evidence || {};
    const prio = (item.priority || 'medium').toLowerCase();
    const status = item.status || 'pending';
    const prioCls = prio === 'critical' ? 'critical' : prio === 'high' ? 'high' : prio === 'low' ? 'low' : 'medium';

    const card = el('article', { class: 'work-item priority-' + prioCls });

    card.appendChild(el('div', { class: 'work-item-header' },
      el('div', { class: 'work-item-title' },
        badge(toTitle(prio), 'badge-priority-' + prio),
        el('span', { text: ev.name || 'Evidence #' + item.evidence_id }),
      ),
      badge(toTitle(status), 'badge-status-' + status),
    ));

    const meta = el('div', { class: 'work-item-meta' },
      metaBlock('Evidence ID', '#' + item.evidence_id),
      metaBlock('Case ID', item.case_number ? '#' + item.case_number : '—'),
      metaBlock('Type', ev.file_type || '—'),
      metaBlock('Assigned', fmtDate(item.assigned_at)),
      metaBlock('Requested By', item.requested_by || '—'),
    );
    card.appendChild(meta);

    if (ev.hash || ev.blockchain_tx_hash) {
      const hashes = el('div', { class: 'work-item-meta' });
      if (ev.hash) {
        hashes.appendChild(el('span', { class: 'meta-block' },
          el('span', { text: 'SHA-256: ' }),
          el('strong', { class: 'hashmono', text: shortHash(ev.hash) }),
          copyButton(ev.hash, 'Copy evidence hash'),
        ));
      }
      if (ev.blockchain_tx_hash) {
        hashes.appendChild(el('span', { class: 'meta-block' },
          el('span', { text: 'Tx: ' }),
          el('strong', { class: 'hashmono', text: shortHash(ev.blockchain_tx_hash) }),
          copyButton(ev.blockchain_tx_hash, 'Copy transaction hash'),
        ));
      }
      card.appendChild(hashes);
    }

    card.appendChild(progressTrack(item.progress, status === 'completed'));

    const actions = el('div', { class: 'work-item-actions' });
    const startBtn = el('button', {
      class: 'btn btn-primary btn-sm', type: 'button',
      text: status === 'pending' ? 'Start Analysis' : 'Continue Analysis',
      onclick: (e) => startAnalysis(item.evidence_id, item.case_id, e.currentTarget),
    });
    actions.appendChild(startBtn);
    actions.appendChild(el('button', {
      class: 'btn btn-outline btn-sm', type: 'button', text: 'Open Workspace',
      onclick: () => openWorkspace(item.id),
    }));
    card.appendChild(actions);
    return card;
  }

  async function startAnalysis(evidenceId, caseId, btn) {
    const confirmed = window.confirm('Start forensic analysis on Evidence #' + evidenceId + '?\nThis action is recorded to the audit trail.');
    if (!confirmed) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Starting…'; }
    try {
      const reply = await apiPost('/analyst/evidence/' + evidenceId + '/start', { caseId: caseId || null });
      window.alert('Analysis started (task #' + reply.data.task_id + '). Open the workspace to continue.');
      loadQueue();
      loadDashboard(true);
      if (window.analystEvidence) window.analystEvidence.init();
    } catch (error) {
      const special = transitionMessage(error);
      window.alert('Analysis could not be started: ' + (special || error.message || 'Unknown error'));
      if (btn) { btn.disabled = false; btn.textContent = 'Start Analysis'; }
    }
  }

  // ---------------------------------------------------------------- workspace
  function openWorkspace(taskId) {
    openTaskId = taskId;
    wsEditor = null;
    const tab = document.getElementById('tabWorkspace');
    if (tab) tab.hidden = false;
    syncTabRoving();
    showView('workspace');
  }

  async function loadWorkspace() {
    const root = document.getElementById('workspaceRoot');
    if (!root) return;
    clear(root);
    if (!openTaskId) {
      root.appendChild(emptyBlock('No workspace open', 'Select an item from the queue to begin.'));
      return;
    }
    root.appendChild(loadingBlock('Loading workspace…'));
    try {
      const res = await apiGet('/analyst/tasks/' + openTaskId);
      if (String(openTaskId) !== String((res.data && res.data.task && res.data.task.id) || openTaskId)) return;
      renderWorkspace(res.data);
    } catch (error) {
      clear(root);
      const special = transitionMessage(error);
      root.appendChild(errorBlock(special || 'Could not load workspace. ' + (error.message || 'Check your connection.'), loadWorkspace));
    }
  }

  function renderWorkspace(detail) {
    const root = document.getElementById('workspaceRoot');
    clear(root);
    const task = detail.task;
    if (!task) return;
    const ev = task.evidence || {};

    const defs = ['Overview', 'Evidence', 'Blockchain', 'Chain of Custody', 'Notes', 'Report'];
    const nav = el('nav', { class: 'ws-tabs', role: 'tablist', 'aria-label': 'Workspace sections' });
    const panels = defs.map((label, idx) => {
      const key = label.toLowerCase().replace(/\s+/g, '-');
      const btn = el('button', {
        class: 'ws-tab' + (idx === 0 ? ' active' : ''), role: 'tab', type: 'button', text: label,
        id: 'ws-tab-' + key,
        'aria-selected': String(idx === 0), 'aria-controls': 'ws-panel-' + key,
        tabindex: idx === 0 ? '0' : '-1',
        onclick: () => switchWsTab(nav, panels, idx, true),
      });
      nav.appendChild(btn);
      const panel = el('div', { class: 'ws-panel', role: 'tabpanel', id: 'ws-panel-' + key, 'aria-labelledby': 'ws-tab-' + key, hidden: idx !== 0, tabindex: '0' });
      return { key, node: panel };
    });
    nav.addEventListener('keydown', (e) => {
      const btns = Array.from(nav.querySelectorAll('.ws-tab'));
      const current = btns.indexOf(document.activeElement);
      if (current === -1) return;
      let next = -1;
      if (e.key === 'ArrowRight') next = (current + 1) % btns.length;
      else if (e.key === 'ArrowLeft') next = (current - 1 + btns.length) % btns.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = btns.length - 1;
      if (next === -1) return;
      e.preventDefault();
      switchWsTab(nav, panels, next, true);
    });

    // --- Overview
    const ov = el('div', {});
    ov.appendChild(el('h3', { text: 'Evidence #' + task.evidence_id + ' — ' + (ev.name || 'Untitled') }));
    ov.appendChild(el('p', { class: 'section-sub', text: statusExplainer(task.status) }));
    const kv = el('div', { class: 'kv-list' });
    [
      ['Case ID', task.case_number ? '#' + task.case_number : '—'],
      ['Case Title', detail.case ? detail.case.title : '—'],
      ['Priority', toTitle(task.priority)],
      ['Status', toTitle(task.status)],
      ['Progress', (Number(task.progress) || 0) + '%'],
      ['Assigned', fmtDate(task.assigned_at)],
      ['Started', fmtDate(task.started_at)],
      ['Completed', fmtDate(task.completed_at)],
      ['Estimated Time', task.estimated_time_minutes ? task.estimated_time_minutes + ' min' : '—'],
      ['Requested By', task.requested_by || '—'],
      ['Evidence Type', ev.file_type || '—'],
      ['File Size', fmtBytes(ev.file_size)],
      ['Blockchain Verified', ev.blockchain_verified ? 'Yes (stored record flag)' : 'No'],
      ['Redaction Status', ev.redaction_status || 'Sealed'],
    ].forEach(([k, v]) => {
      kv.appendChild(el('div', { class: 'kv' }, el('dt', { text: k }), el('dd', { text: v })));
    });
    ov.appendChild(kv);
    ov.appendChild(renderProgressControl(task));
    panels[0].node.appendChild(ov);

    // --- Evidence
    const evPanel = panels.find((p) => p.key === 'evidence').node;
    const evKv = el('div', { class: 'kv-list' });
    [
      ['File Name', ev.name || '—'],
      ['File Type', ev.file_type || '—'],
      ['File Size', fmtBytes(ev.file_size)],
      ['Recorded', fmtDate(ev.timestamp)],
      ['Description', ev.description || '—'],
      ['Redaction Status', ev.redaction_status || 'Sealed'],
    ].forEach(([k, v]) => {
      evKv.appendChild(el('div', { class: 'kv' }, el('dt', { text: k }), el('dd', { text: v })));
    });
    const evHashRow = el('p', {},
      el('strong', { text: 'SHA-256: ' }),
      el('span', { class: 'hashmono', text: ev.hash || '—' }),
      ev.hash ? copyButton(ev.hash, 'Copy evidence SHA-256 hash') : null,
    );
    evPanel.appendChild(evHashRow);
    evPanel.appendChild(evKv);

    // --- Blockchain
    const bcPanel = panels.find((p) => p.key === 'blockchain').node;
    bcPanel.appendChild(loadingBlock('Querying blockchain record…'));
    apiGet('/analyst/evidence/' + task.evidence_id + '/blockchain')
      .then((res) => { if (openTaskId === task.id) renderBlockchainPanel(bcPanel, res.data); })
      .catch((err) => {
        if (openTaskId !== task.id) return;
        clear(bcPanel);
        bcPanel.appendChild(errorBlock('Blockchain record unavailable. ' + (err.message || ''), () => {
          clear(bcPanel);
          bcPanel.appendChild(loadingBlock('Querying blockchain record…'));
          apiGet('/analyst/evidence/' + task.evidence_id + '/blockchain')
            .then((r) => { if (openTaskId === task.id) renderBlockchainPanel(bcPanel, r.data); })
            .catch((e2) => {
              if (openTaskId !== task.id) return;
              clear(bcPanel);
              bcPanel.appendChild(errorBlock('Blockchain record unavailable. ' + (e2.message || '')));
            });
        }));
      });

    // --- Chain of custody
    const coPanel = panels.find((p) => p.key === 'chain-of-custody').node;
    renderCustody(coPanel, detail.custody_timeline || []);

    // --- Notes
    const notesPanel = panels.find((p) => p.key === 'notes').node;
    const notesTextarea = el('textarea', { rows: '8', 'aria-label': 'Analyst notes', placeholder: 'Record observations, findings and next steps…', class: '', style: 'width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:0.9rem;' });
    notesTextarea.value = task.notes || '';
    const notesStatus = String(task.status).toLowerCase();
    const notesLocked = notesStatus === 'completed' || notesStatus === 'submitted' || notesStatus === 'archived';
    if (notesLocked) notesTextarea.disabled = true;
    const saveNotesBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'Save Notes', disabled: notesLocked });
    const notesMsg = el('p', { class: 'section-sub', role: 'status' });
    saveNotesBtn.addEventListener('click', async () => {
      saveNotesBtn.disabled = true; // block repeated progress requests
      notesMsg.textContent = 'Saving…';
      try {
        await apiPut('/analyst/tasks/' + task.id + '/progress', { progress: Number(task.progress) || 0, notes: notesTextarea.value });
        notesMsg.textContent = 'Notes saved.';
      } catch (err) {
        notesMsg.textContent = 'Save failed: ' + (transitionMessage(err) || err.message || 'unknown error') + ' — your text is preserved.';
      } finally {
        saveNotesBtn.disabled = notesLocked;
      }
    });
    notesPanel.appendChild(notesTextarea);
    notesPanel.appendChild(el('div', { style: 'margin-top:12px;display:flex;gap:10px;align-items:center;' }, saveNotesBtn, notesMsg));

    // --- Report
    const reportPanel = panels.find((p) => p.key === 'report').node;
    renderReportEditor(reportPanel, task, detail.report);

    // --- Sidebar
    const sidebar = el('aside', {});
    const hashCard = el('div', { class: 'ws-card' },
      el('div', { class: 'ws-header' }, el('h3', {}, el('i', { 'data-lucide': 'fingerprint' }), el('span', { text: 'Evidence Hash' }))),
      el('div', { class: 'ws-body' },
        el('p', { class: 'hashmono', text: ev.hash || 'No hash recorded' }),
        ev.hash ? el('p', {}, el('button', {
          class: 'btn btn-outline btn-sm', type: 'button', text: 'Copy Hash',
          onclick: async () => { await copyBtn(ev.hash); },
        })) : null,
        ev.hash ? qrImg(ev.hash, 'SHA-256 hash QR code') : null,
      ),
    );
    sidebar.appendChild(hashCard);

    if (detail.report) {
      const rep = detail.report;
      sidebar.appendChild(el('div', { class: 'ws-card' },
        el('div', { class: 'ws-header' }, el('h3', {}, el('i', { 'data-lucide': 'file-text' }), el('span', { text: 'Latest Report' }))),
        el('div', { class: 'ws-body' },
          el('p', {}, badge(toTitle(rep.status), 'badge-status-' + rep.status)),
          el('p', { text: rep.result_summary || 'No summary.' }),
          rep.report_hash ? el('p', { class: 'hashmono', text: 'Content digest: ' + shortHash(rep.report_hash) }) : null,
        ),
      ));
    }

    root.appendChild(el('div', { class: 'workspace-grid' },
      el('div', {}, nav, ...panels.map((p) => p.node)),
      sidebar,
    ));
    refreshIcons();
  }

  // Progress update control: one in-flight request at a time, input preserved on error.
  function renderProgressControl(task) {
    const wrap = el('div', { class: 'analyst-field', style: 'margin-top:16px;' });
    const status = String(task.status || '').toLowerCase();
    const locked = status === 'completed' || status === 'submitted' || status === 'archived';
    const input = el('input', {
      type: 'number', min: '0', max: '100', step: '1',
      'aria-label': 'Progress percent',
      'aria-describedby': 'wsProgressMsg',
      disabled: locked,
    });
    input.value = String(Number(task.progress) || 0);
    const btn = el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'Update Progress', disabled: locked });
    const msg = el('p', { class: 'section-sub', id: 'wsProgressMsg', role: 'status' });
    if (locked) msg.textContent = 'Progress is locked because this task is ' + toTitle(task.status) + '.';
    btn.addEventListener('click', async () => {
      const value = Number(input.value);
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        msg.textContent = 'Progress must be a whole number between 0 and 100.';
        return;
      }
      btn.disabled = true;
      msg.textContent = 'Updating…';
      try {
        await apiPut('/analyst/tasks/' + task.id + '/progress', { progress: value });
        msg.textContent = 'Progress updated to ' + value + '%.';
        task.progress = value;
      } catch (err) {
        msg.textContent = 'Update failed: ' + (transitionMessage(err) || err.message || 'unknown error');
      } finally {
        btn.disabled = locked;
      }
    });
    wrap.appendChild(el('label', { text: 'Progress (0–100)' }));
    wrap.appendChild(el('div', { style: 'display:flex;gap:10px;align-items:center;' }, input, btn));
    wrap.appendChild(msg);
    return wrap;
  }

  function switchWsTab(nav, panels, idx, focus) {
    nav.querySelectorAll('.ws-tab').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-selected', String(i === idx));
      b.setAttribute('tabindex', i === idx ? '0' : '-1');
    });
    panels.forEach((p, i) => { p.node.hidden = i !== idx; });
    if (focus) {
      const btn = nav.querySelectorAll('.ws-tab')[idx];
      if (btn) btn.focus();
    }
  }

  function renderBlockchainPanel(panel, bc) {
    clear(panel);
    if (!bc || !bc.immutable) {
      panel.appendChild(el('div', { class: 'verify-result-bad' },
        el('i', { 'data-lucide': 'x-circle' }),
        el('span', { text: 'This evidence has no on-chain record yet.' }),
      ));
      return;
    }
    const verified = bc.verification_result === 'verified';
    panel.appendChild(el('div', { class: verified ? 'verify-result-ok' : 'verify-result-bad' },
      el('i', { 'data-lucide': verified ? 'check-circle-2' : 'clock' }),
      el('span', { text: verified
        ? 'Integrity verified — hash matches the blockchain record.'
        : 'Recorded on-chain; final verification pending.' }),
    ));
    const kv = el('div', { class: 'kv-list', style: 'margin-top:16px;' });
    [
      ['Network', bc.blockchain ? bc.blockchain.network : '—'],
      ['Transaction Hash', bc.blockchain && bc.blockchain.tx_hash ? bc.blockchain.tx_hash : '—'],
      ['Block Number', bc.blockchain && bc.blockchain.block_number ? '#' + bc.blockchain.block_number : '—'],
      ['Timestamp', fmtDate(bc.blockchain && bc.blockchain.timestamp)],
      ['Status', toTitle(bc.blockchain && bc.blockchain.status)],
      ['SHA-256', bc.sha256 || '—'],
      ['IPFS CID', bc.ipfs_cid || '—'],
    ].forEach(([k, v]) => {
      const dd = el('dd', { class: 'hashmono', text: v });
      kv.appendChild(el('div', { class: 'kv' }, el('dt', { text: k }), dd));
    });
    panel.appendChild(kv);
    if (bc.explorer_url) {
      panel.appendChild(el('p', { style: 'margin-top:14px;' },
        el('a', { class: 'btn btn-outline btn-sm', href: bc.explorer_url, target: '_blank', rel: 'noopener noreferrer', text: 'View on Block Explorer' }),
      ));
    }
  }

  function renderCustody(panel, timeline) {
    clear(panel);
    if (!timeline || timeline.length === 0) {
      panel.appendChild(emptyBlock('No custody events', 'Chain of custody events appear as the evidence moves through the workflow.'));
      return;
    }
    const ul = el('ul', { class: 'custody-timeline' });
    timeline.forEach((evt) => {
      ul.appendChild(el('li', {},
        el('div', { class: 'tl-stage', text: evt.stage }),
        el('div', { class: 'tl-title', text: evt.title }),
        el('div', { class: 'tl-time', text: fmtDate(evt.timestamp) }),
        evt.detail ? el('div', { class: 'tl-detail', text: evt.detail }) : null,
      ));
    });
    panel.appendChild(ul);
  }

  // ---------------------------------------------------------------- report editor
  // A2 contract: new report expected_revision 0; existing drafts send the exact
  // server revision. 409 STALE_REVISION keeps the editor text; FINALIZED is
  // read-only. Drafts are never written to localStorage.
  function renderReportEditor(panel, task, existingReport) {
    clear(panel);
    wsEditor = null;
    const status = existingReport ? String(existingReport.status || '').toLowerCase() : '';
    const finalized = status === 'submitted' || status === 'approved' || status === 'rejected' ||
      String(task.status || '').toLowerCase() === 'completed';

    const summaryInput = el('textarea', { rows: '4', 'aria-label': 'Result summary', id: 'reportSummary', placeholder: 'Result summary — conclusions and key findings', style: 'width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:0.9rem;' });
    const findingsInput = el('textarea', { rows: '10', 'aria-label': 'Findings detail', id: 'reportFindings', placeholder: 'Detailed findings, methodology, observations…', style: 'width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:0.9rem;' });
    if (existingReport) {
      summaryInput.value = existingReport.result_summary || '';
      findingsInput.value = existingReport.findings || '';
    }

    if (finalized) {
      summaryInput.disabled = true;
      findingsInput.disabled = true;
      panel.appendChild(el('div', { class: 'analyst-field' }, el('label', { text: 'Result Summary', 'for': 'reportSummary' }), summaryInput));
      panel.appendChild(el('div', { class: 'analyst-field' }, el('label', { text: 'Findings', 'for': 'reportFindings' }), findingsInput));
      panel.appendChild(el('p', { class: 'section-sub', role: 'status', text:
        'Status: ' + toTitle(existingReport ? existingReport.status : task.status) +
        ' — this report is finalized and read-only.' +
        (existingReport && existingReport.report_hash ? ' Content digest: ' + shortHash(existingReport.report_hash) +
        (existingReport.report_hash_version ? ' (' + existingReport.report_hash_version + ')' : '') + '.' : '') }));
      return;
    }

    const saved = { summary: summaryInput.value, findings: findingsInput.value };
    let revision = existingReport && Number.isInteger(existingReport.revision) ? existingReport.revision : 0;
    let saving = false;
    // Set when the report is finalized elsewhere (or submitted) while this
    // editor holds text that was never sent: fields lock read-only with the
    // local text preserved until the analyst explicitly loads the server copy.
    let editorLocked = false;
    const dirtyBadge = el('span', { class: 'evid-badge badge-status-draft', text: 'Unsaved changes', hidden: true, role: 'status' });

    function isDirty() {
      return summaryInput.value !== saved.summary || findingsInput.value !== saved.findings;
    }
    function syncDirty() {
      dirtyBadge.hidden = !isDirty();
    }
    summaryInput.addEventListener('input', syncDirty);
    findingsInput.addEventListener('input', syncDirty);
    wsEditor = { isDirty };

    const statusLine = el('p', { class: 'section-sub', text: existingReport
      ? 'Status: ' + toTitle(existingReport.status) + ' · revision ' + revision + (existingReport.report_hash ? ' · content digest ' + shortHash(existingReport.report_hash) : '')
      : 'Draft a report for this evidence. Nothing is stored until you save.' });

    // Optional structured prompts — inserts a section skeleton, never required.
    const structureBtn = el('button', {
      class: 'btn btn-ghost-light btn-sm analyst-structure-btn', type: 'button', text: 'Insert structure (Method / Findings / Limitations)',
      onclick: () => {
        if (findingsInput.value.trim() && !window.confirm('Replace the current findings text with the section structure?')) return;
        findingsInput.value = 'Method\n— \n\nFindings\n— \n\nLimitations\n— \n';
        syncDirty();
        findingsInput.focus();
      },
    });

    const saveBtn = el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'Save Draft' });
    const submitBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'Submit Report' });
    const msg = el('p', { class: 'section-sub', role: 'alert' });

    function setBusy(busy) {
      saving = busy;
      const locked = busy || editorLocked;
      saveBtn.disabled = locked;
      submitBtn.disabled = locked;
      structureBtn.disabled = locked;
    }

    // Lock the editor read-only without discarding the local text, and offer
    // an explicit button to load the server version. Used when the server copy
    // can no longer accept this editor's text (finalized elsewhere, or a
    // submit succeeded while newer unsent edits exist).
    function lockEditorPreserveText(message, buttonLabel) {
      editorLocked = true;
      summaryInput.disabled = true;
      findingsInput.disabled = true;
      setBusy(false);
      msg.textContent = message + ' ';
      const loadServer = el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: buttonLabel, onclick: () => loadWorkspace() });
      msg.appendChild(loadServer);
    }

    function handleSaveError(err) {
      const code = errCode(err);
      if (err.status === 409 && code === 'STALE_REVISION') {
        msg.textContent = 'This report changed elsewhere (revision conflict). Your text above is preserved — reload the workspace to review the newer version before editing.';
        const reload = el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'Reload workspace', onclick: () => loadWorkspace() });
        msg.appendChild(document.createTextNode(' '));
        msg.appendChild(reload);
        return;
      }
      if (err.status === 409 && code === 'FINALIZED') {
        // Never auto-reload: that would replace unsaved local text with the
        // finalized server report without confirmation. Preserve the text
        // read-only and let the analyst choose when to view the server copy.
        lockEditorPreserveText(
          'This report was finalized elsewhere and is now read-only. Your unsaved text is preserved above; it cannot be saved to the finalized report.',
          'Load finalized report');
        return;
      }
      const special = transitionMessage(err);
      msg.textContent = (special || 'Save failed: ' + (err.message || 'unknown error')) + ' Your text is preserved.';
    }

    saveBtn.addEventListener('click', async () => {
      if (saving) return;
      if (!summaryInput.value.trim() && !findingsInput.value.trim()) {
        msg.textContent = 'A report needs a result summary or findings before saving.';
        return;
      }
      setBusy(true);
      msg.textContent = 'Saving…';
      // Snapshot what is actually sent; text typed while the request is in
      // flight must stay dirty, not be silently marked saved.
      const sentSummary = summaryInput.value;
      const sentFindings = findingsInput.value;
      try {
        const res = await apiPut('/analyst/tasks/' + task.id + '/report', {
          result_summary: sentSummary,
          findings: sentFindings,
          submit: false,
          expected_revision: revision,
        });
        if (res && res.data && Number.isInteger(res.data.revision)) revision = res.data.revision;
        saved.summary = sentSummary;
        saved.findings = sentFindings;
        syncDirty();
        statusLine.textContent = 'Status: Draft · revision ' + revision + ' · saved ' + fmtDate(new Date().toISOString());
        msg.textContent = isDirty() ? 'Draft saved. Newer edits above are not saved yet.' : 'Draft saved.';
      } catch (err) {
        handleSaveError(err);
      } finally {
        setBusy(false);
      }
    });

    submitBtn.addEventListener('click', async () => {
      if (saving) return;
      if (!summaryInput.value.trim() && !findingsInput.value.trim()) {
        msg.textContent = 'A report needs a result summary or findings before submitting.';
        return;
      }
      const confirmed = window.confirm('Submit this report? It is hashed (SHA-256 content digest) and the task is marked complete. Submitted reports cannot be edited.');
      if (!confirmed) return;
      setBusy(true);
      msg.textContent = 'Submitting…';
      const sentSummary = summaryInput.value;
      const sentFindings = findingsInput.value;
      try {
        const res = await apiPut('/analyst/tasks/' + task.id + '/report', {
          result_summary: sentSummary,
          findings: sentFindings,
          submit: true,
          expected_revision: revision,
        });
        if (res && res.data && Number.isInteger(res.data.revision)) revision = res.data.revision;
        saved.summary = sentSummary;
        saved.findings = sentFindings;
        syncDirty();
        loadQueue();
        loadDashboard(true);
        if (isDirty()) {
          // Newer edits were typed while the submit was in flight. The sent
          // snapshot is finalized; keep the unsent text visible read-only
          // instead of discarding it with an automatic reload.
          lockEditorPreserveText(
            'Report submitted with the text sent. Your newer edits above were not submitted and cannot be saved to the finalized report.',
            'View submitted report');
        } else {
          wsEditor = null;
          msg.textContent = 'Report submitted. Task completed.';
          loadWorkspace();
        }
      } catch (err) {
        handleSaveError(err);
      } finally {
        setBusy(false);
      }
    });

    panel.appendChild(el('div', { class: 'analyst-field' }, el('label', { text: 'Result Summary', 'for': 'reportSummary' }), summaryInput));
    panel.appendChild(el('div', { class: 'analyst-field' }, el('label', { text: 'Findings', 'for': 'reportFindings' }), findingsInput, structureBtn));
    panel.appendChild(el('div', { style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;' }, statusLine, dirtyBadge));
    panel.appendChild(el('div', { style: 'display:flex;gap:10px;align-items:center;' }, saveBtn, submitBtn, msg));
  }

  // Warn before a page unload discards unsaved report text.
  function initDirtyWarning() {
    window.addEventListener('beforeunload', (e) => {
      if (wsEditor && wsEditor.isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  // ---------------------------------------------------------------- lab status
  async function loadTools() {
    const lab = document.getElementById('labGrid');
    if (!lab) return;
    clear(lab);
    lab.appendChild(loadingBlock('Loading lab status…'));
    try {
      const stats = await apiGet('/analyst/stats');
      renderLab(lab, stats.data.lab_equipment || []);
    } catch (error) {
      clear(lab);
      lab.appendChild(errorBlock('Could not load lab status. ' + (error.message || ''), loadTools));
    }
  }

  function toolDefs() {
    return [
      { id: 'digital', name: 'Digital Forensics', icon: 'hard-drive', desc: 'Disk imaging, file recovery, deleted data extraction and metadata analysis.' },
      { id: 'metadata', name: 'Metadata Extraction', icon: 'tags', desc: 'EXIF and file metadata extraction for establishing provenance.' },
      { id: 'hash', name: 'Hash Comparison', icon: 'fingerprint', desc: 'SHA-256 hashing and integrity comparison against blockchain records.' },
      { id: 'file-signature', name: 'File Signature Analysis', icon: 'file-search', desc: 'Magic-byte analysis to identify and verify file types.' },
      { id: 'image', name: 'Image Forensics', icon: 'image', desc: 'ELA, noise analysis, clone detection and forgery detection.' },
      { id: 'document', name: 'Document Forensics', icon: 'file-text', desc: 'OCR, signature verification and tampering detection.' },
      { id: 'timeline', name: 'Timeline Analysis', icon: 'clock', desc: 'Event correlation and reconstruction across collected evidence.' },
      { id: 'memory', name: 'Memory Analysis', icon: 'cpu', desc: 'Volatile memory capture and process-level artifact recovery.' },
    ];
  }

  function renderTools(grid, equipment) {
    clear(grid);
    const eqByCat = {};
    (equipment || []).forEach((e) => {
      const key = (e.category || 'other').toLowerCase();
      (eqByCat[key] = eqByCat[key] || []).push(e);
    });
    const av = (key) => {
      const list = eqByCat[key] || [];
      return list.length ? list[0].status : 'available';
    };

    toolDefs().forEach((tool) => {
      const card = el('div', { class: 'tool-card', role: 'group', 'aria-label': tool.name },
        el('div', { class: 'tool-icon' }, el('i', { 'data-lucide': tool.icon })),
        el('h3', { text: tool.name }),
        el('p', { text: tool.desc }),
        el('div', { class: 'tool-foot' },
          el('span', {}, badge(toTitle(av(tool.id)), 'badge-status-' + (av(tool.id) === 'online' || av(tool.id) === 'connected' || av(tool.id) === 'healthy' || av(tool.id) === 'available' ? 'approved' : 'pending'))),
          el('span', { text: 'v2.1' }),
        ),
      );
      grid.appendChild(card);
    });
    refreshIcons();
  }

  function renderLab(lab, equipment) {
    clear(lab);
    if (!equipment || equipment.length === 0) {
      lab.appendChild(emptyBlock('No lab equipment', 'Lab equipment status will appear here.'));
      return;
    }
    equipment.forEach((eq) => {
      const statusKey = String(eq.status || 'offline').toLowerCase();
      const card = el('div', { class: 'lab-card' },
        el('span', { class: 'lab-dot ' + statusKey, 'aria-hidden': 'true' }),
        el('div', {},
          el('h4', { text: eq.name }),
          el('div', { class: 'lab-status', text: toTitle(eq.status), style: 'color:' + statusColor(statusKey) }),
          el('div', { class: 'lab-detail', text: (eq.detail || '') + (eq.version ? ' · ' + eq.version : '') }),
        ),
      );
      lab.appendChild(card);
    });
  }

  function statusColor(statusKey) {
    if (['online', 'connected', 'healthy', 'available', 'ready'].includes(statusKey)) return '#16a34a';
    if (statusKey === 'busy') return '#ea580c';
    if (statusKey === 'maintenance') return '#d97706';
    return '#64748b';
  }

  // ---------------------------------------------------------------- reports
  function initReportsToolbar() {
    const status = document.getElementById('reportsStatusFilter');
    const refresh = document.getElementById('reportsRefreshBtn');
    if (status) status.addEventListener('change', () => { reportsState.status = status.value; reportsState.page = 1; loadReports(); });
    if (refresh) refresh.addEventListener('click', () => loadReports());
  }

  async function loadReports() {
    const root = document.getElementById('reportsRoot');
    if (!root) return;
    const seq = ++reportsSeq;
    clear(root);
    root.appendChild(loadingBlock('Loading reports…'));
    const params = new URLSearchParams();
    params.set('page', String(reportsState.page));
    params.set('limit', String(reportsState.limit));
    if (reportsState.status) params.set('status', reportsState.status);
    try {
      const res = await apiGet('/analyst/reports?' + params.toString());
      if (seq !== reportsSeq) return;
      reportsState.items = res.data || [];
      const pg = readPagination(res, reportsState.items.length);
      if (pg) {
        reportsState.page = pg.page;
        reportsState.limit = pg.limit;
        reportsState.total = pg.total;
        reportsState.pages = pg.pages;
      } else {
        reportsState.total = reportsState.items.length;
        reportsState.pages = reportsState.items.length ? 1 : 0;
      }
      renderReports(reportsState.items);
    } catch (error) {
      if (seq !== reportsSeq) return;
      clear(root);
      root.appendChild(errorBlock('Could not load reports. ' + (error.message || 'Check your connection.'), loadReports));
    }
  }

  // PDF snapshot export (V3). These are Case/Evidence snapshot PDFs — unsigned
  // record snapshots, not the analyst's findings report and not digitally
  // signed. The server enforces export access; 401/403 surface visibly here.
  function snapshotButton(kind, id) {
    const label = kind === 'case' ? 'Case snapshot PDF' : 'Evidence snapshot PDF';
    const btn = el('button', {
      class: 'btn btn-outline btn-sm', type: 'button', text: label,
      'aria-label': label + ' for ' + kind + ' ' + id,
    });
    const status = el('span', { class: 'analyst-search-error', role: 'status' });
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Preparing…';
      status.textContent = '';
      try {
        const path = kind === 'case' ? '/cases/' + id + '/report.pdf' : '/evidence/' + id + '/report.pdf';
        const fallback = kind + '-' + id + '-snapshot.pdf';
        const result = await apiDownload(path, fallback);
        triggerBlobDownload(result.blob, result.filename);
        btn.textContent = 'Downloaded';
        setTimeout(() => { btn.textContent = label; }, 2000);
      } catch (error) {
        status.textContent = ' ' + downloadErrorMessage(error, kind + ' snapshot PDF');
        btn.textContent = label;
      } finally {
        btn.disabled = false;
      }
    });
    return el('span', { class: 'snapshot-action' }, btn, status);
  }

  function renderReports(reports) {
    const root = document.getElementById('reportsRoot');
    clear(root);
    const summary = document.getElementById('reportsSummary');
    const showing = reports.length;
    const from = showing === 0 ? 0 : (reportsState.page - 1) * reportsState.limit + 1;
    const to = (reportsState.page - 1) * reportsState.limit + showing;
    if (summary) {
      summary.textContent = reportsState.pages > 1 || reportsState.total !== showing
        ? 'Showing ' + from + '–' + to + ' of ' + reportsState.total + ' reports'
        : showing + ' report' + (showing === 1 ? '' : 's');
    }
    if (!reports.length) {
      root.appendChild(emptyBlock('No reports found',
        reportsState.total > 0
          ? 'This page is empty. Go back to an earlier page or clear the status filter.'
          : 'Completed analysis reports will appear here.'));
    } else {
      const wrap = el('div', { class: 'reports-table-wrap' });
      const table = el('table', { class: 'reports-table' });
      const thead = el('thead', {}, el('tr', {},
        ['Report ID', 'Evidence', 'Case', 'Status', 'Created', 'Modified', 'Blockchain', 'Hash', 'Actions'].map((h) => el('th', { text: h })),
      ));
      const tbody = el('tbody');
      reports.forEach((r) => {
        const tr = el('tr', {});
        const hashCell = el('span', { class: 'hash-cell' },
          el('span', { class: 'hashmono', text: shortHash(r.report_hash) }),
          r.report_hash ? copyButton(r.report_hash, 'Copy report content digest') : null,
        );
        const actions = el('td', { class: 'report-actions' });
        if (r.task_id) {
          actions.appendChild(el('button', {
            class: 'btn btn-outline btn-sm', type: 'button', text: 'Open workspace',
            'aria-label': 'Open workspace for report ' + r.id,
            onclick: () => openWorkspace(r.task_id),
          }));
        }
        if (r.evidence_id) actions.appendChild(snapshotButton('evidence', r.evidence_id));
        if (r.case_id) actions.appendChild(snapshotButton('case', r.case_id));
        [
          el('td', { text: 'RPT-' + r.id }),
          el('td', { text: r.evidence_name || (r.evidence && r.evidence.name) || 'Evidence #' + r.evidence_id }),
          el('td', { text: r.case_number ? '#' + r.case_number : '—' }),
          el('td', {}, badge(toTitle(r.status), 'badge-status-' + r.status)),
          el('td', { text: fmtDate(r.created_at) }),
          el('td', { text: fmtDate(r.updated_at) }),
          el('td', {}, r.blockchain_verified ? badge('Verified', 'badge-verified') : badge('Pending', 'badge-unverified')),
          el('td', {}, hashCell),
          actions,
        ].forEach((td) => tr.appendChild(td));
        tbody.appendChild(tr);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      wrap.appendChild(table);
      root.appendChild(wrap);
      root.appendChild(el('p', { class: 'section-sub', text: 'Snapshot PDFs are unsigned case/evidence record exports — not the analyst findings report and not digitally signed.' }));
    }
    const pagerHost = document.getElementById('reportsPager');
    if (pagerHost) {
      clear(pagerHost);
      pagerHost.appendChild(pager(reportsState, (page) => { reportsState.page = page; loadReports(); }, 'Report pages'));
    }
    refreshIcons();
  }

  // ---------------------------------------------------------------- global search
  // Wired to GET /api/analyst/search (tasks + reports + scoped case number/title).
  function initGlobalSearch() {
    const input = document.getElementById('analystGlobalSearch');
    if (!input) return;
    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const q = input.value.trim();
      if (!q) return;
      const modal = window.analystModal;
      if (!modal) return;
      document.getElementById('analystModalTitle').textContent = 'Search: ' + q;
      modal.setBody(el('p', { class: 'analyst-loading', text: 'Searching tasks, reports and cases…' }));
      modal.open();
      try {
        const res = await apiGet('/analyst/search?q=' + encodeURIComponent(q));
        const data = (res && res.data) || {};
        modal.setBody(renderSearchResults(data));
      } catch (err) {
        modal.setBody(errorBlock('Search failed. ' + (err && err.message ? err.message : 'Check your connection.')));
      }
    });
  }

  function renderSearchResults(data) {
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const reports = Array.isArray(data.reports) ? data.reports : [];
    const cases = Array.isArray(data.cases) ? data.cases : [];
    const wrap = el('div', { class: 'analyst-search-results' });
    if (tasks.length === 0 && reports.length === 0 && cases.length === 0) {
      wrap.appendChild(emptyBlock('No matches', 'Nothing in your assigned tasks, reports or cases matched that search.'));
      return wrap;
    }
    if (cases.length > 0) {
      wrap.appendChild(el('h3', { class: 'analyst-search-heading', text: 'Cases' }));
      const list = el('div', { class: 'analyst-search-list' });
      cases.forEach((c) => {
        list.appendChild(el('div', { class: 'analyst-search-row' },
          el('span', { class: 'analyst-search-primary', text: (c.case_number ? '#' + c.case_number : 'Case #' + c.id) + ' — ' + (c.title || 'Untitled') }),
          badge(toTitle(c.status || 'open'), 'badge-status-' + (c.status || 'open')),
        ));
      });
      wrap.appendChild(list);
    }
    if (tasks.length > 0) {
      wrap.appendChild(el('h3', { class: 'analyst-search-heading', text: 'Tasks' }));
      const list = el('div', { class: 'analyst-search-list' });
      tasks.forEach((t) => {
        const ev = t.evidence || {};
        const open = el('button', {
          class: 'btn btn-outline btn-sm', type: 'button', text: 'Open',
          'aria-label': 'Open task ' + t.id,
          onclick: () => { window.analystModal.close(); openWorkspace(t.id); },
        });
        list.appendChild(el('div', { class: 'analyst-search-row' },
          el('span', { class: 'analyst-search-primary', text: ev.name || 'Evidence #' + t.evidence_id }),
          badge(toTitle(t.status || 'pending'), 'badge-status-' + (t.status || 'pending')),
          open,
        ));
      });
      wrap.appendChild(list);
    }
    if (reports.length > 0) {
      wrap.appendChild(el('h3', { class: 'analyst-search-heading', text: 'Reports' }));
      const list = el('div', { class: 'analyst-search-list' });
      reports.forEach((r) => {
        list.appendChild(el('div', { class: 'analyst-search-row' },
          el('span', { class: 'analyst-search-primary', text: (r.result_summary || 'Report').slice(0, 120) }),
          badge(toTitle(r.status || 'draft'), 'badge-status-' + (r.status || 'draft')),
        ));
      });
      wrap.appendChild(list);
    }
    return wrap;
  }

  // ---------------------------------------------------------------- start picker
  // Lists only evidence with a pre-existing assignment (pending analysis task)
  // for this analyst; the server enforces the same contract on start.
  async function openStartPicker() {
    const modal = window.analystModal;
    if (!modal) return;
    document.getElementById('analystModalTitle').textContent = 'Start New Analysis';
    modal.setBody(el('p', { class: 'analyst-loading', text: 'Loading your assigned evidence…' }));
    modal.open();
    try {
      const res = await apiGet('/analyst/queue?status=pending&limit=50');
      const items = (res && Array.isArray(res.data) ? res.data : (res && res.data && res.data.items)) || [];
      if (items.length === 0) {
        modal.setBody(emptyBlock('No assigned evidence waiting', 'Evidence routed to your analysis queue will appear here.'));
        return;
      }
      const list = el('div', { class: 'analyst-search-list' });
      items.forEach((item) => {
        const ev = item.evidence || {};
        const startBtn = el('button', {
          class: 'btn btn-purple btn-sm', type: 'button', text: 'Start',
          'aria-label': 'Start analysis on ' + (ev.name || 'evidence #' + item.evidence_id),
          onclick: async () => {
            startBtn.disabled = true;
            startBtn.textContent = 'Starting…';
            try {
              await apiPost('/analyst/evidence/' + item.evidence_id + '/start', { priority: item.priority || 'medium', caseId: item.case_id });
              modal.close();
              loadDashboard(true);
              loadQueue();
              openWorkspace(item.id);
            } catch (err) {
              startBtn.disabled = false;
              startBtn.textContent = 'Start';
              const special = transitionMessage(err);
              startBtn.parentNode.appendChild(el('span', { class: 'analyst-search-error', text: ' ' + (special || (err && err.message) || 'Could not start analysis') }));
            }
          },
        });
        list.appendChild(el('div', { class: 'analyst-search-row' },
          el('span', { class: 'analyst-search-primary', text: ev.name || 'Evidence #' + item.evidence_id }),
          el('span', { class: 'analyst-search-secondary', text: item.case_number ? 'Case #' + item.case_number : '' }),
          badge(toTitle(item.priority || 'medium'), 'badge-priority-' + (item.priority || 'medium')),
          startBtn,
        ));
      });
      modal.setBody(list);
    } catch (err) {
      modal.setBody(errorBlock('Could not load assigned evidence. ' + (err && err.message ? err.message : 'Check your connection.'), openStartPicker));
    }
  }

  // ---------------------------------------------------------------- hero actions
  function initHeroActions() {
    const start = document.getElementById('heroStartAnalysis');
    const refresh = document.getElementById('heroContinuePending');
    if (start) {
      start.addEventListener('click', openStartPicker);
    }
    if (refresh) {
      refresh.addEventListener('click', () => {
        loadDashboard(true);
        loadQueue();
      });
    }
  }

  // ---------------------------------------------------------------- modal
  // Focus moves in on open, returns to the opener on close, Tab is trapped
  // inside while open, Escape closes.
  function initModal() {
    const modal = document.getElementById('analystModal');
    const closeBtn = document.getElementById('analystModalClose');
    if (!modal || !closeBtn) return;
    let lastFocused = null;
    const open = () => {
      lastFocused = document.activeElement;
      modal.classList.add('open');
      closeBtn.focus();
    };
    const close = () => {
      modal.classList.remove('open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      lastFocused = null;
    };
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((n) => !n.disabled && n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.analystModal = { open, close, setBody: (node) => {
      const body = document.getElementById('analystModalBody');
      clear(body);
      body.appendChild(node);
    } };
  }

  // ---------------------------------------------------------------- boot
  document.addEventListener('DOMContentLoaded', init);

  // Exposed for the single top app navbar (view switching without reload).
  window.analystDashboard = {
    showView: (name) => {
      if (name === 'workspace' && !openTaskId) name = 'queue';
      showView(name);
    },
    openWorkspace,
    loadQueue,
    loadDashboard,
    loadReports,
  };
})();
