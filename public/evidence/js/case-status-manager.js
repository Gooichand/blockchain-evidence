// Case Status Management Frontend System
class CaseStatusManager {
    constructor() {
        this.currentUser = null;
        this.caseStatuses = [];
        this.currentFilters = {};
        this.init();
    }

    async init() {
        await this.loadCaseStatuses();
        this.bindEvents();
        this.initializeFilters();
    }

    async loadCaseStatuses() {
        try {
            const response = await fetch('/api/case-statuses');
            const data = await response.json();
            if (data.success) {
                this.caseStatuses = data.statuses;
            }
        } catch (error) {
            console.error('Failed to load case statuses:', error);
        }
    }

    bindEvents() {
        // Status change buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-change-btn')) {
                this.handleStatusChange(e.target);
            }
            if (e.target.classList.contains('case-assign-btn')) {
                this.showAssignmentModal(e.target.dataset.caseId);
            }
            if (e.target.classList.contains('case-details-btn')) {
                this.showCaseDetails(e.target.dataset.caseId);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('case-filter')) {
                this.applyFilters();
            }
        });

        // Search input
        const searchInput = document.getElementById('caseSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            });
        }
    }

    initializeFilters() {
        this.renderStatusFilter();
        this.renderPriorityFilter();
        this.renderAssignmentFilter();
    }

    renderStatusFilter() {
        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) return;

        statusFilter.innerHTML = `
            <option value="">All Statuses</option>
            ${this.caseStatuses.map(status => `
                <option value="${status.status_code}">${status.status_name}</option>
            `).join('')}
        `;
    }

    renderPriorityFilter() {
        const priorityFilter = document.getElementById('priorityFilter');
        if (!priorityFilter) return;

        priorityFilter.innerHTML = `
            <option value="">All Priorities</option>
            <option value="1">Critical (1)</option>
            <option value="2">High (2)</option>
            <option value="3">Medium (3)</option>
            <option value="4">Low (4)</option>
            <option value="5">Minimal (5)</option>
        `;
    }

    renderAssignmentFilter() {
        const assignmentFilter = document.getElementById('assignmentFilter');
        if (!assignmentFilter) return;

        const currentUser = this.getCurrentUser();
        if (currentUser) {
            assignmentFilter.innerHTML = `
                <option value="">All Cases</option>
                <option value="${currentUser.wallet_address}">My Cases</option>
                <option value="unassigned">Unassigned</option>
            `;
        }
    }

    async applyFilters() {
        const filters = {
            status: document.getElementById('statusFilter')?.value || '',
            priority: document.getElementById('priorityFilter')?.value || '',
            assignedTo: document.getElementById('assignmentFilter')?.value || '',
            search: document.getElementById('caseSearch')?.value || '',
            dateFrom: document.getElementById('dateFromFilter')?.value || '',
            dateTo: document.getElementById('dateToFilter')?.value || ''
        };

        this.currentFilters = filters;
        await this.loadCases(filters);
    }

    async loadCases(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/cases/enhanced?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderCaseList(data.cases);
                this.renderPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to load cases:', error);
            this.showError('Failed to load cases');
        }
    }

    renderCaseList(cases) {
        const container = document.getElementById('caseListContainer');
        if (!container) return;

        if (cases.length === 0) {
            container.innerHTML = `
                <div class="no-cases-message">
                    <i data-lucide="folder-x" class="no-cases-icon"></i>
                    <h3>No Cases Found</h3>
                    <p>No cases match your current filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = cases.map(case_item => this.renderCaseCard(case_item)).join('');
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderCaseCard(case_item) {
        const status = case_item.case_statuses;
        const priorityColors = {
            1: '#DC2626', 2: '#EF4444', 3: '#F59E0B', 4: '#10B981', 5: '#6B7280'
        };
        const priorityLabels = {
            1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Minimal'
        };

        return `
            <div class="case-card" data-case-id="${case_item.id}">
                <div class="case-card-header">
                    <div class="case-title-section">
                        <h3 class="case-title">${case_item.title}</h3>
                        <span class="case-number">${case_item.case_number || 'N/A'}</span>
                    </div>
                    <div class="case-badges">
                        <span class="status-badge" style="background-color: ${status.color_code}20; color: ${status.color_code}; border: 1px solid ${status.color_code}40;">
                            <i data-lucide="${status.icon}" class="badge-icon"></i>
                            ${status.status_name}
                        </span>
                        <span class="priority-badge" style="background-color: ${priorityColors[case_item.priority_level || 3]}20; color: ${priorityColors[case_item.priority_level || 3]};">
                            Priority: ${priorityLabels[case_item.priority_level || 3]}
                        </span>
                    </div>
                </div>
                
                <div class="case-card-body">
                    <p class="case-description">${case_item.description || 'No description available'}</p>
                    
                    <div class="case-metadata">
                        <div class="metadata-item">
                            <i data-lucide="calendar" class="metadata-icon"></i>
                            <span>Created: ${new Date(case_item.created_date).toLocaleDateString()}</span>
                        </div>
                        <div class="metadata-item">
                            <i data-lucide="user" class="metadata-icon"></i>
                            <span>Created by: ${case_item.created_by.substring(0, 8)}...</span>
                        </div>
                        ${case_item.assigned_investigator ? `
                            <div class="metadata-item">
                                <i data-lucide="search" class="metadata-icon"></i>
                                <span>Investigator: ${case_item.assigned_investigator.substring(0, 8)}...</span>
                            </div>
                        ` : ''}
                        ${case_item.court_date ? `
                            <div class="metadata-item">
                                <i data-lucide="gavel" class="metadata-icon"></i>
                                <span>Court Date: ${new Date(case_item.court_date).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="case-card-actions">
                    <button class="btn btn-outline case-details-btn" data-case-id="${case_item.id}">
                        <i data-lucide="eye"></i>
                        View Details
                    </button>
                    <button class="btn btn-outline case-assign-btn" data-case-id="${case_item.id}">
                        <i data-lucide="user-plus"></i>
                        Assign
                    </button>
                    <div class="status-actions">
                        <button class="btn btn-primary status-change-btn" data-case-id="${case_item.id}">
                            <i data-lucide="arrow-right"></i>
                            Change Status
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async handleStatusChange(button) {
        const caseId = button.dataset.caseId;
        const currentUser = this.getCurrentUser();
        
        if (!currentUser) {
            this.showError('Please log in to change case status');
            return;
        }

        try {
            // Get available transitions
            const response = await fetch(`/api/cases/${caseId}/available-transitions?userWallet=${currentUser.wallet_address}`);
            const data = await response.json();
            
            if (data.success && data.transitions.length > 0) {
                this.showStatusChangeModal(caseId, data.transitions);
            } else {
                this.showError('No status transitions available for your role');
            }
        } catch (error) {
            console.error('Failed to get available transitions:', error);
            this.showError('Failed to load status options');
        }
    }

    showStatusChangeModal(caseId, transitions) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Change Case Status</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="statusChangeForm">
                        <div class="form-group">
                            <label>New Status:</label>
                            <select id="newStatus" class="form-control" required>
                                <option value="">Select new status</option>
                                ${transitions.map(t => `
                                    <option value="${t.to_status.status_code}">
                                        ${t.to_status.status_name} - ${t.transition_name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Reason (Optional):</label>
                            <textarea id="statusReason" class="form-control" rows="3" 
                                placeholder="Enter reason for status change..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="check"></i>
                                Update Status
                            </button>
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Handle form submission
        const form = modal.querySelector('#statusChangeForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateCaseStatus(caseId, modal);
        });
    }

    async updateCaseStatus(caseId, modal) {
        const currentUser = this.getCurrentUser();
        const newStatus = modal.querySelector('#newStatus').value;
        const reason = modal.querySelector('#statusReason').value;

        if (!newStatus) {
            this.showError('Please select a new status');
            return;
        }

        try {
            const response = await fetch(`/api/cases/${caseId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newStatusCode: newStatus,
                    userWallet: currentUser.wallet_address,
                    reason: reason
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Case status updated successfully');
                modal.remove();
                await this.applyFilters(); // Refresh the case list
            } else {
                this.showError(data.error || 'Failed to update case status');
            }
        } catch (error) {
            console.error('Failed to update case status:', error);
            this.showError('Failed to update case status');
        }
    }

    showAssignmentModal(caseId) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Assign Case</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="assignmentForm">
                        <div class="form-group">
                            <label>Role Type:</label>
                            <select id="roleType" class="form-control" required>
                                <option value="">Select role</option>
                                <option value="investigator">Investigator</option>
                                <option value="forensic_analyst">Forensic Analyst</option>
                                <option value="legal_professional">Legal Professional</option>
                                <option value="court_official">Court Official</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Assign To (Wallet Address):</label>
                            <input type="text" id="assignToWallet" class="form-control" 
                                placeholder="0x..." required>
                        </div>
                        <div class="form-group">
                            <label>Assignment Type:</label>
                            <select id="assignmentType" class="form-control">
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                                <option value="observer">Observer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Notes (Optional):</label>
                            <textarea id="assignmentNotes" class="form-control" rows="3"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="user-plus"></i>
                                Assign Case
                            </button>
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const form = modal.querySelector('#assignmentForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.assignCase(caseId, modal);
        });
    }

    async assignCase(caseId, modal) {
        const currentUser = this.getCurrentUser();
        const formData = new FormData(modal.querySelector('#assignmentForm'));
        
        const assignmentData = {
            assignToWallet: modal.querySelector('#assignToWallet').value,
            roleType: modal.querySelector('#roleType').value,
            assignmentType: modal.querySelector('#assignmentType').value,
            assignedByWallet: currentUser.wallet_address,
            notes: modal.querySelector('#assignmentNotes').value
        };

        try {
            const response = await fetch(`/api/cases/${caseId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(assignmentData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Case assigned successfully');
                modal.remove();
                await this.applyFilters();
            } else {
                this.showError(data.error || 'Failed to assign case');
            }
        } catch (error) {
            console.error('Failed to assign case:', error);
            this.showError('Failed to assign case');
        }
    }

    async showCaseDetails(caseId) {
        try {
            const response = await fetch(`/api/cases/${caseId}/details`);
            const data = await response.json();
            
            if (data.success) {
                this.renderCaseDetailsModal(data.case);
            } else {
                this.showError('Failed to load case details');
            }
        } catch (error) {
            console.error('Failed to load case details:', error);
            this.showError('Failed to load case details');
        }
    }

    renderCaseDetailsModal(caseData) {
        const modal = document.createElement('div');
        modal.className = 'modal active case-details-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Case Details: ${caseData.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="case-details-grid">
                        <div class="case-info-section">
                            <h4>Case Information</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Case Number:</label>
                                    <span>${caseData.case_number || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Status:</label>
                                    <span class="status-badge" style="background-color: ${caseData.case_statuses.color_code}20; color: ${caseData.case_statuses.color_code};">
                                        ${caseData.case_statuses.status_name}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <label>Priority:</label>
                                    <span>Level ${caseData.priority_level || 3}</span>
                                </div>
                                <div class="info-item">
                                    <label>Type:</label>
                                    <span>${caseData.case_type || 'Criminal'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Jurisdiction:</label>
                                    <span>${caseData.jurisdiction || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Evidence Count:</label>
                                    <span>${caseData.evidence_count || 0}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="assignments-section">
                            <h4>Assignments</h4>
                            ${caseData.assignments.length > 0 ? `
                                <div class="assignments-list">
                                    ${caseData.assignments.map(assignment => `
                                        <div class="assignment-item">
                                            <span class="assignment-role">${assignment.role_type}</span>
                                            <span class="assignment-wallet">${assignment.assigned_to.substring(0, 8)}...</span>
                                            <span class="assignment-type">${assignment.assignment_type}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>No assignments</p>'}
                        </div>
                        
                        <div class="status-history-section">
                            <h4>Status History</h4>
                            ${caseData.status_history.length > 0 ? `
                                <div class="status-history-list">
                                    ${caseData.status_history.map(history => `
                                        <div class="history-item">
                                            <div class="history-change">
                                                ${history.from_status ? `
                                                    <span class="from-status">${history.from_status.status_name}</span>
                                                    <i data-lucide="arrow-right"></i>
                                                ` : ''}
                                                <span class="to-status">${history.to_status.status_name}</span>
                                            </div>
                                            <div class="history-meta">
                                                <span class="history-date">${new Date(history.created_at).toLocaleString()}</span>
                                                <span class="history-user">${history.changed_by.substring(0, 8)}...</span>
                                            </div>
                                            ${history.change_reason ? `
                                                <div class="history-reason">${history.change_reason}</div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>No status changes recorded</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderPagination(pagination) {
        const container = document.getElementById('paginationContainer');
        if (!container || !pagination) return;

        const { page, pages, total } = pagination;
        
        container.innerHTML = `
            <div class="pagination-info">
                Showing page ${page} of ${pages} (${total} total cases)
            </div>
            <div class="pagination-controls">
                <button class="btn btn-outline" ${page <= 1 ? 'disabled' : ''} 
                    onclick="caseStatusManager.loadPage(${page - 1})">
                    <i data-lucide="chevron-left"></i>
                    Previous
                </button>
                <span class="page-numbers">
                    ${this.generatePageNumbers(page, pages)}
                </span>
                <button class="btn btn-outline" ${page >= pages ? 'disabled' : ''} 
                    onclick="caseStatusManager.loadPage(${page + 1})">
                    Next
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    generatePageNumbers(currentPage, totalPages) {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(`
                <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="caseStatusManager.loadPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        return pages.join('');
    }

    async loadPage(page) {
        this.currentFilters.page = page;
        await this.loadCases(this.currentFilters);
    }

    getCurrentUser() {
        // Get current user from your existing authentication system
        const currentUserKey = localStorage.getItem('currentUser');
        if (currentUserKey) {
            return JSON.parse(localStorage.getItem(`evidUser_${currentUserKey}`));
        }
        return null;
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type) {
        // Use your existing alert system or create a simple one
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize the case status manager
let caseStatusManager;
document.addEventListener('DOMContentLoaded', () => {
    caseStatusManager = new CaseStatusManager();
});