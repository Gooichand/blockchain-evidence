/**
 * Evidence Manager Display Module
 * Displays evidence inventory and cases for evidence managers
 */

class ManagerEvidenceDisplay {
    constructor() {
        this.evidence = [];
        this.cases = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.render();
    }

    async loadData() {
        try {
            [this.evidence, this.cases] = await Promise.all([
                window.storage.getAllEvidence(),
                window.storage.getAllCases()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    render() {
        this.renderEvidence();
        this.renderCases();
    }

    renderEvidence() {
        const container = document.getElementById('managerEvidenceList');
        if (!container) return;

        if (!this.evidence || this.evidence.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p style="font-size: 1.2rem;">📦 No evidence in inventory</p>
                    <p style="margin-top: 8px;">Evidence will appear here once uploaded</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 12px; text-align: left;">ID</th>
                        <th style="padding: 12px; text-align: left;">Title</th>
                        <th style="padding: 12px; text-align: left;">Case ID</th>
                        <th style="padding: 12px; text-align: left;">Type</th>
                        <th style="padding: 12px; text-align: left;">Date</th>
                        <th style="padding: 12px; text-align: left;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.evidence.map(item => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">${item.id || 'N/A'}</td>
                            <td style="padding: 12px;">${this.escapeHtml(item.title || item.file_name || 'Untitled')}</td>
                            <td style="padding: 12px;">${item.case_id || 'N/A'}</td>
                            <td style="padding: 12px;">${item.type || 'Unknown'}</td>
                            <td style="padding: 12px;">${this.formatDate(item.timestamp || item.created_at)}</td>
                            <td style="padding: 12px;">
                                <a href="evidence-verification.html?id=${item.id}" 
                                   style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 0.875rem;">
                                    View
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderCases() {
        const container = document.getElementById('managerCaseList');
        if (!container) return;

        if (!this.cases || this.cases.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p style="font-size: 1.2rem;">📋 No cases available</p>
                    <p style="margin-top: 8px;">Cases will appear here once created</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 12px; text-align: left;">Case ID</th>
                        <th style="padding: 12px; text-align: left;">Title</th>
                        <th style="padding: 12px; text-align: left;">Status</th>
                        <th style="padding: 12px; text-align: left;">Created</th>
                        <th style="padding: 12px; text-align: left;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.cases.map(caseItem => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">${caseItem.case_id || caseItem.id || 'N/A'}</td>
                            <td style="padding: 12px;">${this.escapeHtml(caseItem.title || caseItem.case_title || 'Untitled')}</td>
                            <td style="padding: 12px;">
                                <span style="background: ${this.getStatusColor(caseItem.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">
                                    ${caseItem.status || 'Unknown'}
                                </span>
                            </td>
                            <td style="padding: 12px;">${this.formatDate(caseItem.created_at)}</td>
                            <td style="padding: 12px;">
                                <a href="case-timeline.html?id=${caseItem.case_id || caseItem.id}" 
                                   style="background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 0.875rem;">
                                    View Evidence
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    }

    getStatusColor(status) {
        const colors = {
            'open': '#3b82f6',
            'active': '#10b981',
            'pending': '#f59e0b',
            'closed': '#6b7280',
            'archived': '#9ca3af'
        };
        return colors[status?.toLowerCase()] || '#6b7280';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize when DOM is ready
let managerEvidence;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        managerEvidence = new ManagerEvidenceDisplay();
    });
} else {
    managerEvidence = new ManagerEvidenceDisplay();
}
