/**
 * Analyst Evidence Display Module
 * Renders the analyst evidence inventory and active cases from the
 * role-scoped /analyst API. No localStorage fallback, no hardcoded records.
 * Dynamic content is built with textContent / DOM primitives (no innerHTML).
 */

class AnalystEvidenceDisplay {
    constructor() {
        this.evidence = [];
        this.cases = [];
        this.error = null;
    }

    async init() {
        this.error = null;
        await Promise.all([this.loadEvidence(), this.loadCases()]);
        this.render();
        refreshIcons();
    }

    async loadEvidence() {
        this.showLoading('analystEvidenceList', 'Loading evidence inventory…');
        if (!window.apiClient) return;
        try {
            const res = await window.apiClient.get('/analyst/evidence', { skipWalletAuth: true });
            this.evidence = (res && res.data) || [];
        } catch (error) {
            console.error('Error loading evidence:', error);
            this.error = this.error || error;
        }
    }

    async loadCases() {
        this.showLoading('analystCaseList', 'Loading active cases…');
        if (!window.apiClient) return;
        try {
            const res = await window.apiClient.get('/analyst/cases', { skipWalletAuth: true });
            this.cases = (res && res.data) || [];
        } catch (error) {
            console.error('Error loading cases:', error);
            this.error = this.error || error;
        }
    }

    render() {
        this.renderEvidence();
        this.renderCases();
    }

    renderEvidence() {
        const container = document.getElementById('analystEvidenceList');
        if (!container) return;
        this.clearNode(container);

        if (this.error && this.evidence.length === 0) {
            container.appendChild(this.renderError(
                'Could not load evidence inventory. ' + (this.error.message || 'Check your connection.')));
            return;
        }
        if (this.evidence.length === 0) {
            container.appendChild(this.emptyBlock('No evidence assigned', 'Evidence routed to your analysis queue will appear here.'));
            return;
        }

        const table = buildTable(
            ['Evidence ID', 'Name', 'Case', 'Type', 'Task Status', 'Recorded', 'Actions'],
            this.evidence.map((item) => {
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
                row.push(actions);
                return row;
            })
        );
        container.appendChild(table);
    }

    renderCases() {
        const container = document.getElementById('analystCaseList');
        if (!container) return;
        this.clearNode(container);

        if (this.error && this.cases.length === 0) {
            container.appendChild(this.renderError(
                'Could not load cases. ' + (this.error.message || 'Check your connection.')));
            return;
        }
        if (this.cases.length === 0) {
            container.appendChild(this.emptyBlock('No active cases', 'Cases assigned to you will appear here.'));
            return;
        }

        const table = buildTable(
            ['Case ID', 'Title', 'Status', 'Priority', 'Jurisdiction', 'Created', 'Actions'],
            this.cases.map((caseItem) => {
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

    renderError(message) {
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
        retry.addEventListener('click', () => this.init());

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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        analystEvidence = new AnalystEvidenceDisplay();
        analystEvidence.init();
    });
} else {
    analystEvidence = new AnalystEvidenceDisplay();
    analystEvidence.init();
}
window.analystEvidence = analystEvidence;