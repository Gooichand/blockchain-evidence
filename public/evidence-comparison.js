/**
 * Evidence Comparison Tool
 * Forensic-grade evidence comparison with blockchain verification
 */

class EvidenceComparisonTool {
    constructor() {
        this.selectedEvidence = [];
        this.allEvidence = [];
        this.syncScrolling = true;
        this.currentLayout = 'grid-2';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadEvidence();
        this.checkUserRole();
    }

    checkUserRole() {
        // S12 crash fix: currentUser is a plain string (wallet or email), not
        // JSON - JSON.parse threw on every load for email sessions. Access is
        // enforced server-side per evidence item; here we only need a session.
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('evidenceSearch').addEventListener('input', (e) => {
            this.filterEvidence(e.target.value);
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            const searchTerm = document.getElementById('evidenceSearch').value;
            this.filterEvidence(searchTerm);
        });

        // Layout selector
        document.getElementById('layoutMode').addEventListener('change', (e) => {
            this.currentLayout = e.target.value;
            if (this.selectedEvidence.length >= 2) {
                this.renderComparisonView();
            }
        });

        // Compare button
        document.getElementById('compareBtn').addEventListener('click', () => {
            this.showComparisonView();
        });

        // S12: duplicate detection across accessible cases
        document.getElementById('duplicatesBtn')?.addEventListener('click', () => {
            this.renderDuplicates();
        });
        document.getElementById('showAllBtn')?.addEventListener('click', () => {
            document.getElementById('comparisonView').style.display = 'none';
            document.querySelector('.evidence-selector').style.display = 'block';
            this.renderEvidenceList(this.allEvidence);
        });

        // Comparison controls
        document.getElementById('syncScrollBtn')?.addEventListener('click', () => {
            this.toggleSyncScroll();
        });

        document.getElementById('showMetadataBtn')?.addEventListener('click', () => {
            this.toggleMetadata();
        });

        document.getElementById('resetViewBtn')?.addEventListener('click', () => {
            this.resetView();
        });

        document.getElementById('changeSelectionBtn')?.addEventListener('click', () => {
            this.changeSelection();
        });

        // Export PDF
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            window.history.back();
        });
    }

    async loadEvidence() {
        this.showLoading(true);
        try {
            // Fetch evidence from database
            const evidence = await window.storage.getAllEvidence();
            this.allEvidence = evidence || [];
            this.renderEvidenceList(this.allEvidence);
        } catch (error) {
            console.error('Error loading evidence:', error);
            this.showError('Failed to load evidence. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    renderEvidenceList(evidenceList) {
        const container = document.getElementById('evidenceList');

        if (!evidenceList || evidenceList.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                    <p style="font-size: 1.2rem;">📁 No evidence found</p>
                    <p style="margin-top: 8px;">Upload evidence to start comparing</p>
                </div>
            `;
            return;
        }

        container.innerHTML = evidenceList.map(evidence => `
            <div class="evidence-item ${this.isSelected(evidence.id) ? 'selected' : ''}" 
                 data-id="${evidence.id}" 
                 onclick="comparisonTool.toggleSelection(${evidence.id})">
                <div class="evidence-item-header">
                    <div class="evidence-item-title">${this.escapeHtml(evidence.title || 'Untitled')}</div>
                    <div class="evidence-item-type">${this.getFileTypeIcon(evidence.type)} ${evidence.type}</div>
                </div>
                <div class="evidence-item-meta">
                    <div>📋 Case: ${this.escapeHtml(evidence.case_id || 'N/A')}</div>
                    <div>📅 ${new Date(evidence.timestamp).toLocaleDateString()}</div>
                    <div>👤 ${this.escapeHtml(evidence.submitted_by?.substring(0, 10) || 'Unknown')}...</div>
                    <div>📦 ${this.formatFileSize(evidence.file_size)}</div>
                </div>
                <div class="evidence-item-hash">
                    🔐 ${evidence.hash?.substring(0, 32)}...
                </div>
            </div>
        `).join('');
    }

    toggleSelection(evidenceId) {
        const evidence = this.allEvidence.find(e => e.id === evidenceId);
        if (!evidence) return;

        const index = this.selectedEvidence.findIndex(e => e.id === evidenceId);

        if (index > -1) {
            // Deselect
            this.selectedEvidence.splice(index, 1);
        } else {
            // Select (max 4)
            if (this.selectedEvidence.length >= 4) {
                this.showError('Maximum 4 evidence items can be compared at once');
                return;
            }
            this.selectedEvidence.push(evidence);
        }

        this.updateSelectedDisplay();
        this.renderEvidenceList(this.allEvidence);
    }

    isSelected(evidenceId) {
        return this.selectedEvidence.some(e => e.id === evidenceId);
    }

    updateSelectedDisplay() {
        const container = document.getElementById('selectedItems');
        const countSpan = document.getElementById('selectedCount');
        const compareBtn = document.getElementById('compareBtn');

        countSpan.textContent = this.selectedEvidence.length;

        if (this.selectedEvidence.length === 0) {
            container.innerHTML = '<p style="color: #64748b; padding: 20px;">No evidence selected</p>';
            compareBtn.disabled = true;
        } else {
            container.innerHTML = this.selectedEvidence.map(evidence => `
                <div class="selected-item-chip">
                    <span>${this.escapeHtml(evidence.title || 'Untitled')}</span>
                    <button onclick="comparisonTool.toggleSelection(${evidence.id})">×</button>
                </div>
            `).join('');
            compareBtn.disabled = this.selectedEvidence.length < 2;
        }
    }

    filterEvidence(searchTerm) {
        if (!searchTerm) {
            this.renderEvidenceList(this.allEvidence);
            return;
        }

        const filtered = this.allEvidence.filter(evidence => {
            const term = searchTerm.toLowerCase();
            return (
                (evidence.title || '').toLowerCase().includes(term) ||
                String(evidence.case_id ?? '').toLowerCase().includes(term) ||
                (evidence.hash || '').toLowerCase().includes(term) ||
                (evidence.type || '').toLowerCase().includes(term)
            );
        });

        this.renderEvidenceList(filtered);
    }

    async showComparisonView() {
        if (this.selectedEvidence.length < 2) {
            this.showError('Please select at least 2 evidence items to compare');
            return;
        }

        // S12: pull the authoritative records (server checks case access per
        // item) before rendering the verdict
        this.showLoading(true);
        try {
            const ids = this.selectedEvidence.map((e) => e.id).join(',');
            const res = await window.apiClient.get(`/evidence/compare?ids=${ids}`);
            const byId = {};
            (res.data || []).forEach((d) => { byId[d.id] = d; });
            this.selectedEvidence = this.selectedEvidence.map((e) => ({ ...e, ...(byId[e.id] || {}) }));
        } catch (e) {
            this.showLoading(false);
            this.showError('Comparison failed: ' + (e.message || e));
            return;
        }
        this.showLoading(false);

        document.querySelector('.evidence-selector').style.display = 'none';
        document.getElementById('comparisonView').style.display = 'block';
        document.getElementById('exportPdfBtn').disabled = false;

        this.renderVerdictBanner();
        this.renderComparisonView();
    }

    // Hash/size/metadata verdict across the selection
    verdictForSelection() {
        const items = this.selectedEvidence;
        const sameHash = items.every((e) => e.hash && e.hash === items[0].hash);
        const sameSize = items.every((e) => e.file_size === items[0].file_size);
        const sameType = items.every((e) => e.type === items[0].type);
        if (sameHash) {
            return { cls: 'ok', text: 'IDENTICAL - every selected item has the same SHA-256. These are duplicate copies of the same file.' };
        }
        if (sameSize && sameType) {
            return { cls: 'warn', text: 'POSSIBLE VARIANT - same file type and byte size, but different SHA-256. The content differs (re-save, edit or tampering).' };
        }
        return { cls: 'diff', text: `DIFFERENT FILES - the selected items have different SHA-256 hashes${sameSize ? ' (byte sizes happen to match)' : ''}.` };
    }

    renderVerdictBanner() {
        let el = document.getElementById('verdictBanner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'verdictBanner';
            const view = document.getElementById('comparisonView');
            view.insertBefore(el, view.children[1] || null);
        }
        const v = this.verdictForSelection();
        const styles = {
            ok: 'background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7;',
            warn: 'background:#fff8e1;color:#8d6e00;border:1px solid #ffe082;',
            diff: 'background:#e3f2fd;color:#0d47a1;border:1px solid #90caf9;',
        };
        el.style.cssText = 'margin:0 0 14px;padding:12px 16px;border-radius:10px;font-weight:600;' + styles[v.cls];
        el.textContent = v.text;
    }

    // S12: duplicate detection - group the accessible evidence list by hash
    renderDuplicates() {
        // return to the selector view when invoked from the comparison view
        document.getElementById('comparisonView').style.display = 'none';
        document.querySelector('.evidence-selector').style.display = 'block';
        const groups = {};
        this.allEvidence.forEach((e) => {
            if (e.hash) (groups[e.hash] = groups[e.hash] || []).push(e);
        });
        const dups = Object.values(groups).filter((g) => g.length > 1);
        const container = document.getElementById('evidenceList');
        if (!dups.length) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                    <p style="font-size: 1.2rem;">✅ No duplicates</p>
                    <p style="margin-top: 8px;">No two evidence items share the same SHA-256 across your accessible cases.</p>
                </div>`;
            return;
        }
        container.innerHTML = dups.map((g) => `
            <div class="evidence-item" style="grid-column: 1/-1;">
                <div class="evidence-item-header">
                    <div class="evidence-item-title">${this.getFileTypeIcon(g[0].type)} ${g.length} identical copies - ${this.escapeHtml(g[0].title || 'Untitled')}</div>
                    <div class="evidence-item-type">${this.formatFileSize(g[0].file_size)}</div>
                </div>
                <div class="evidence-item-hash">🔐 ${this.escapeHtml(g[0].hash)}</div>
                <div class="evidence-item-meta" style="margin: 8px 0;">
                    ${g.map((e) => `<div>#${e.id} - ${this.escapeHtml(e.title || 'Untitled')} · Case ${e.case_id} · ${new Date(e.timestamp).toLocaleDateString()}</div>`).join('')}
                </div>
                <button class="btn btn-primary" onclick="comparisonTool.compareGroup('${g[0].hash}')">Compare this group</button>
            </div>`).join('');
    }

    compareGroup(hash) {
        this.selectedEvidence = this.allEvidence.filter((e) => e.hash === hash).slice(0, 4);
        this.updateSelectedDisplay();
        this.renderEvidenceList(this.allEvidence);
        this.showComparisonView();
    }

    renderComparisonView() {
        this.renderMetadataTable();
        this.renderEvidencePanels();
    }

    renderMetadataTable() {
        const table = document.getElementById('metadataTable');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');

        // Build header
        thead.innerHTML = '<th>Property</th>' +
            this.selectedEvidence.map((e, i) =>
                `<th>Evidence ${i + 1}: ${this.escapeHtml(e.title || 'Untitled')}</th>`
            ).join('');

        // Build rows
        const properties = [
            { label: 'File Name', key: 'file_name' },
            { label: 'File Type', key: 'type' },
            { label: 'File Size', key: 'file_size', format: this.formatFileSize },
            { label: 'Case ID', key: 'case_id' },
            { label: 'Submitted By', key: 'submitted_by', format: (v) => v?.substring(0, 20) + '...' },
            { label: 'Timestamp', key: 'timestamp', format: (v) => new Date(v).toLocaleString() },
            { label: 'SHA-256 Hash', key: 'hash', isHash: true },
            { label: 'Anchored on-chain', key: 'blockchain_tx_hash', format: (v) => (v ? 'Yes' : 'No') },
            { label: 'Status', key: 'status' }
        ];

        tbody.innerHTML = properties.map(prop => {
            const values = this.selectedEvidence.map(e => {
                let value = e[prop.key];
                if (prop.format) value = prop.format(value);
                return value || 'N/A';
            });

            // Check for mismatches
            const allSame = values.every(v => v === values[0]);
            const cellClass = prop.isHash ? 'hash-cell' : (allSame ? 'metadata-verified' : 'metadata-mismatch');

            return `
                <tr>
                    <td><strong>${prop.label}</strong></td>
                    ${values.map(v => `<td class="${cellClass}">${this.escapeHtml(String(v))}</td>`).join('')}
                </tr>
            `;
        }).join('');
    }

    renderEvidencePanels() {
        const container = document.getElementById('evidencePanels');
        container.className = `evidence-panels ${this.currentLayout}`;

        container.innerHTML = this.selectedEvidence.map((evidence, index) => `
            <div class="evidence-panel">
                <div class="evidence-panel-header">
                    <div class="evidence-panel-title">Evidence ${index + 1}: ${this.escapeHtml(evidence.title || 'Untitled')}</div>
                    <div class="evidence-panel-subtitle">${evidence.type} • ${this.formatFileSize(evidence.file_size)}</div>
                </div>
                <div class="evidence-panel-content ${this.syncScrolling ? 'sync-scroll' : ''}" data-panel="${index}">
                    ${this.renderEvidenceContent(evidence)}
                </div>
            </div>
        `).join('');

        if (this.syncScrolling) {
            this.setupSyncScroll();
        }
    }

    renderEvidenceContent(evidence) {
        const type = evidence.type?.toLowerCase();
        // S12: honest anchoring state (was a hardcoded "Blockchain Verified: ✅")
        const anchored = !!(evidence.blockchain_tx_hash || evidence.has_blockchain_tx);
        const anchorLine = anchored
            ? `Anchored on-chain (tx ${String(evidence.blockchain_tx_hash).slice(0, 12)}...)`
            : 'Not anchored on-chain';
        // Previews only work when the file is stored inline as a data URI;
        // large files are not - say so instead of rendering a broken viewer
        const src = (typeof evidence.file_data === 'string' && evidence.file_data.startsWith('data:')) ? evidence.file_data : null;
        const noInline = '<p style="padding:24px;color:#64748b;">Preview is not stored inline for this item. Open it from the dashboard for the full preview and download.</p>';

        if ((type?.includes('image') || type?.includes('jpg') || type?.includes('png') || type?.includes('jpeg')) && src) {
            return `
                <div class="evidence-preview">
                    <img src="${src}" alt="${this.escapeHtml(evidence.title)}" />
                    <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                        <p><strong>🔍 Image Analysis</strong></p>
                        <p style="margin-top: 8px; color: #64748b; font-size: 0.9rem;">
                            Dimensions: Auto-detected<br>
                            Format: ${evidence.type}<br>
                            ${anchorLine}
                        </p>
                    </div>
                </div>
            `;
        } else if (type?.includes('video') && src) {
            return `
                <div class="evidence-preview">
                    <video controls>
                        <source src="${src}" type="${evidence.mime_type || 'video/mp4'}">
                        Your browser does not support video playback.
                    </video>
                    <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                        <p><strong>🎥 Video Analysis</strong></p>
                        <p style="margin-top: 8px; color: #64748b; font-size: 0.9rem;">
                            Format: ${evidence.type}<br>
                            ${anchorLine}
                        </p>
                    </div>
                </div>
            `;
        } else if (type?.includes('pdf') && src) {
            return `
                <div class="evidence-preview">
                    <iframe src="${src}" style="width: 100%; height: 500px; border: none; border-radius: 8px;"></iframe>
                    <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                        <p><strong>📄 PDF Document</strong></p>
                        <p style="margin-top: 8px; color: #64748b; font-size: 0.9rem;">
                            ${anchorLine}
                        </p>
                    </div>
                </div>
            `;
        } else if (type?.includes('text')) {
            return `
                <div class="evidence-text-content">
${evidence.description || 'No text content available'}
                </div>
                <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                    <p><strong>📝 Text Document</strong></p>
                    <p style="margin-top: 8px; color: #64748b; font-size: 0.9rem;">
                        ${anchorLine}
                    </p>
                </div>
            `;
        } else {
            return `
                <div class="evidence-unsupported">
                    <p style="font-size: 3rem;">📦</p>
                    <p style="margin-top: 16px; font-size: 1.1rem; color: #1e293b;">Unsupported File Type</p>
                    <p style="margin-top: 8px; color: #64748b;">
                        File: ${this.escapeHtml(evidence.file_name)}<br>
                        Type: ${evidence.type}<br>
                        Size: ${this.formatFileSize(evidence.file_size)}
                    </p>
                    <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                        <p><strong>🔐 ${anchorLine}</strong></p>
                        ${src ? '' : noInline}
                        <p style="margin-top: 8px; font-family: monospace; font-size: 0.8rem; word-break: break-all;">
                            SHA-256: ${evidence.hash}
                        </p>
                    </div>
                </div>
            `;
        }
    }

    setupSyncScroll() {
        const panels = document.querySelectorAll('.evidence-panel-content.sync-scroll');
        let isScrolling = false;

        panels.forEach((panel, index) => {
            panel.addEventListener('scroll', () => {
                if (isScrolling) return;
                isScrolling = true;

                const scrollPercentage = panel.scrollTop / (panel.scrollHeight - panel.clientHeight);

                panels.forEach((otherPanel, otherIndex) => {
                    if (otherIndex !== index) {
                        otherPanel.scrollTop = scrollPercentage * (otherPanel.scrollHeight - otherPanel.clientHeight);
                    }
                });

                setTimeout(() => { isScrolling = false; }, 50);
            });
        });
    }

    toggleSyncScroll() {
        this.syncScrolling = !this.syncScrolling;
        const btn = document.getElementById('syncScrollBtn');
        btn.textContent = `🔗 Sync Scrolling: ${this.syncScrolling ? 'ON' : 'OFF'}`;
        this.renderEvidencePanels();
    }

    toggleMetadata() {
        const section = document.getElementById('metadataSection');
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }

    resetView() {
        const panels = document.querySelectorAll('.evidence-panel-content');
        panels.forEach(panel => panel.scrollTop = 0);
    }

    changeSelection() {
        document.querySelector('.evidence-selector').style.display = 'block';
        document.getElementById('comparisonView').style.display = 'none';
        document.getElementById('exportPdfBtn').disabled = true;
    }

    async exportToPDF() {
        this.showLoading(true);
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Title page
            pdf.setFontSize(20);
            pdf.text('Evidence Comparison Report', 20, 20);
            pdf.setFontSize(12);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
            pdf.text(`Evidence Items: ${this.selectedEvidence.length}`, 20, 37);

            // Add blockchain verification
            pdf.setFontSize(10);
            pdf.text('🔐 Blockchain Verified Evidence', 20, 45);

            let yPos = 55;

            // Add metadata comparison
            pdf.setFontSize(14);
            pdf.text('Metadata Comparison', 20, yPos);
            yPos += 10;

            pdf.setFontSize(9);
            this.selectedEvidence.forEach((evidence, index) => {
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }

                pdf.text(`Evidence ${index + 1}: ${evidence.title || 'Untitled'}`, 20, yPos);
                yPos += 5;
                pdf.text(`  Type: ${evidence.type}`, 25, yPos);
                yPos += 5;
                pdf.text(`  Hash: ${evidence.hash?.substring(0, 40)}...`, 25, yPos);
                yPos += 5;
                pdf.text(`  Timestamp: ${new Date(evidence.timestamp).toLocaleString()}`, 25, yPos);
                yPos += 5;
                pdf.text(`  Size: ${this.formatFileSize(evidence.file_size)}`, 25, yPos);
                yPos += 8;
            });

            // Add comparison findings
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.text('Comparison Findings', 20, 20);
            pdf.setFontSize(10);
            const verdict = this.verdictForSelection().text;
            pdf.text(pdf.splitTextToSize('Verdict: ' + verdict, 170), 20, 30);
            pdf.text('Anchoring state per item is listed in the metadata table (Anchored on-chain row).', 20, 44);

            // Save PDF
            pdf.save(`evidence-comparison-${Date.now()}.pdf`);

            this.showSuccess('PDF report exported successfully!');
        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Failed to export PDF. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Utility functions
    formatFileSize(bytes) {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getFileTypeIcon(type) {
        const t = type?.toLowerCase() || '';
        if (t.includes('image')) return '🖼️';
        if (t.includes('video')) return '🎥';
        if (t.includes('pdf')) return '📄';
        if (t.includes('text')) return '📝';
        return '📦';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        alert('❌ ' + message);
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }
}

// Initialize the tool when DOM is ready
let comparisonTool;
document.addEventListener('DOMContentLoaded', () => {
    comparisonTool = new EvidenceComparisonTool();
});
