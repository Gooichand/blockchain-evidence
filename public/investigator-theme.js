/**
 * EVID-DGC Investigator Premium Theme - behavior layer.
 * Loaded only on Investigator-role pages, after api-client.js.
 * Wires hero panels, chips, pills and icons to real API data. No fake numbers.
 */
(function () {
    'use strict';

    /* ---------- lucide icons (load if the page does not have them) ---------- */
    function refreshIcons() {
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    if (!window.lucide) {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.js';
        s.onload = refreshIcons;
        document.head.appendChild(s);
    }

    /* ---------- tiny API helper (uses the app's apiClient when present) ---------- */
    async function apiGet(path, params) {
        try {
            if (window.apiClient && window.apiClient.get) {
                return await window.apiClient.get(path, { params, skipWalletAuth: true });
            }
        } catch (_) { /* fall through to fetch */ }
        try {
            const token = localStorage.getItem('authToken') || '';
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            const r = await fetch((window.config && window.config.API_BASE_URL || '/api') + path + qs, {
                headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            return await r.json();
        } catch (_) {
            return null;
        }
    }
    function rowsOf(resp, keys) {
        if (!resp) return [];
        if (Array.isArray(resp)) return resp;
        for (const k of keys) if (Array.isArray(resp[k])) return resp[k];
        if (resp.data) {
            if (Array.isArray(resp.data)) return resp.data;
            for (const k of keys) if (Array.isArray(resp.data[k])) return resp.data[k];
        }
        return [];
    }

    /* ---------- shared real stats, cached for 60s ---------- */
    let statsPromise = null;
    function getStats() {
        if (statsPromise) return statsPromise;
        const cached = sessionStorage.getItem('invThemeStats');
        if (cached) {
            try {
                const c = JSON.parse(cached);
                if (Date.now() - c.at < 60000) return Promise.resolve(c.stats);
            } catch (_) { /* ignore */ }
        }
        statsPromise = (async () => {
            const [casesResp, evResp, scanResp, custodyResp] = await Promise.all([
                apiGet('/cases'),
                apiGet('/evidence'),
                apiGet('/evidence/integrity-scan-status'),
                apiGet('/custody/recent', { limit: 50 })
            ]);
            const cases = rowsOf(casesResp, ['cases', 'items', 'results']);
            const evidence = rowsOf(evResp, ['evidence', 'items', 'results']);
            const anchored = evidence.filter(e => e && (e.blockchain_tx_hash || e.blockchain_status === 'anchored')).length;
            const scan = scanResp && scanResp.data ? scanResp.data : null;
            const lastRun = scan && scan.lastRun ? scan.lastRun : null;
            const verifiedPct = lastRun && lastRun.checked
                ? Math.round(((lastRun.checked - (lastRun.mismatches || 0)) / lastRun.checked) * 100)
                : null;
            const custody = rowsOf(custodyResp, ['entries']);
            const stats = {
                cases: cases.length,
                activeCases: cases.filter(c => c && !/closed|archived/i.test(c.status || '')).length,
                evidence: evidence.length,
                anchored,
                verifiedPct,
                lastRun,
                custody
            };
            sessionStorage.setItem('invThemeStats', JSON.stringify({ at: Date.now(), stats }));
            return stats;
        })().catch(() => null);
        return statsPromise;
    }

    function relTime(iso) {
        if (!iso) return 'never';
        const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + ' min ago';
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return hrs + ' h ago';
        return Math.round(hrs / 24) + ' d ago';
    }

    const CHIP_DEFS = {
        cases: { icon: 'folder', label: 'Active Cases', value: s => String(s.activeCases) },
        evidence: { icon: 'file-text', label: 'Evidence', value: s => String(s.evidence) },
        verified: { icon: 'shield', label: 'Verified', value: s => (s.verifiedPct === null ? '—' : s.verifiedPct + '%') },
        anchored: { icon: 'link', label: 'Anchored', value: s => String(s.anchored) }
    };

    /* ---------- content-page hero chips ---------- */
    async function enhancePageHero(hero) {
        const spec = (hero.getAttribute('data-inv-chips') || '').split(',').map(x => x.trim()).filter(Boolean);
        if (!spec.length || hero.querySelector('.hero-chipset')) return;
        hero.classList.add('inv-hero');
        const cs = document.createElement('div');
        cs.className = 'hero-chipset';
        cs.innerHTML = spec.map(k => {
            const d = CHIP_DEFS[k];
            return d ? `<div class="hero-chip" data-chip="${k}"><span class="stat-ic"><i data-lucide="${d.icon}"></i></span><div><b>…</b><span>${d.label}</span></div></div>` : '';
        }).join('');
        hero.appendChild(cs);
        refreshIcons();
        const s = await getStats();
        if (!s) { cs.querySelectorAll('b').forEach(b => { b.textContent = '—'; }); return; }
        cs.querySelectorAll('.hero-chip').forEach(ch => {
            const d = CHIP_DEFS[ch.getAttribute('data-chip')];
            const b = ch.querySelector('b');
            if (d && b) b.textContent = d.value(s);
        });
    }

    /* ---------- dashboard live panel + sparkline ---------- */
    async function enhanceDashboard() {
        const hashEl = document.getElementById('inv-hv-hash');
        if (!hashEl) return; // not the dashboard
        const s = await getStats();
        if (!s) return;
        const custEl = document.getElementById('inv-hv-custody');
        const anchorEl = document.getElementById('inv-hv-anchor');
        const scanEl = document.getElementById('inv-hv-scan');
        if (s.lastRun && s.lastRun.checked) {
            const passed = s.lastRun.checked - (s.lastRun.mismatches || 0);
            const ok = (s.lastRun.mismatches || 0) === 0;
            hashEl.innerHTML = `<i data-lucide="${ok ? 'check-circle-2' : 'alert-triangle'}"></i>${passed}/${s.lastRun.checked} passed`;
            hashEl.className = ok ? 'hv-ok' : 'hv-warn';
        } else {
            hashEl.innerHTML = '<i data-lucide="minus-circle"></i>No scan yet';
        }
        if (custEl) {
            custEl.innerHTML = s.custody.length
                ? '<i data-lucide="link"></i>Intact'
                : '<i data-lucide="minus-circle"></i>No activity';
            custEl.className = s.custody.length ? 'hv-ok' : '';
        }
        if (anchorEl) {
            if (s.evidence === 0) {
                anchorEl.innerHTML = '<i data-lucide="minus-circle"></i>No evidence';
            } else if (s.anchored === 0) {
                anchorEl.innerHTML = '<i data-lucide="clock"></i>Pending';
                anchorEl.className = 'hv-warn';
            } else {
                anchorEl.innerHTML = `<i data-lucide="check-circle-2"></i>${s.anchored}/${s.evidence} anchored`;
                anchorEl.className = s.anchored === s.evidence ? 'hv-ok' : 'hv-warn';
            }
        }
        if (scanEl) scanEl.innerHTML = `<i data-lucide="history"></i>${relTime(s.lastRun && s.lastRun.finished_at)}`;

        // sparkline: real custody events per day, last 7 days
        const spark = document.getElementById('inv-sparkline');
        if (spark) {
            const days = [];
            const now = new Date(); now.setHours(0, 0, 0, 0);
            for (let i = 6; i >= 0; i--) days.push({ t: now.getTime() - i * 86400000, n: 0 });
            s.custody.forEach(e => {
                const d = new Date(e.created_at); d.setHours(0, 0, 0, 0);
                const slot = days.find(x => x.t === d.getTime());
                if (slot) slot.n++;
            });
            const max = Math.max(...days.map(d => d.n), 1);
            const W = 220, H = 46, pad = 4;
            const pts = days.map((d, i) => {
                const x = (i / 6) * (W - pad * 2) + pad;
                const y = H - pad - (d.n / max) * (H - pad * 2 - 6);
                return [Math.round(x), Math.round(y)];
            });
            const line = pts.map(p => p.join(',')).join(' ');
            spark.innerHTML = `
              <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
                <defs><linearGradient id="invAg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="rgba(255,200,200,.5)"/><stop offset="1" stop-color="rgba(255,200,200,0)"/></linearGradient></defs>
                <polygon points="${line} ${W - pad},${H} ${pad},${H}" fill="url(#invAg)"/>
                <polyline points="${line}" fill="none" stroke="#ffd0d0" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="${pts[6][0]}" cy="${pts[6][1]}" r="3.5" fill="#fff"/>
              </svg>`;
            const lbl = document.getElementById('inv-spark-total');
            if (lbl) lbl.textContent = days.reduce((a, d) => a + d.n, 0) + ' events';
        }
        refreshIcons();
    }

    /* ---------- table pill badges (opt-in) ---------- */
    const ICON_CELL = { case_number: 'shield', created_date: 'calendar', created_at: 'calendar', evidence: 'file-text', evidence_count: 'file-text' };
    function pillTable(table) {
        const heads = [...table.querySelectorAll('thead th')].map(th => th.getAttribute('data-sort') || th.textContent.trim().toLowerCase());
        table.querySelectorAll('tbody tr').forEach(tr => {
            const tds = [...tr.children];
            tds.forEach((td, i) => {
                if (td.dataset.pilled) return;
                td.dataset.pilled = '1';
                const key = heads[i] || '';
                const txt = td.textContent.trim();
                if (!txt) return;
                if (ICON_CELL[key] && !td.querySelector('svg')) {
                    td.innerHTML = `<i data-lucide="${ICON_CELL[key]}" class="cell-ic"></i>${td.innerHTML}`;
                } else if (key === 'status' && !td.querySelector('.pill')) {
                    td.innerHTML = `<span class="pill pill-status">${txt}</span>`;
                } else if (key === 'priority_level' && !td.querySelector('.pill')) {
                    td.innerHTML = `<span class="pill pill-prio">${txt}</span>`;
                } else if ((key === 'type' || key === 'case_type') && !td.querySelector('.pill')) {
                    td.innerHTML = `<span class="pill pill-type">${txt.charAt(0).toUpperCase() + txt.slice(1)}</span>`;
                } else if (i === tds.length - 1) {
                    const btn = td.querySelector('button, a');
                    if (btn && !btn.querySelector('i') && !btn.querySelector('svg')) {
                        btn.insertAdjacentHTML('afterbegin', '<i data-lucide="settings"></i>');
                    }
                }
            });
        });
        refreshIcons();
    }
    function watchTables() {
        document.querySelectorAll('table[data-inv-table]').forEach(t => {
            pillTable(t);
            const body = t.querySelector('tbody');
            if (body) new MutationObserver(() => pillTable(t)).observe(body, { childList: true, subtree: true });
        });
    }

    /* ---------- filter label icons (opt-in) ---------- */
    function enhanceFilters() {
        document.querySelectorAll('[data-inv-filter-icons]').forEach(box => {
            let map;
            try { map = JSON.parse(box.getAttribute('data-inv-filter-icons')); } catch (_) { return; }
            Object.entries(map).forEach(([id, icon]) => {
                const lab = box.querySelector(`label[for="${id}"]`);
                if (lab && !lab.querySelector('i') && !lab.querySelector('svg')) {
                    lab.insertAdjacentHTML('afterbegin', `<i data-lucide="${icon}"></i>`);
                }
            });
        });
        refreshIcons();
    }

    /* ---------- evidence stat bars (real proportions) ---------- */
    function enhanceEvidenceStats() {
        const items = [...document.querySelectorAll('.stat-item')].filter(el => el.querySelector('[id^="stat"]'));
        if (!items.length) return;
        const update = () => {
            const vals = items.map(el => parseInt((el.querySelector('[id^="stat"]') || {}).textContent, 10) || 0);
            const max = Math.max(...vals, 1);
            items.forEach((el, i) => {
                let bar = el.querySelector('.stat-bar');
                if (!bar) {
                    bar = document.createElement('div');
                    bar.className = 'stat-bar';
                    bar.innerHTML = '<i></i>';
                    el.appendChild(bar);
                }
                bar.firstElementChild.style.width = Math.max(6, Math.round((vals[i] / max) * 100)) + '%';
            });
        };
        update();
        items.forEach(el => {
            const n = el.querySelector('[id^="stat"]');
            if (n) new MutationObserver(update).observe(n, { childList: true, characterData: true, subtree: true });
        });
    }

    /* ---------- navbar active underline ---------- */
    function markActiveNav() {
        const page = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-item').forEach(a => {
            const href = (a.getAttribute('href') || '').split('#')[0];
            if (href === page) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
        });
    }

    /* ---------- boot ---------- */
    function boot() {
        markActiveNav();
        document.querySelectorAll('[data-inv-chips]').forEach(enhancePageHero);
        enhanceDashboard();
        watchTables();
        enhanceFilters();
        enhanceEvidenceStats();
        refreshIcons();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
