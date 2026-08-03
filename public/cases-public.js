/**
 * EVID-DGC Public Cases Directory — filterable, paginated, XSS-safe rendering.
 */
(function () {
    'use strict';

    var u = window.EVIDPublic;

    var state = {
        search: '',
        caseType: '',
        jurisdiction: '',
        dateFrom: '',
        dateTo: '',
        page: 1,
        limit: 12,
        total: 0,
    };

    function createEl(tag, className, text) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function showError(container, message) {
        container.innerHTML = '';
        container.appendChild(createEl('div', 'pv-error-banner', message));
    }

    // ----------------------------------------------------------------
    // Data loading
    // ----------------------------------------------------------------
    function buildQuery() {
        var q = { page: state.page, limit: state.limit };
        if (state.search) q.search = state.search;
        if (state.caseType) q.caseType = state.caseType;
        if (state.jurisdiction) q.jurisdiction = state.jurisdiction;
        if (state.dateFrom) q.dateFrom = state.dateFrom;
        if (state.dateTo) q.dateTo = state.dateTo;
        return q;
    }

    function applyStateToControls() {
        var searchInput = document.getElementById('pvFilterSearch');
        if (searchInput) searchInput.value = state.search;
        var type = document.getElementById('pvFilterType');
        if (type) type.value = state.caseType;
        var jurisdiction = document.getElementById('pvFilterJurisdiction');
        if (jurisdiction) jurisdiction.value = state.jurisdiction;
        var from = document.getElementById('pvFilterFrom');
        if (from) from.value = state.dateFrom;
        var to = document.getElementById('pvFilterTo');
        if (to) to.value = state.dateTo;
    }

    function readStateFromControls() {
        state.search = document.getElementById('pvFilterSearch').value.trim();
        state.caseType = document.getElementById('pvFilterType').value;
        state.jurisdiction = document.getElementById('pvFilterJurisdiction').value.trim();
        state.dateFrom = document.getElementById('pvFilterFrom').value;
        state.dateTo = document.getElementById('pvFilterTo').value;
    }

    async function loadCases() {
        var grid = document.getElementById('pvCasesGrid');
        grid.innerHTML = '';
        [0, 1, 2, 3].forEach(function () { grid.appendChild(createEl('div', 'pv-skeleton')); });

        try {
            var res = await window.publicAPI.getCases(buildQuery());
            state.total = (res.pagination && res.pagination.total) || 0;
            setText('pvResultCount', state.total + ' case(s)');
            grid.innerHTML = '';
            if (!res.data || res.data.length === 0) {
                var empty = createEl('div', 'pv-empty');
                var icon = createEl('i', '', '');
                icon.dataset.lucide = 'search-x';
                empty.appendChild(icon);
                empty.appendChild(document.createElement('br'));
                empty.appendChild(document.createTextNode(
                    'No published cases match your criteria. Try broadening the filters or clearing the search.'));
                grid.appendChild(empty);
                if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (e) { } }
                renderPagination();
                return;
            }
            res.data.forEach(function (c) { grid.appendChild(buildCaseCard(c)); });
            if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (e) { } }
        } catch (err) {
            grid.innerHTML = '';
            showError(grid, 'Unable to load published cases. Please try again later.');
        }
        renderPagination();
    }

    // ----------------------------------------------------------------
    // Case cards
    // ----------------------------------------------------------------
    function buildCaseCard(c) {
        var card = createEl('article', 'pv-case-card' + (c.blockchain_verified ? ' pv-verified' : ''));
        var head = createEl('div', 'pv-case-head');
        head.appendChild(createEl('span', 'pv-reference', u.toPublicReference(c.reference_number, c.id)));

        var statusWrap = createEl('span', '');
        if (c.blockchain_verified) {
            var badge = createEl('span', 'pv-badge pv-badge--verified');
            var badgeIcon = createEl('i', '', '');
            badgeIcon.dataset.lucide = 'badge-check';
            badge.appendChild(badgeIcon);
            badge.appendChild(document.createTextNode(' Blockchain Verified'));
            statusWrap.appendChild(badge);
        } else {
            var neutral = createEl('span', 'pv-badge pv-badge--published');
            neutral.textContent = 'Published';
            statusWrap.appendChild(neutral);
        }
        head.appendChild(statusWrap);
        card.appendChild(head);

        card.appendChild(createEl('h3', 'pv-case-title', c.title || 'Untitled case'));

        var summary = c.summary || 'A privacy-redacted summary for this case will be shown here once released.';
        card.appendChild(createEl('p', 'pv-case-summary', summary));

        var meta = createEl('div', 'pv-case-meta');
        var j = createEl('div');
        j.appendChild(createEl('span', 'pv-meta-key', 'Jurisdiction: '));
        j.appendChild(document.createTextNode(c.jurisdiction || 'General'));
        meta.appendChild(j);
        var pd = createEl('div');
        pd.appendChild(createEl('span', 'pv-meta-key', 'Published: '));
        pd.appendChild(document.createTextNode(u.formatDate(c.published_date)));
        meta.appendChild(pd);
        var ct = createEl('div');
        ct.appendChild(createEl('span', 'pv-meta-key', 'Type: '));
        ct.appendChild(document.createTextNode(c.case_type || 'criminal'));
        meta.appendChild(ct);
        var ec = createEl('div');
        ec.appendChild(createEl('span', 'pv-meta-key', 'Evidence: '));
        ec.appendChild(document.createTextNode(String(c.evidence_count || 0)));
        meta.appendChild(ec);
        card.appendChild(meta);

        var actions = createEl('div', 'pv-case-actions');
        var btn = createEl('button', 'pv-btn pv-btn--outline', 'View Public Summary');
        btn.type = 'button';
        btn.style.padding = '10px 16px';
        btn.addEventListener('click', function () { openSummary(c); });
        actions.appendChild(btn);
        card.appendChild(actions);
        return card;
    }

    // ----------------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------------
    function renderPagination() {
        var nav = document.getElementById('pvPagination');
        nav.innerHTML = '';
        var pages = Math.max(Math.ceil(state.total / state.limit), 1);
        if (pages <= 1 && state.page === 1) return;

        var prev = createEl('button', 'pv-page-btn', 'Previous');
        prev.type = 'button';
        prev.disabled = state.page <= 1;
        prev.addEventListener('click', function () { goPage(state.page - 1); });
        nav.appendChild(prev);

        var start = Math.max(1, Math.min(state.page - 2, pages - 4));
        var end = Math.min(pages, start + 4);
        for (var p = start; p <= end; p++) {
            (function (page) {
                var btn = createEl('button', 'pv-page-btn' + (page === state.page ? ' active' : ''), String(page));
                btn.type = 'button';
                btn.addEventListener('click', function () { goPage(page); });
                nav.appendChild(btn);
            })(p);
        }

        var next = createEl('button', 'pv-page-btn', 'Next');
        next.type = 'button';
        next.disabled = state.page >= pages;
        next.addEventListener('click', function () { goPage(state.page + 1); });
        nav.appendChild(next);

        nav.appendChild(createEl('span', 'pv-page-info',
            'Page ' + state.page + ' of ' + pages + ' — ' + state.total + ' cases'));
    }

    function goPage(page) {
        if (page < 1) return;
        state.page = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadCases();
    }

    // ----------------------------------------------------------------
    // Public summary modal
    // ----------------------------------------------------------------
    async function openSummary(c) {
        var backdrop = document.getElementById('pvSummaryModal');
        var body = document.getElementById('pvSummaryBody');
        backdrop.classList.add('open');
        backdrop.setAttribute('aria-hidden', 'false');
        body.innerHTML = '';
        body.appendChild(createEl('div', 'pv-skeleton'));

        var detail, evidence;
        try {
            var results = await Promise.all([
                window.publicAPI.getCase(c.id),
                window.publicAPI.getCaseEvidence(c.id)
            ]);
            detail = results[0].data;
            evidence = results[1].data || [];
        } catch (err) {
            body.innerHTML = '';
            body.appendChild(createEl('p', 'pv-error-banner', 'Unable to load the public case summary.'));
            return;
        }

        body.innerHTML = '';
        var ref = createEl('div');
        ref.appendChild(createEl('span', 'pv-reference', u.toPublicReference(detail.reference_number, detail.id)));
        var badge = createEl('span', 'pv-badge pv-badge--published', ' Published');
        badge.style.marginLeft = '10px';
        ref.appendChild(badge);
        body.appendChild(ref);

        body.appendChild(createEl('h3', 'pv-case-title', detail.title || 'Untitled case'));
        var sum = createEl('p', 'pv-case-summary', detail.summary || 'No public summary has been released for this case.');
        sum.style.marginTop = '10px';
        body.appendChild(sum);

        var meta = createEl('div', 'pv-case-meta');
        meta.style.marginTop = '14px';
        meta.appendChild(metaItem('Jurisdiction', detail.jurisdiction));
        meta.appendChild(metaItem('Published', u.formatDate(detail.published_date)));
        meta.appendChild(metaItem('Case type', detail.case_type));
        meta.appendChild(metaItem('Released evidence', String(detail.evidence_count || 0)));
        body.appendChild(meta);

        body.appendChild(createEl('h4', 'pv-section-title', 'Released Evidence'));
        var list = createEl('ul', 'pv-activity-list');
        list.style.marginTop = '8px';
        if (!evidence.length) {
            list.appendChild(createEl('li', 'pv-activity-item', 'No evidence items have been released for this case.'));
        } else {
            evidence.forEach(function (e) {
                var li = createEl('li', 'pv-activity-item');
                var icon = createEl('div', 'pv-activity-icon');
                var iconInner = createEl('i', '', '');
                iconInner.dataset.lucide = e.blockchain_verified ? 'badge-check' : 'file';
                icon.appendChild(iconInner);
                li.appendChild(icon);
                var b = createEl('div', 'pv-activity-body');
                b.appendChild(createEl('div', 'pv-activity-action', e.title || ('Evidence ' + e.id)));
                var sub = createEl('div');
                sub.style.fontSize = '0.82rem';
                sub.style.color = '#5f6368';
                sub.textContent = (e.file_type || 'file') + ' · ' + u.formatDate(e.timestamp) + ' · ' +
                    (e.blockchain_verified ? 'verified' : 'released');
                b.appendChild(sub);
                if (e.hash) {
                    var code = createEl('code', '', '');
                    code.textContent = u.truncate(e.hash, 10);
                    code.style.fontSize = '0.78rem';
                    b.appendChild(code);
                }
                li.appendChild(b);
                list.appendChild(li);
            });
        }
        body.appendChild(list);

        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (e) { } }
    }

    function metaItem(key, value) {
        var div = createEl('div');
        div.appendChild(createEl('span', 'pv-meta-key', key + ': '));
        div.appendChild(document.createTextNode(value === null || value === undefined ? '—' : String(value)));
        return div;
    }

    // ----------------------------------------------------------------
    // Verify modal
    // ----------------------------------------------------------------
    var lastFocused = null;

    function openVerifyModal() {
        var backdrop = document.getElementById('pvVerifyModal');
        lastFocused = document.activeElement;
        backdrop.classList.add('open');
        backdrop.setAttribute('aria-hidden', 'false');
        var input = document.getElementById('pvVerifyInput');
        input.value = '';
        var error = document.getElementById('pvVerifyError');
        error.style.display = 'none';
        error.textContent = '';
        document.getElementById('pvVerifyResult').innerHTML = '';
        setTimeout(function () { input.focus(); }, 50);
    }

    function closeVerifyModal() {
        var backdrop = document.getElementById('pvVerifyModal');
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
        if (lastFocused) lastFocused.focus();
    }

    function closeSummaryModal() {
        var backdrop = document.getElementById('pvSummaryModal');
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
    }

    async function submitVerify(event) {
        event.preventDefault();
        var input = document.getElementById('pvVerifyInput');
        var error = document.getElementById('pvVerifyError');
        var resultBox = document.getElementById('pvVerifyResult');
        var submitBtn = document.getElementById('pvVerifySubmit');

        var validation = u.validateVerifyInput(input.value);
        if (!validation.ok) {
            error.textContent = validation.message;
            error.style.display = 'block';
            input.focus();
            return;
        }
        error.style.display = 'none';
        resultBox.innerHTML = '';
        resultBox.appendChild(createEl('div', 'pv-skeleton'));
        submitBtn.disabled = true;

        try {
            var res = await window.publicAPI.verify({ identifier: validation.normalized });
            resultBox.innerHTML = '';
            if (res.data && res.data.match) {
                resultBox.appendChild(buildVerifyMatch(res.data));
            } else {
                resultBox.appendChild(buildVerifyNoMatch(res.data));
            }
        } catch (err) {
            resultBox.innerHTML = '';
            resultBox.appendChild(createEl('p', 'pv-error-banner',
                'Verification failed: ' + u.escapeHtml(err.message || 'server error')));
        } finally {
            submitBtn.disabled = false;
        }
    }

    function buildVerifyMatch(d) {
        var box = createEl('div', 'pv-result pv-result--match');
        var title = createEl('div', 'pv-result-title');
        var titleIcon = createEl('i', '', '');
        titleIcon.dataset.lucide = 'badge-check';
        title.appendChild(titleIcon);
        title.appendChild(document.createTextNode(' Authentic — record matches a publicly released evidence item'));
        box.appendChild(title);

        var grid = createEl('div', 'pv-result-grid');
        grid.appendChild(verifyRow('Evidence ID', String(d.evidence.id)));
        grid.appendChild(verifyRow('Title', d.evidence.title));
        grid.appendChild(verifyRow('Case', d.evidence.case_number || '—'));
        grid.appendChild(verifyRow('SHA-256 hash', d.evidence.hash, true));
        grid.appendChild(verifyRow('Transaction hash', d.evidence.blockchain_tx_hash || '—', true));
        var blockNumber = d.evidence.blockchain.block_number;
        grid.appendChild(verifyRow('Block', blockNumber !== null && blockNumber !== undefined ? String(blockNumber) : '—'));
        grid.appendChild(verifyRow('Block timestamp', u.formatDate(d.evidence.blockchain.timestamp)));
        grid.appendChild(verifyRow('Recorded', u.formatDate(d.evidence.recorded_at)));
        grid.appendChild(verifyRow('Status', d.evidence.blockchain.status || 'recorded'));
        box.appendChild(grid);

        if (d.evidence.explorer_url) {
            var link = createEl('a', 'pv-result-link', '');
            link.href = d.evidence.explorer_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            var linkIcon = createEl('i', '', '');
            linkIcon.dataset.lucide = 'external-link';
            link.appendChild(linkIcon);
            link.appendChild(document.createTextNode(' View on block explorer'));
            box.appendChild(link);
        }
        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (e) { } }
        return box;
    }

    function buildVerifyNoMatch(d) {
        var box = createEl('div', 'pv-result pv-result--no-match');
        var title = createEl('div', 'pv-result-title');
        var titleIcon = createEl('i', '', '');
        titleIcon.dataset.lucide = 'circle-x';
        title.appendChild(titleIcon);
        title.appendChild(document.createTextNode(' No public match'));
        box.appendChild(title);
        box.appendChild(createEl('p', '', d.message || 'No publicly released record matches this reference.'));
        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (e) { } }
        return box;
    }

    function verifyRow(label, value, mono) {
        var div = createEl('div');
        div.appendChild(createEl('span', 'pv-meta-key', label));
        if (mono) {
            var code = createEl('code', '', '');
            code.textContent = value;
            div.appendChild(code);
        } else {
            div.appendChild(createEl('span', '', value));
        }
        return div;
    }

    // ----------------------------------------------------------------
    // Wire-up
    // ----------------------------------------------------------------
    function init() {
        var params = new URLSearchParams(window.location.search);
        state.search = params.get('search') || '';
        applyStateToControls();

        var searchInput = document.getElementById('pvFilterSearch');
        var applyBtn = document.getElementById('pvApplyFilters');
        var clearBtn = document.getElementById('pvClearFilters');
        var verifyBtn = document.getElementById('pvVerifyBtn');

        function applyFilters() {
            readStateFromControls();
            state.page = 1;
            loadCases();
        }

        if (searchInput) {
            searchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); applyFilters(); }
            });
        }
        if (applyBtn) applyBtn.addEventListener('click', applyFilters);
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                document.getElementById('pvFilterSearch').value = '';
                document.getElementById('pvFilterType').value = '';
                document.getElementById('pvFilterJurisdiction').value = '';
                document.getElementById('pvFilterFrom').value = '';
                document.getElementById('pvFilterTo').value = '';
                state.search = '';
                state.caseType = '';
                state.jurisdiction = '';
                state.dateFrom = '';
                state.dateTo = '';
                state.page = 1;
                loadCases();
            });
        }
        if (verifyBtn) verifyBtn.addEventListener('click', openVerifyModal);

        var verifyForm = document.getElementById('pvVerifyForm');
        var verifyClose = document.getElementById('pvVerifyClose');
        var verifyCancel = document.getElementById('pvVerifyCancel');
        var verifyModal = document.getElementById('pvVerifyModal');
        var summaryClose = document.getElementById('pvSummaryClose');
        var summaryModal = document.getElementById('pvSummaryModal');

        if (verifyForm) verifyForm.addEventListener('submit', submitVerify);
        if (verifyClose) verifyClose.addEventListener('click', closeVerifyModal);
        if (verifyCancel) verifyCancel.addEventListener('click', closeVerifyModal);
        if (verifyModal) {
            verifyModal.addEventListener('click', function (e) {
                if (e.target === this) closeVerifyModal();
            });
        }
        if (summaryClose) summaryClose.addEventListener('click', closeSummaryModal);
        if (summaryModal) {
            summaryModal.addEventListener('click', function (e) {
                if (e.target === this) closeSummaryModal();
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeVerifyModal();
                closeSummaryModal();
            }
        });

        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch (e) { } }
        loadCases();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();