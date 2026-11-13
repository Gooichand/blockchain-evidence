/**
 * Analyst Evidence Display Module
 * Renders the analyst evidence inventory and active cases from the
 * role-scoped /analyst API. No localStorage fallback, no hardcoded records.
 * Dynamic content is built with textContent / DOM primitives (no innerHTML).
 *
 * Filtering/paging follow the A8 contract: page/limit (+ search) are sent to
 * the server and its pagination envelope is used when present. On backends
 * without paging the full list is paged client-side instead.
 */

class AnalystEvidenceDisplay {
    constructor() {
        this.evidence = [];
        this.cases = [];
        this.evidenceError = null;
        this.casesError = null;
        this.evidenceState = { page: 1, limit: 10, total: 0, pages: 0, search: '', serverPaged: false };
        this.casesState = { page: 1, limit: 10, total: 0, pages: 0, search: '', serverPaged: false };
        this.evidenceSeq = 0;
        this.casesSeq = 0;
    }

    async init() {
        await Promise.all([this.loadEvidence(), this.loadCases()]);
        refreshIcons();
    }

    // Builds the filter + paging toolbar once per list, then only refreshes the pager.
    ensureToolbar(containerId, state, onSearch, onPage, searchLabel) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        let host = container.previousElementSibling;
        if (!host || !host.classList || !host.classList.contains('inventory-toolbar')) {
            host = document.createElement('div');
            host.className = 'inventory-toolbar queue-toolbar';
            const searchBox = document.createElement('div');
            searchBox.className = 'search-box';
            const input = document.createElement('input');
            input.type = 'search';
            input.placeholder = 'Filter…';
            input.setAttribute('aria-label', searchLabel);
            input.value = state.search;
            let t;
            input.addEventListener('input', () => {
                clearTimeout(t);
                t = setTimeout(() => onSearch(input.value.trim()), 400);
            });
            searchBox.appendChild(input);
            const pagerSlot = document.createElement('span');
            pagerSlot.className = 'inventory-pager-slot';
            host.appendChild(searchBox);
            host.appendChild(pagerSlot);
            container.parentNode.insertBefore(host, container);
        }
        const slot = host.querySelector('.inventory-pager-slot');
        this.clearNode(slot);
        slot.appendChild(buildPager(state, onPage, searchLabel + ' pages'));
        return host;
    }

    async loadEvidence() {
        this.showLoading('analystEvidenceList', 'Loading evidence inventory…');
        if (!window.apiClient) return;
        const seq = ++this.evidenceSeq;
        const state = this.evidenceState;
        const params = new URLSearchParams();
        params.set('page', String(state.page));
        params.set('limit', String(state.limit));
        if (state.search) params.set('search', state.search);
        try {
            const res = await window.apiClient.get('/analyst/evidence?' + params.toString(), { skipWalletAuth: true });
            if (seq !== this.evidenceSeq) return; // stale response after a newer filter
            this.evidenceError = null;
            const rows = (res && res.data) || [];
            const pg = readEnvelopePagination(res, rows.length);
            if (pg) {
                this.evidence = rows;
                Object.assign(state, { page: pg.page, limit: pg.limit, total: pg.total, pages: pg.pages, serverPaged: true });
            } else {
                // Backend without the A8 paging contract: do not fetch/render all
                // rows. Gate behind an explicit upgrade-needed state instead.
                this.evidence = [];
                state.unsupported = true;
                state.total = 0;
                state.pages = 0;
            }
        } catch (error) {
            if (seq !== this.evidenceSeq) return;
            console.error('Error loading evidence:', error);
            this.evidenceError = error;
            this.evidence = [];
        }
        this.renderEvidence();
    }


    async loadCases() {
        this.showLoading('analystCaseList', 'Loading active cases…');
        if (!window.apiClient) return;
        const seq = ++this.casesSeq;
        const state = this.casesState;
        const params = new URLSearchParams();
        params.set('page', String(state.page));
        params.set('limit', String(state.limit));
        if (state.search) params.set('search', state.search);
        try {
            const res = await window.apiClient.get('/analyst/cases?' + params.toString(), { skipWalletAuth: true });
            if (seq !== this.casesSeq) return;
            this.casesError = null;
            const rows = (res && res.data) || [];
            const pg = readEnvelopePagination(res, rows.length);
            if (pg) {
                this.cases = rows;
                Object.assign(state, { page: pg.page, limit: pg.limit, total: pg.total, pages: pg.pages, serverPaged: true });
            } else {
                this.cases = [];
                state.unsupported = true;
                state.total = 0;
                state.pages = 0;
            }
        } catch (error) {
            if (seq !== this.casesSeq) return;
            console.error('Error loading cases:', error);
            this.casesError = error;
            this.cases = [];
        }
        this.renderCases();
    }


    renderEvidence() {
        const container = document.getElementById('analystEvidenceList');
        if (!container) return;
        const state = this.evidenceState;
        this.ensureToolbar('analystEvidenceList', state,
            (q) => { state.search = q; state.page = 1; this.loadEvidence(); },
            (page) => { state.page = page; this.loadEvidence(); },
            'Filter evidence inventory');
        this.clearNode(container);

        if (this.evidenceError && state.total === 0) {
            container.appendChild(this.renderError(
                'Could not load evidence inventory. ' + (this.evidenceError.message || 'Check your connection.'),
                () => this.loadEvidence()));
            return;
        }
        if (state.unsupported) {
            container.appendChild(this.renderError(
                'Evidence inventory paging needs the updated backend (A8). This server does not return paging information yet, so the inventory is not shown rather than loading every row.',
                () => this.loadEvidence()));
            return;
        }
        const rows = this.evidence;
        if (rows.length === 0) {
            container.appendChild(state.total > 0
                ? this.emptyBlock('Empty page', 'No rows on this page. Go back a page or clear the filter.')
                : this.emptyBlock(state.search ? 'No matching evidence' : 'No evidence assigned',
                    state.search ? 'Nothing in your inventory matches that filter.' : 'Evidence routed to your analysis queue will appear here.'));
            return;
        }

        const table = buildTable(
            ['Evidence ID', 'Name', 'Case', 'Type', 'Task Status', 'Recorded', 'Actions'],
            rows.map((item) => {
                const row = [
                    hashCell('#' + item.id),
                    textCell(item.name || 'Untitled'),
                    textCell(item.case_number ? '#' + item.case_number : '—'),
                    textCell(item.file_type || '—'),
                    badgeCell(taskStatusLabel(item.task_status), taskStatusClass(item.task_status)),
                    textCell(formatDate(item.timestamp)),
                ];
                const actions = document.createElement('td');
                const view = document.createElement('a');
                view.className = 'btn btn-outline btn-sm';
                view.href = 'evidence-verification.html?id=' + item.id;
                view.textContent = 'View';
                view.setAttribute('aria-label', 'View evidence #' + item.id);
                actions.appendChild(view);
                if (item.task_id && window.analystDashboard) {
                    const open = document.createElement('button');
                    open.className = 'btn btn-outline btn-sm';
                    open.type = 'button';
                    open.textContent = 'Workspace';
                    open.setAttribute('aria-label', 'Open workspace for evidence #' + item.id);
                    open.addEventListener('click', () => window.analystDashboard.openWorkspace(item.task_id));
                    actions.appendChild(open);
                }
                row.push(actions);
                return row;
            })
        );
        container.appendChild(table);
        container.appendChild(listNote(state, 'evidence'));
    }

    renderCases() {
        const container = document.getElementById('analystCaseList');
        if (!container) return;
        const state = this.casesState;
        this.ensureToolbar('analystCaseList', state,
            (q) => { state.search = q; state.page = 1; this.loadCases(); },
            (page) => { state.page = page; this.loadCases(); },
            'Filter active cases');
        this.clearNode(container);

        if (this.casesError && state.total === 0) {
            container.appendChild(this.renderError(
                'Could not load cases. ' + (this.casesError.message || 'Check your connection.'),
                () => this.loadCases()));
            return;
        }
        if (state.unsupported) {
            container.appendChild(this.renderError(
                'Case list paging needs the updated backend (A8). This server does not return paging information yet, so the list is not shown rather than loading every row.',
                () => this.loadCases()));
            return;
        }
        const rows = this.cases;
        if (rows.length === 0) {
            container.appendChild(state.total > 0
                ? this.emptyBlock('Empty page', 'No rows on this page. Go back a page or clear the filter.')
                : this.emptyBlock(state.search ? 'No matching cases' : 'No active cases',
                    state.search ? 'None of your cases match that filter.' : 'Cases assigned to you will appear here.'));
            return;
        }

        const table = buildTable(
            ['Case ID', 'Title', 'Status', 'Priority', 'Jurisdiction', 'Created', 'Actions'],
            rows.map((caseItem) => {
                const row = [
                    textCell('#' + (caseItem.case_number || caseItem.id)),
                    textCell(caseItem.title || 'Untitled case'),
                    badgeCell(caseStatusLabel(caseItem.status), caseStatusClass(caseItem.status)),
                    badgeCell(priorityLabel(caseItem.priority_level), priorityClass(caseItem.priority_level)),
                    textCell(caseItem.jurisdiction || '—'),
                    textCell(formatDate(caseItem.created_date)),
                ];
                const linkTd = document.createElement('td');
                const view = document.createElement('a');
                view.className = 'btn btn-outline btn-sm';
                view.href = 'case-timeline.html?id=' + (caseItem.id || caseItem.case_id);
                view.textContent = 'View Case';
                view.setAttribute('aria-label', 'View case ' + (caseItem.case_number || caseItem.id));
                linkTd.appendChild(view);
                row.push(linkTd);
                return row;
            })
        );
        container.appendChild(table);
        container.appendChild(listNote(state, 'cases'));
    }

    showLoading(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;
        this.clearNode(container);
        const loading = document.createElement('div');
        loading.className = 'analyst-loading';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.borderTopColor = '#7c3aed';
        const label = document.createElement('p');
        label.textContent = message || 'Loading…';
        loading.appendChild(spinner);
        loading.appendChild(label);
        container.appendChild(loading);
    }

    clearNode(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    emptyBlock(title, message) {
        const box = document.createElement('div');
        box.className = 'analyst-empty';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'inbox');

        const strong = document.createElement('strong');
        strong.textContent = title;

        const span = document.createElement('span');
        span.textContent = message;

        box.appendChild(icon);
        box.appendChild(strong);
        box.appendChild(span);
        return box;
    }

    renderError(message, retryFn) {
        const box = document.createElement('div');
        box.className = 'analyst-error';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'triangle-alert');
        icon.className = 'error-icon';

        const p = document.createElement('p');
        p.textContent = message;

        const retry = document.createElement('button');
        retry.className = 'btn btn-outline btn-sm';
        retry.type = 'button';
        retry.textContent = 'Retry';
        retry.addEventListener('click', retryFn || (() => this.init()));

        box.appendChild(icon);
        box.appendChild(p);
        box.appendChild(retry);
        return box;
    }
}

