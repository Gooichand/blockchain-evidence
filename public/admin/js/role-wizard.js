// Interactive Role Selection Wizard
class RoleSelectionWizard {
    constructor() {
        this.roles = [
            {
                id: 1,
                name: 'Public Viewer',
                icon: 'eye',
                description: 'View public cases and evidence',
                permissions: ['View public cases', 'Browse public evidence', 'Access general information'],
                restrictions: ['Cannot create content', 'No sensitive data access']
            },
            {
                id: 2,
                name: 'Investigator',
                icon: 'search',
                description: 'Manage investigations and cases',
                permissions: ['Create cases', 'Upload evidence', 'Manage investigations', 'Generate reports'],
                restrictions: ['Cannot access other investigators private cases', 'No system settings']
            },
            {
                id: 3,
                name: 'Forensic Analyst',
                icon: 'microscope',
                description: 'Analyze evidence and generate reports',
                permissions: ['Analyze evidence', 'Generate forensic reports', 'Validate evidence integrity', 'Cross-reference evidence'],
                restrictions: ['Cannot create cases', 'Cannot delete evidence']
            },
            {
                id: 4,
                name: 'Legal Professional',
                icon: 'scale',
                description: 'Review cases and legal documentation',
                permissions: ['Review case documentation', 'Access legal evidence', 'Generate legal reports', 'Case status updates'],
                restrictions: ['Cannot modify evidence', 'Cannot create investigations']
            },
            {
                id: 5,
                name: 'Court Official',
                icon: 'building',
                description: 'Manage court proceedings',
                permissions: ['Access court cases', 'Manage proceedings', 'Evidence presentation', 'Case scheduling'],
                restrictions: ['Cannot modify evidence content', 'Cannot create investigations']
            },
            {
                id: 6,
                name: 'Evidence Manager',
                icon: 'clipboard-list',
                description: 'Manage evidence lifecycle',
                permissions: ['Evidence lifecycle management', 'Chain of custody', 'Evidence disposal', 'Storage compliance'],
                restrictions: ['No user management', 'No system configuration']
            },
            {
                id: 7,
                name: 'Auditor',
                icon: 'shield-check',
                description: 'System auditing and compliance',
                permissions: ['System audit access', 'Compliance monitoring', 'Activity log review', 'Generate audit reports'],
                restrictions: ['Cannot modify system data', 'No user management']
            },
            {
                id: 8,
                name: 'Administrator',
                icon: 'crown',
                description: 'Full system access and management',
                permissions: ['Full system access', 'User management', 'System configuration', 'All operations'],
                restrictions: ['None - Full access']
            }
        ];
        this.selectedRole = null;
    }

    show(userWallet) {
        this.userWallet = userWallet;
        this.createWizardModal();
        this.showModal();
    }

