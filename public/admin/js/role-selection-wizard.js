// Interactive Role Selection Wizard
class RoleSelectionWizard {
    constructor() {
        this.selectedRole = null;
        this.userWallet = null;
        this.roles = [
            {
                id: 'public_viewer',
                name: 'Public Viewer',
                icon: 'eye',
                description: 'View public cases and evidence',
                permissions: ['View public cases', 'Browse evidence summaries', 'Access public reports'],
                dashboard: 'dashboard-public.html'
            },
            {
                id: 'investigator',
                name: 'Investigator',
                icon: 'search',
                description: 'Manage investigations and collect evidence',
                permissions: ['Create cases', 'Upload evidence', 'Manage investigations', 'Generate reports'],
                dashboard: 'dashboard-investigator.html'
            },
            {
                id: 'forensic_analyst',
                name: 'Forensic Analyst',
                icon: 'microscope',
                description: 'Analyze digital evidence and create technical reports',
                permissions: ['Analyze evidence', 'Create technical reports', 'Verify file integrity', 'Digital forensics'],
                dashboard: 'dashboard-analyst.html'
            },
            {
                id: 'legal_professional',
                name: 'Legal Professional',
                icon: 'scale',
                description: 'Review cases for legal compliance and court preparation',
                permissions: ['Legal case review', 'Court preparation', 'Evidence validation', 'Legal documentation'],
                dashboard: 'dashboard-legal.html'
            },
            {
                id: 'court_official',
                name: 'Court Official',
                icon: 'gavel',
                description: 'Manage court proceedings and judicial decisions',
                permissions: ['Court case management', 'Judicial review', 'Case scheduling', 'Final decisions'],
                dashboard: 'dashboard-court.html'
            },
            {
                id: 'evidence_manager',
                name: 'Evidence Manager',
                icon: 'archive',
                description: 'Oversee evidence storage and chain of custody',
                permissions: ['Evidence custody', 'Storage management', 'Chain of custody', 'Evidence tracking'],
                dashboard: 'dashboard-manager.html'
            },
            {
                id: 'auditor',
                name: 'Auditor',
                icon: 'clipboard-check',
                description: 'Monitor system compliance and audit activities',
                permissions: ['System auditing', 'Compliance monitoring', 'Activity review', 'Audit reports'],
                dashboard: 'dashboard-auditor.html'
            },
            {
                id: 'admin',
                name: 'Administrator',
                icon: 'shield-check',
                description: 'Full system administration and user management',
                permissions: ['User management', 'System configuration', 'Full access', 'Administrative controls'],
                dashboard: 'admin.html'
            }
        ];
    }

    show(walletAddress) {
        this.userWallet = walletAddress;
        this.createWizardModal();
    }