// ------------------------------------------------------------- helpers (module scope)

function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function readEnvelopePagination(res, rowCount) {
    const p = res && res.pagination;
    if (p && Number.isFinite(Number(p.page)) && Number.isFinite(Number(p.total))) {
        const limit = Number(p.limit) || rowCount || 10;
        const total = Number(p.total) || 0;
        return {
            page: Number(p.page),
            limit,
            total,
            pages: Number.isFinite(Number(p.pages)) ? Number(p.pages) : Math.ceil(total / limit),
        };
    }
    return null;
}

function buildPager(state, onPage, ariaLabel) {
    const wrap = document.createElement('span');
    wrap.className = 'pager';
    wrap.setAttribute('role', 'navigation');
    wrap.setAttribute('aria-label', ariaLabel || 'Pages');

    const prev = document.createElement('button');
    prev.className = 'btn btn-outline btn-sm';
    prev.type = 'button';
    prev.textContent = 'Previous';
    prev.disabled = state.page <= 1;
    prev.setAttribute('aria-label', 'Previous page');
    prev.addEventListener('click', () => onPage(state.page - 1));

    const next = document.createElement('button');
    next.className = 'btn btn-outline btn-sm';
    next.type = 'button';
    next.textContent = 'Next';
    next.disabled = state.pages === 0 || state.page >= state.pages;
    next.setAttribute('aria-label', 'Next page');
    next.addEventListener('click', () => onPage(state.page + 1));

    const label = document.createElement('span');
    label.className = 'pager-label';
    label.textContent = state.pages === 0 ? 'No pages' : 'Page ' + state.page + ' of ' + state.pages;

    const total = document.createElement('span');
    total.className = 'pager-total';
    total.textContent = state.total + ' total';

    wrap.appendChild(prev);
    wrap.appendChild(label);
    wrap.appendChild(next);
    wrap.appendChild(total);
    return wrap;
}