    createWizardModal() {
        // Remove existing wizard if present
        const existing = document.getElementById('roleWizardModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'roleWizardModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content role-wizard-content">
                <div class="wizard-header">
                    <h2>Welcome to EVID-DGC!</h2>
                    <p>Please select your role to get started. Each role has specific permissions and access levels.</p>
                </div>
                
                <div class="wizard-steps">
                    <div class="step active" data-step="1">
                        <span class="step-number">1</span>
                        <span class="step-title">Select Role</span>
                    </div>
                    <div class="step" data-step="2">
                        <span class="step-number">2</span>
                        <span class="step-title">Review Permissions</span>
                    </div>
                    <div class="step" data-step="3">
                        <span class="step-number">3</span>
                        <span class="step-title">Complete Setup</span>
                    </div>
                </div>

                <div class="wizard-content">
                    <div class="wizard-step" id="step1">
                        <h3>Choose Your Role</h3>
                        <div class="roles-grid">
                            ${this.renderRoles()}
                        </div>
                    </div>

                    <div class="wizard-step hidden" id="step2">
                        <h3>Review Permissions</h3>
                        <div id="rolePreview"></div>
                    </div>

                    <div class="wizard-step hidden" id="step3">
                        <h3>Complete Your Profile</h3>
                        <div id="profileForm"></div>
                    </div>
                </div>

                <div class="wizard-actions">
                    <button id="prevBtn" class="btn btn-outline" onclick="roleWizard.previousStep()" disabled>
                        <i data-lucide="arrow-left"></i> Previous
                    </button>
                    <button id="nextBtn" class="btn btn-primary" onclick="roleWizard.nextStep()" disabled>
                        Next <i data-lucide="arrow-right"></i>
                    </button>
                    <button id="completeBtn" class="btn btn-success hidden" onclick="roleWizard.complete()">
                        <i data-lucide="check"></i> Complete Setup
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.attachEventListeners();
        lucide.createIcons();
    }

    renderRoles() {
        return this.roles.map(role => `
            <div class="role-option" data-role="${role.id}" onclick="roleWizard.selectRole(${role.id})">
                <div class="role-icon">
                    <i data-lucide="${role.icon}"></i>
                </div>
                <div class="role-info">
                    <h4>${role.name}</h4>
                    <p>${role.description}</p>
                </div>
                <div class="role-selector">
                    <input type="radio" name="role" value="${role.id}" id="role${role.id}">
                    <label for="role${role.id}"></label>
                </div>
            </div>
        `).join('');
    }

    selectRole(roleId) {
        this.selectedRole = this.roles.find(r => r.id === roleId);
        
        // Update UI
        document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-role="${roleId}"]`).classList.add('selected');
        document.getElementById(`role${roleId}`).checked = true;
        
        // Enable next button
        document.getElementById('nextBtn').disabled = false;
    }

    nextStep() {
        const currentStep = document.querySelector('.wizard-step:not(.hidden)');
        const stepNumber = parseInt(currentStep.id.replace('step', ''));
        
        if (stepNumber === 1 && this.selectedRole) {
            this.showStep(2);
            this.renderPermissionPreview();
        } else if (stepNumber === 2) {
            this.showStep(3);
            this.renderProfileForm();
        }
    }

    previousStep() {
        const currentStep = document.querySelector('.wizard-step:not(.hidden)');
        const stepNumber = parseInt(currentStep.id.replace('step', ''));
        
        if (stepNumber > 1) {
            this.showStep(stepNumber - 1);
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        
        // Show current step
        document.getElementById(`step${stepNumber}`).classList.remove('hidden');
        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');
        
        // Update buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const completeBtn = document.getElementById('completeBtn');
        
        prevBtn.disabled = stepNumber === 1;
        
        if (stepNumber === 3) {
            nextBtn.classList.add('hidden');
            completeBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            completeBtn.classList.add('hidden');
            nextBtn.disabled = stepNumber === 2 ? false : !this.selectedRole;
        }
    }

    renderPermissionPreview() {
        const preview = document.getElementById('rolePreview');
        preview.innerHTML = `
            <div class="role-preview">
                <div class="role-header">
                    <div class="role-icon-large">
                        <i data-lucide="${this.selectedRole.icon}"></i>
                    </div>
                    <div>
                        <h4>${this.selectedRole.name}</h4>
                        <p>${this.selectedRole.description}</p>
                    </div>
                </div>
                
                <div class="permissions-section">
                    <h5><i data-lucide="check-circle"></i> What you can do:</h5>
                    <ul class="permissions-list">
                        ${this.selectedRole.permissions.map(p => `<li><i data-lucide="check"></i> ${p}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="restrictions-section">
                    <h5><i data-lucide="x-circle"></i> Restrictions:</h5>
                    <ul class="restrictions-list">
                        ${this.selectedRole.restrictions.map(r => `<li><i data-lucide="x"></i> ${r}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    renderProfileForm() {
        const form = document.getElementById('profileForm');
        form.innerHTML = `
            <form id="wizardProfileForm">
                <div class="form-group">
                    <label for="wizardFullName">Full Name *</label>
                    <input type="text" id="wizardFullName" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="wizardDepartment">Department/Organization</label>
                    <input type="text" id="wizardDepartment" class="form-control" placeholder="e.g., Police Department, Law Firm">
                </div>
                
                <div class="form-group">
                    <label for="wizardJurisdiction">Jurisdiction</label>
                    <input type="text" id="wizardJurisdiction" class="form-control" placeholder="e.g., City, County, State">
                </div>
                
                <div class="form-group">
                    <label for="wizardBadgeNumber">Badge/ID Number</label>
                    <input type="text" id="wizardBadgeNumber" class="form-control" placeholder="Optional">
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="wizardTerms" required>
                        <span class="checkmark"></span>
                        I agree to the terms of service and privacy policy
                    </label>
                </div>
            </form>
        `;
    }

    async complete() {
        const form = document.getElementById('wizardProfileForm');
        const formData = new FormData(form);
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const userData = {
            walletAddress: this.userWallet,
            fullName: formData.get('wizardFullName') || document.getElementById('wizardFullName').value,
            role: this.selectedRole.id,
            department: formData.get('wizardDepartment') || document.getElementById('wizardDepartment').value || 'General',
            jurisdiction: formData.get('wizardJurisdiction') || document.getElementById('wizardJurisdiction').value || 'General',
            badgeNumber: formData.get('wizardBadgeNumber') || document.getElementById('wizardBadgeNumber').value || '',
            isRegistered: true,
            registrationDate: new Date().toISOString(),
            accountType: 'wizard'
        };

        // Save user data
        localStorage.setItem('evidUser_' + this.userWallet, JSON.stringify(userData));
        localStorage.setItem('currentUser', this.userWallet);

        // Close wizard
        this.closeModal();

        // Show success and redirect
        if (typeof showAlert === 'function') {
            showAlert('Welcome to EVID-DGC! Redirecting to your dashboard...', 'success');
        }

        setTimeout(() => {
            window.location.href = this.getDashboardUrl(this.selectedRole.id);
        }, 2000);
    }

    getDashboardUrl(roleId) {
        const dashboardMap = {
            1: 'dashboard-public.html',
            2: 'dashboard-investigator.html',
            3: 'dashboard-analyst.html',
            4: 'dashboard-legal.html',
            5: 'dashboard-court.html',
            6: 'dashboard-manager.html',
            7: 'dashboard-auditor.html',
            8: 'admin.html'
        };
        return dashboardMap[roleId] || 'dashboard.html';
    }

    showModal() {
        document.getElementById('roleWizardModal').classList.add('active');
        // Focus first role option for accessibility
        setTimeout(() => {
            const firstRole = document.querySelector('.role-option');
            if (firstRole) firstRole.focus();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('roleWizardModal');
        if (modal) modal.remove();
    }

    attachEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Don't allow closing wizard with escape - user must complete it
                e.preventDefault();
            }
        });
    }
}

// Global instance
window.roleWizard = new RoleSelectionWizard();

// Function to show wizard (called from app.js)
function showRoleWizard(userWallet) {
    window.roleWizard.show(userWallet);
}