    createWizardModal() {
        const modal = document.createElement('div');
        modal.className = 'role-wizard-modal active';
        modal.innerHTML = `
            <div class="wizard-content">
                <div class="wizard-header">
                    <div class="wizard-icon">
                        <i data-lucide="user-check"></i>
                    </div>
                    <h2>Welcome to EVID-DGC</h2>
                    <p>Please select your role to access the appropriate dashboard and features</p>
                </div>
                
                <div class="wizard-body">
                    <div class="roles-grid">
                        ${this.roles.map(role => this.renderRoleCard(role)).join('')}
                    </div>
                    
                    <div class="selected-role-details" id="selectedRoleDetails" style="display: none;">
                        <h3>Role Permissions</h3>
                        <div class="permissions-list" id="permissionsList"></div>
                    </div>
                </div>
                
                <div class="wizard-footer">
                    <button class="btn btn-outline" onclick="roleWizard.skip()">
                        <i data-lucide="skip-forward"></i>
                        Skip & Use Default
                    </button>
                    <button class="btn btn-primary" id="proceedBtn" onclick="roleWizard.proceed()" disabled>
                        <i data-lucide="arrow-right"></i>
                        Proceed to Dashboard
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        this.bindEvents();
    }

    renderRoleCard(role) {
        return `
            <div class="role-card" data-role="${role.id}" onclick="roleWizard.selectRole('${role.id}')">
                <div class="role-icon">
                    <i data-lucide="${role.icon}"></i>
                </div>
                <div class="role-info">
                    <h3>${role.name}</h3>
                    <p>${role.description}</p>
                </div>
                <div class="role-selector">
                    <div class="radio-button"></div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Add click handlers for role cards
        document.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', () => {
                const roleId = card.dataset.role;
                this.selectRole(roleId);
            });
        });
    }

    selectRole(roleId) {
        this.selectedRole = roleId;
        
        // Update UI
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-role="${roleId}"]`).classList.add('selected');
        
        // Show permissions
        const role = this.roles.find(r => r.id === roleId);
        this.showPermissions(role);
        
        // Enable proceed button
        document.getElementById('proceedBtn').disabled = false;
    }

    showPermissions(role) {
        const detailsDiv = document.getElementById('selectedRoleDetails');
        const permissionsList = document.getElementById('permissionsList');
        
        permissionsList.innerHTML = `
            <div class="role-summary">
                <div class="role-title">
                    <i data-lucide="${role.icon}"></i>
                    <span>${role.name}</span>
                </div>
                <p>${role.description}</p>
            </div>
            <div class="permissions-grid">
                ${role.permissions.map(permission => `
                    <div class="permission-item">
                        <i data-lucide="check-circle"></i>
                        <span>${permission}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        detailsDiv.style.display = 'block';
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    proceed() {
        if (!this.selectedRole) {
            this.showError('Please select a role first.');
            return;
        }
        
        const role = this.roles.find(r => r.id === this.selectedRole);
        
        try {
            // Store role selection with timestamp
            localStorage.setItem('selectedRole', this.selectedRole);
            localStorage.setItem('roleWizardCompleted', 'true');
            localStorage.setItem('roleSelectedAt', new Date().toISOString());
            
            // Store user data
            const userData = {
                role: this.selectedRole,
                fullName: 'User',
                walletAddress: this.userWallet,
                isRegistered: true,
                registrationDate: new Date().toISOString(),
                accountType: 'role_selected'
            };
            
            if (this.userWallet) {
                localStorage.setItem('evidUser_' + this.userWallet, JSON.stringify(userData));
                localStorage.setItem('currentUser', this.userWallet);
            }
            
            // Log role selection
            this.logRoleSelection();
            
            // Show success message
            this.showSuccess(role);
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = role.dashboard;
            }, 1500);
            
        } catch (error) {
            console.error('Role selection error:', error);
            this.showError('Failed to set role. Please try again.');
        }
    }

    logRoleSelection() {
        try {
            // Simple logging to localStorage for now
            const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
            logs.unshift({
                user_id: this.userWallet,
                action: 'role_selected',
                details: {
                    selected_role: this.selectedRole,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('activityLogs', JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
        } catch (error) {
            console.error('Failed to log role selection:', error);
        }
    }

    skip() {
        localStorage.setItem('roleWizardCompleted', 'true');
        localStorage.setItem('selectedRole', 'public_viewer'); // Default role
        window.location.href = 'dashboard.html';
    }

    showSuccess(role) {
        const modal = document.querySelector('.role-wizard-modal');
        modal.innerHTML = `
            <div class="wizard-content success">
                <div class="success-icon">
                    <i data-lucide="check-circle"></i>
                </div>
                <h2>Role Selected Successfully!</h2>
                <p>You have been assigned the <strong>${role.name}</strong> role.</p>
                <p>Redirecting to your dashboard...</p>
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wizard-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i data-lucide="alert-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
        
        document.querySelector('.wizard-content').appendChild(errorDiv);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    close() {
        const modal = document.querySelector('.role-wizard-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Initialize wizard
let roleWizard;

// Function to show wizard after MetaMask connection
function showRoleWizard(walletAddress) {
    // Check if wizard was already completed
    if (localStorage.getItem('roleWizardCompleted') === 'true') {
        const selectedRole = localStorage.getItem('selectedRole');
        if (selectedRole) {
            const roleMapping = {
                'public_viewer': 'dashboard-public.html',
                'investigator': 'dashboard-investigator.html',
                'forensic_analyst': 'dashboard-analyst.html',
                'legal_professional': 'dashboard-legal.html',
                'court_official': 'dashboard-court.html',
                'evidence_manager': 'dashboard-manager.html',
                'auditor': 'dashboard-auditor.html',
                'admin': 'admin.html'
            };
            
            const dashboardUrl = roleMapping[selectedRole] || 'dashboard.html';
            window.location.href = dashboardUrl;
            return;
        }
    }
    
    roleWizard = new RoleSelectionWizard();
    roleWizard.show(walletAddress);
}

// Function to reset wizard (for testing or re-selection)
function resetRoleWizard() {
    localStorage.removeItem('roleWizardCompleted');
    localStorage.removeItem('selectedRole');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoleSelectionWizard, showRoleWizard, resetRoleWizard };
}