function listNote(state, what) {
    const note = document.createElement('p');
    note.className = 'section-sub';
    const from = state.total === 0 ? 0 : (state.page - 1) * state.limit + 1;
    const to = Math.min(state.total, state.page * state.limit);
    note.textContent = 'Showing ' + from + '–' + to + ' of ' + state.total + ' ' + what + '.';
    return note;
}

function toTitle(s) {
    return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function textCell(value) {
    const td = document.createElement('td');
    td.textContent = value;
    return td;
}

function hashCell(value) {
    const td = document.createElement('td');
    const span = document.createElement('span');
    span.className = 'hash-cell';
    span.textContent = value;
    span.title = value;
    td.appendChild(span);
    return td;
}

function badgeCell(text, cls) {
    const td = document.createElement('td');
    const span = document.createElement('span');
    span.className = 'evid-badge ' + (cls || '');
    span.textContent = text;
    td.appendChild(span);
    return td;
}

function buildTable(headers, rowBuilders) {
    const wrap = document.createElement('div');
    wrap.className = 'reports-table-wrap';

    const table = document.createElement('table');
    table.className = 'reports-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headers.forEach((label) => {
        const th = document.createElement('th');
        th.textContent = label;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement('tbody');
    rowBuilders.forEach((cells) => {
        const tr = document.createElement('tr');
        cells.forEach((cell) => tr.appendChild(cell));
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
}

function taskStatusLabel(status) {
    if (!status || status === 'none') return 'Unassigned';
    return toTitle(status);
}

function taskStatusClass(status) {
    const s = String(status || 'none').toLowerCase();
    if (s === 'pending') return 'badge-status-pending';
    if (s === 'in_progress' || s === 'in-progress') return 'badge-status-in_progress';
    if (s === 'completed' || s === 'complete') return 'badge-status-completed';
    if (s === 'draft') return 'badge-status-draft';
    if (s === 'submitted') return 'badge-status-submitted';
    if (s === 'approved') return 'badge-status-approved';
    return 'badge-status-archived';
}

function caseStatusLabel(status) {
    return toTitle(status || 'Open');
}

function caseStatusClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'open') return 'badge-status-in_progress';
    if (s === 'completed' || s === 'resolved') return 'badge-status-completed';
    if (s === 'draft') return 'badge-status-draft';
    if (s === 'submitted') return 'badge-status-submitted';
    if (s === 'approved') return 'badge-status-approved';
    if (s === 'closed') return 'badge-status-archived';
    return 'badge-status-archived';
}

function priorityLabel(priority) {
    return toTitle(priority || 'Medium');
}

function priorityClass(priority) {
    const p = String(priority || 'medium').toLowerCase();
    if (p === 'critical') return 'badge-priority-critical';
    if (p === 'high') return 'badge-priority-high';
    if (p === 'low') return 'badge-priority-low';
    return 'badge-priority-medium';
}

// Auto-initialize when DOM is ready; analyst-dashboard.js can also call
// window.analystEvidence.init() again on refresh.
let analystEvidence;
function bootAnalystEvidence() {
    analystEvidence = new AnalystEvidenceDisplay();
    window.analystEvidence = analystEvidence;
    analystEvidence.init();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAnalystEvidence);
} else {
    bootAnalystEvidence();
}
