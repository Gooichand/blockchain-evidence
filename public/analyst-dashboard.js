/**
 * EVID-DGC Forensic Analyst Workstation — dashboard controller.
 * All data is fetched from the role-scoped /analyst API. No hardcoded records.
 * Dynamic content rendered with textContent / DOM primitives (no unsafe innerHTML).
 */
const AnalystDashboard = (() => {
  let openTaskId = null;
  const queueState = { items: [], status: '', priority: '', search: '' };

  // ---------------------------------------------------------------- helpers
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (k === 'class') return (node.className = v);
      if (k === 'text') return (node.textContent = v);
      if (k.startsWith('on') && typeof v === 'function') return node.addEventListener(k.slice(2), v);
      node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
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

  // ---------------------------------------------------------------- api
  function apiGet(path) { return window.apiClient.get(path, { skipWalletAuth: true }); }
  function apiPost(path, body) { return window.apiClient.post(path, body || {}, { skipWalletAuth: true }); }
  function apiPut(path, body) { return window.apiClient.request(path, { method: 'PUT', body: JSON.stringify(body || {}), skipWalletAuth: true }); }

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
    initHeroActions();
    initGlobalSearch();
    initModal();

    // Initial view from URL hash (e.g. #queue, #reports)
    const hash = (window.location.hash || '').replace('#', '');
    if (hash === 'queue' || hash === 'tools' || hash === 'reports' || hash === 'workspace') {
      showView(hash);
    } else {
      showView('dashboard');
    }
  }

  // ---------------------------------------------------------------- tabs
  function initTabs() {
    document.querySelectorAll('.analyst-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.dataset.view === 'workspace' && !openTaskId) return;
        showView(tab.dataset.view);
      });
    });
    const backBtn = document.getElementById('workspaceBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        openTaskId = null;
        const wsTab = document.getElementById('tabWorkspace');
        if (wsTab) wsTab.hidden = true;
        showView('queue');
      });
    }
  }

  function showView(name) {
    ['dashboard', 'queue', 'workspace', 'tools', 'reports'].forEach((v) => {
      const sec = document.getElementById('view-' + v);
      if (sec) sec.hidden = v !== name;
    });
    document.querySelectorAll('.analyst-tab').forEach((t) => {
      const active = t.dataset.view === name && t.hidden !== true;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
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
  async function loadDashboard() {
    const metricsRoot = document.getElementById('analystMetrics');
    if (!metricsRoot) return;
    if (metricsRoot.dataset.loaded === '1') {
      if (window.analystEvidence) window.analystEvidence.init();
      return;
    }
    clear(metricsRoot);
    metricsRoot.appendChild(loadingBlock('Loading analysis statistics…'));
    try {
      const res = await apiGet('/analyst/stats');
      renderStats(res.data);
      renderBlockchain(res.data.blockchain);
      renderActivity(res.data.recent_activity);
      metricsRoot.dataset.loaded = '1';
      if (window.analystEvidence) window.analystEvidence.init();
    } catch (error) {
      clear(metricsRoot);
      metricsRoot.appendChild(errorBlock('Could not load statistics. ' + (error.message || 'Check your connection.'), loadDashboard));
    }
  }

  function metricCard(label, value, icon, cls, foot) {
    const card = el('div', { class: 'metric-card ' + (cls || '') },
      el('div', { class: 'metric-top' },
        el('div', { class: 'metric-icon' }, el('i', { 'data-lucide': icon })),
      ),
      el('div', { class: 'metric-value', text: value ?? '—' }),
      el('div', { class: 'metric-label', text: label }),
    );
    if (foot) card.appendChild(el('div', { class: 'metric-foot', text: foot }));
    return card;
  }

  function renderStats(s) {
    const root = document.getElementById('analystMetrics');
    if (!root) return;
    clear(root);
    const cards = [
      metricCard('Assigned Evidence', s.assigned_evidence, 'files'),
      metricCard('Pending Queue', s.pending, 'clock', 'metric-orange'),
      metricCard('In Progress', s.in_progress, 'loader', 'metric-indigo'),
      metricCard('Completed Reports', s.completed, 'file-check', 'metric-green'),
      metricCard('Evidence Verified', s.evidence_verified, 'shield-check', 'metric-teal'),
      metricCard('High Priority', s.critical_priority, 'alert-triangle', 'metric-red'),
      metricCard('Avg Analysis Time', s.average_processing_minutes != null ? s.average_processing_minutes + 'm' : '—', 'timer', 'metric-orange'),
      metricCard('Integrity Score', s.integrity_score != null ? s.integrity_score + '%' : '—', 'badge-check', 'metric-green'),
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

  function renderBlockchain(bc) {
    const root = document.getElementById('analystBlockchain');
    if (!root) return;
    clear(root);
    if (!bc) return;
    const synced = bc.state === 'synced';
    const banner = el('div', { class: 'blockchain-banner' },
      el('i', { 'data-lucide': synced ? 'check-circle-2' : 'cloud-off' }),
      el('span', { text: synced
        ? 'Blockchain node synced' + (bc.network ? ' · ' + bc.network : '') + (bc.block ? ' · block #' + Number(bc.block).toLocaleString() : '')
        : 'Blockchain verification unavailable — records remain stored and read-only.' }),
    );
    root.appendChild(banner);
  }

  function renderActivity(list) {
    const root = document.getElementById('analystActivity');
    if (!root) return;
    clear(root);
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
        loadQueue();
      }, 400));
    }
    if (status) status.addEventListener('change', () => { queueState.status = status.value; loadQueue(); });
    if (priority) priority.addEventListener('change', () => { queueState.priority = priority.value; loadQueue(); });
    if (refresh) refresh.addEventListener('click', loadQueue);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  async function loadQueue() {
    const list = document.getElementById('queueList');
    if (!list) return;
    clear(list);
    list.appendChild(loadingBlock('Loading analysis queue…'));
    const params = new URLSearchParams();
    if (queueState.status) params.set('status', queueState.status);
    if (queueState.priority) params.set('priority', queueState.priority);
    if (queueState.search) params.set('search', queueState.search);
    try {
      const res = await apiGet('/analyst/queue?' + params.toString());
      queueState.items = res.data || [];
      renderQueue(list);
    } catch (error) {
      clear(list);
      list.appendChild(errorBlock('Could not load the queue. ' + (error.message || 'Check your connection.'), loadQueue));
    }
  }

  function renderQueue(root) {
    clear(root);
    const summary = document.getElementById('queueSummary');
    if (summary) summary.textContent = queueState.items.length + ' work item' + (queueState.items.length === 1 ? '' : 's') + ' in queue';
    if (!queueState.items.length) {
      root.appendChild(emptyBlock('No analysis assigned',
        'Evidence assigned to you will appear here. New evidence is routed to the analyst queue when assigned.'));
      return;
    }
    queueState.items.forEach((item) => root.appendChild(renderWorkItem(item)));
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
    actions.appendChild(el('button', {
      class: 'btn btn-primary btn-sm', type: 'button',
      text: status === 'pending' ? 'Start Analysis' : 'Continue Analysis',
      onclick: () => startAnalysis(item.evidence_id, item.case_id),
    }));
    actions.appendChild(el('button', {
      class: 'btn btn-outline btn-sm', type: 'button', text: 'Open Workspace',
      onclick: () => openWorkspace(item.id),
    }));
    card.appendChild(actions);
    return card;
  }

  async function startAnalysis(evidenceId, caseId) {
    const confirmed = window.confirm('Start forensic analysis on Evidence #' + evidenceId + '?\nThis action is recorded to the audit trail.');
    if (!confirmed) return;
    try {
      const reply = await apiPost('/analyst/evidence/' + evidenceId + '/start', { caseId: caseId || null });
      window.alert('Analysis started (task #' + reply.data.task_id + '). Open the workspace to continue.');
      loadQueue();
      loadDashboard();
      if (window.analystEvidence) window.analystEvidence.init();
    } catch (error) {
      window.alert('Analysis could not be started: ' + (error.message || 'Unknown error'));
    }
  }

  // ---------------------------------------------------------------- workspace
  function openWorkspace(taskId) {
    openTaskId = taskId;
    const tab = document.getElementById('tabWorkspace');
    if (tab) tab.hidden = false;
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
      renderWorkspace(res.data);
    } catch (error) {
      clear(root);
      root.appendChild(errorBlock('Could not load workspace. ' + (error.message || 'Check your connection.'), loadWorkspace));
    }
  }

  function renderWorkspace(detail) {
    const root = document.getElementById('workspaceRoot');
    clear(root);
    const task = detail.task;
    if (!task) return;
    const ev = task.evidence || {};

    const defs = ['Overview', 'Evidence', 'Blockchain', 'Chain of Custody', 'Notes', 'Report'];
    const nav = el('nav', { class: 'ws-tabs', role: 'tablist' });
    const panels = defs.map((label, idx) => {
      const key = label.toLowerCase().replace(/\s+/g, '-');
      const btn = el('button', {
        class: 'ws-tab' + (idx === 0 ? ' active' : ''), role: 'tab', type: 'button', text: label,
        'aria-selected': String(idx === 0),
        onclick: () => switchWsTab(nav, panels, idx),
      });
      nav.appendChild(btn);
      const panel = el('div', { class: 'ws-panel', role: 'tabpanel', hidden: idx !== 0 });
      return { key, node: panel };
    });

    // --- Overview
    const ov = el('div', {});
    ov.appendChild(el('h3', { text: 'Evidence #' + task.evidence_id + ' — ' + (ev.name || 'Untitled') }));
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
      ['Blockchain Verified', ev.blockchain_verified ? 'Yes' : 'No'],
      ['Redaction Status', ev.redaction_status || 'Sealed'],
    ].forEach(([k, v]) => {
      kv.appendChild(el('div', { class: 'kv' }, el('dt', { text: k }), el('dd', { text: v })));
    });
    ov.appendChild(kv);
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
      .then((res) => renderBlockchainPanel(bcPanel, res.data))
      .catch((err) => {
        clear(bcPanel);
        bcPanel.appendChild(errorBlock('Blockchain record unavailable. ' + (err.message || ''), () => {
          clear(bcPanel);
          bcPanel.appendChild(loadingBlock('Querying blockchain record…'));
          apiGet('/analyst/evidence/' + task.evidence_id + '/blockchain')
            .then((r) => renderBlockchainPanel(bcPanel, r.data))
            .catch((e2) => {
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
    const saveNotesBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'Save Notes' });
    const notesMsg = el('p', { class: 'section-sub' });
    saveNotesBtn.addEventListener('click', async () => {
      try {
        await apiPut('/analyst/tasks/' + task.id + '/progress', { progress: Number(task.progress) || 0, notes: notesTextarea.value });
        notesMsg.textContent = 'Notes saved.';
      } catch (err) {
        notesMsg.textContent = 'Save failed: ' + (err.message || 'unknown error');
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
      const repCard = el('div', { class: 'ws-card' },
        el('div', { class: 'ws-header' }, el('h3', {}, el('i', { 'data-lucide': 'file-text' }), el('span', { text: 'Latest Report' }))),
        el('div', { class: 'ws-body' },
          el('p', {}, badge(toTitle(rep.status), 'badge-status-' + rep.status)),
          el('p', { text: rep.result_summary || 'No summary.' }),
          rep.report_hash ? el('p', { class: 'hashmono', text: 'Hash: ' + shortHash(rep.report_hash) }) : null,
        ),
      );
      sidebar.appendChild(repCard);
    }

    root.appendChild(el('div', { class: 'workspace-grid' },
      el('div', {}, nav, ...panels.map((p) => p.node)),
      sidebar,
    ));
    refreshIcons();
  }

  function switchWsTab(nav, panels, idx) {
    nav.querySelectorAll('.ws-tab').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-selected', String(i === idx));
    });
    panels.forEach((p, i) => { p.node.hidden = i !== idx; });
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

  function renderReportEditor(panel, task, existingReport) {
    clear(panel);
    const summaryInput = el('textarea', { rows: '4', 'aria-label': 'Result summary', placeholder: 'Result summary — conclusions and key findings', style: 'width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:0.9rem;' });
    const findingsInput = el('textarea', { rows: '10', 'aria-label': 'Findings detail', placeholder: 'Detailed findings, methodology, observations…', style: 'width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:0.9rem;' });
    if (existingReport) {
      summaryInput.value = existingReport.result_summary || '';
      findingsInput.value = existingReport.findings || '';
    }
    const statusLine = el('p', { class: 'section-sub', text: existingReport
      ? 'Status: ' + toTitle(existingReport.status) + (existingReport.report_hash ? ' · hash ' + shortHash(existingReport.report_hash) : '')
      : 'Draft a report for this evidence.' });

    const saveBtn = el('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'Save Draft' });
    const submitBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'Submit Report' });
    const msg = el('p', { class: 'section-sub' });

    saveBtn.addEventListener('click', async () => {
      msg.textContent = 'Saving…';
      try {
        await apiPut('/analyst/tasks/' + task.id + '/report', { result_summary: summaryInput.value, findings: findingsInput.value, submit: false });
        msg.textContent = 'Draft saved.';
        loadWorkspace();
      } catch (err) {
        msg.textContent = 'Save failed: ' + (err.message || 'unknown error');
      }
    });
    submitBtn.addEventListener('click', async () => {
      const confirmed = window.confirm('Submit this report? It will be hashed (SHA-256) and the task marked complete.');
      if (!confirmed) return;
      msg.textContent = 'Submitting…';
      try {
        await apiPut('/analyst/tasks/' + task.id + '/report', { result_summary: summaryInput.value, findings: findingsInput.value, submit: true });
        msg.textContent = 'Report submitted. Task completed.';
        loadQueue();
        loadDashboard();
        loadWorkspace();
      } catch (err) {
        msg.textContent = 'Submit failed: ' + (err.message || 'unknown error');
      }
    });

    panel.appendChild(el('div', { class: 'analyst-field' }, el('label', { text: 'Result Summary' }), summaryInput));
    panel.appendChild(el('div', { class: 'analyst-field' }, el('label', { text: 'Findings' }), findingsInput));
    panel.appendChild(statusLine);
    panel.appendChild(el('div', { style: 'display:flex;gap:10px;align-items:center;' }, saveBtn, submitBtn, msg));
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
  async function loadReports() {
    const root = document.getElementById('reportsRoot');
    if (!root) return;
    clear(root);
    root.appendChild(loadingBlock('Loading reports…'));
    try {
      const res = await apiGet('/analyst/reports?limit=50');
      renderReports(res.data || []);
    } catch (error) {
      clear(root);
      root.appendChild(errorBlock('Could not load reports. ' + (error.message || 'Check your connection.'), loadReports));
    }
  }

  function renderReports(reports) {
    const root = document.getElementById('reportsRoot');
    clear(root);
    const summary = document.getElementById('reportsSummary');
    if (summary) summary.textContent = reports.length + ' report' + (reports.length === 1 ? '' : 's');
    if (!reports.length) {
      root.appendChild(emptyBlock('No reports yet', 'Completed analysis reports will appear here.'));
      return;
    }

    const wrap = el('div', { class: 'reports-table-wrap' });
    const table = el('table', { class: 'reports-table' });
    const thead = el('thead', {}, el('tr', {},
      ['Report ID', 'Evidence', 'Case', 'Status', 'Created', 'Modified', 'Blockchain', 'Hash'].map((h) => el('th', { text: h })),
    ));
    const tbody = el('tbody');
    reports.forEach((r) => {
      const tr = el('tr', {});
      const hashCell = el('span', { class: 'hash-cell' },
        el('span', { class: 'hashmono', text: shortHash(r.report_hash) }),
        r.report_hash ? copyButton(r.report_hash, 'Copy report hash') : null,
      );
      [
        el('td', { text: 'RPT-' + r.id }),
        el('td', { text: r.evidence_name || 'Evidence #' + r.evidence_id }),
        el('td', { text: r.case_number ? '#' + r.case_number : '—' }),
        el('td', {}, badge(toTitle(r.status), 'badge-status-' + r.status)),
        el('td', { text: fmtDate(r.created_at) }),
        el('td', { text: fmtDate(r.updated_at) }),
        el('td', {}, r.blockchain_verified ? badge('Verified', 'badge-verified') : badge('Pending', 'badge-unverified')),
        el('td', {}, hashCell),
      ].forEach((td) => tr.appendChild(td));
      tbody.appendChild(tr);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    root.appendChild(wrap);
    refreshIcons();
  }

  // ---------------------------------------------------------------- global search
  function initGlobalSearch() {
    const input = document.getElementById('analystGlobalSearch');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = input.value.trim();
      if (!q) return;
      queueState.search = q;
      queueState.status = '';
      queueState.priority = '';
      document.getElementById('queueStatusFilter').value = '';
      document.getElementById('queuePriorityFilter').value = '';
      document.getElementById('queueSearch').value = q;
      showView('queue');
    });
  }

  // ---------------------------------------------------------------- hero actions
  function initHeroActions() {
    const start = document.getElementById('heroStartAnalysis');
    const refresh = document.getElementById('heroContinuePending');
    if (start) {
      start.addEventListener('click', () => showView('queue'));
    }
    if (refresh) {
      refresh.addEventListener('click', () => {
        loadDashboard();
        loadQueue();
      });
    }
  }

  // ---------------------------------------------------------------- modal
  function initModal() {
    const modal = document.getElementById('analystModal');
    const closeBtn = document.getElementById('analystModalClose');
    if (!modal || !closeBtn) return;
    const open = () => modal.classList.add('open');
    const close = () => modal.classList.remove('open');
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
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
  };
})();
