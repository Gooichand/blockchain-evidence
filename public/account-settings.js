// Account Settings Management
class AccountSettings {
    constructor() {
        this.currentUser = null;
        this.sessions = [];
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
    }

    async loadCurrentUser() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = window.apiClient.getCurrentUser();
        if (!this.currentUser) {
            // Fallback: minimal session identity derived from stored token key
            const key = localStorage.getItem('currentUser');
            this.currentUser = key
                ? { id: key, email: key, walletAddress: null, role: null }
                : null;
        }
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        this.loadUserData();
        await this.loadSessions();
    }

    setupEventListeners() {
        // Profile form
        document.getElementById('profileForm').addEventListener('submit', this.handleProfileUpdate.bind(this));
        
        // Password form
        document.getElementById('passwordForm').addEventListener('submit', this.handlePasswordChange.bind(this));
        
        // Password strength indicator
        document.getElementById('newPassword').addEventListener('input', this.updatePasswordStrength.bind(this));
        document.getElementById('confirmPassword').addEventListener('input', this.validatePasswordMatch.bind(this));
    }

    loadUserData() {
        if (!this.currentUser) return;

        const u = this.currentUser;

        // Load profile data
        document.getElementById('fullName').value = u.fullName || u.full_name || '';
        document.getElementById('email').value = u.email || u.walletAddress || u.wallet_address || '';
        document.getElementById('department').value = u.department || '';
        document.getElementById('jurisdiction').value = u.jurisdiction || '';
        document.getElementById('badgeNumber').value = u.badgeNumber || u.badge_number || '';
        
        // Display role
        const roleNames = {
            1: 'Public Viewer', 2: 'Investigator', 3: 'Forensic Analyst',
            4: 'Legal Professional', 5: 'Court Official', 6: 'Evidence Manager',
            7: 'Auditor', 8: 'Administrator',
            public_viewer: 'Public Viewer', investigator: 'Investigator',
            forensic_analyst: 'Forensic Analyst', legal_professional: 'Legal Professional',
            court_official: 'Court Official', evidence_manager: 'Evidence Manager',
            auditor: 'Auditor', admin: 'Administrator'
        };
        document.getElementById('currentRole').value = roleNames[u.role] || u.role || 'Unknown';

        // Load notification preferences
        this.loadNotificationSettings();
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const updatePayload = {
            fullName: formData.get('fullName') || document.getElementById('fullName').value,
            department: formData.get('department') || document.getElementById('department').value,
            jurisdiction: formData.get('jurisdiction') || document.getElementById('jurisdiction').value,
            badgeNumber: formData.get('badgeNumber') || document.getElementById('badgeNumber').value
        };

        try {
            const result = await window.apiClient.post('/auth/update-profile', updatePayload);
            
            if (result.success) {
                this.currentUser = { ...this.currentUser, ...updatePayload };
                // Update local cache as well
                const key = localStorage.getItem('currentUser') || this.currentUser.email || this.currentUser.walletAddress || 'user';
                localStorage.setItem('evidUser_' + key, JSON.stringify(this.currentUser));
                this.showAlert('Profile updated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showAlert(error.message, 'error');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            this.showAlert('New passwords do not match', 'error');
            return;
        }

        try {
            const result = await window.apiClient.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            if (result.success) {
                document.getElementById('passwordForm').reset();
                this.showAlert('Password updated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to update password');
            }
        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }

    updatePasswordStrength() {
        const password = document.getElementById('newPassword').value;
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');

        let strength = 0;
        let strengthLabel = 'Very Weak';
        let color = '#ef4444';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                strengthLabel = 'Weak';
                color = '#ef4444';
                break;
            case 2:
                strengthLabel = 'Fair';
                color = '#f59e0b';
                break;
            case 3:
            case 4:
                strengthLabel = 'Good';
                color = '#10b981';
                break;
            case 5:
                strengthLabel = 'Strong';
                color = '#059669';
                break;
        }

        const percentage = (strength / 5) * 100;
        strengthFill.style.width = percentage + '%';
        strengthFill.style.backgroundColor = color;
        strengthText.textContent = `Password strength: ${strengthLabel}`;
    }

    validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmField = document.getElementById('confirmPassword');

        if (newPassword !== confirmPassword && confirmPassword.length > 0) {
            confirmField.setCustomValidity('Passwords do not match');
        } else {
            confirmField.setCustomValidity('');
        }
    }

    async loadSessions() {
        try {
            const result = await window.apiClient.get('/auth/sessions');
            if (result.success) {
                this.sessions = result.sessions;
                this.renderSessions();
            }
        } catch (error) {
            console.warn('Failed to load sessions:', error);
            this.sessions = [];
            this.renderSessions();
        }
    }

    renderSessions() {
        const sessionsList = document.getElementById('sessionsList');
        if (!this.sessions || this.sessions.length === 0) {
            sessionsList.innerHTML = '<p class="empty-state">No active sessions recorded.</p>';
            return;
        }

        sessionsList.innerHTML = this.sessions.map(session => `
            <div class="session-item ${session.current ? 'current-session' : ''}">
                <div class="session-info">
                    <div class="session-device">
                        <i data-lucide="${session.current ? 'monitor' : 'smartphone'}"></i>
                        <strong>${session.device}</strong>
                        ${session.current ? '<span class="current-badge">Current</span>' : ''}
                    </div>
                    <div class="session-details">
                        <span>${session.browser}</span>
                        <span>${session.location}</span>
                        <span>Last active: ${new Date(session.lastActive).toLocaleString()}</span>
                    </div>
                </div>
                ${!session.current ? `
                    <button class="btn btn-outline btn-sm" onclick="accountSettings.terminateSession(${session.id})">
                        <i data-lucide="log-out"></i>
                        End Session
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        lucide.createIcons();
    }

    terminateSession(sessionId) {
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.renderSessions();
        this.showAlert('Session terminated successfully', 'success');
    }

    logoutAllSessions() {
        if (confirm('Are you sure you want to logout all other sessions? This will end all active sessions except the current one.')) {
            this.sessions = this.sessions.filter(s => s.current);
            this.renderSessions();
            this.showAlert('All other sessions have been terminated', 'success');
        }
    }

    toggleTwoFactor() {
        const status = document.getElementById('twoFactorStatus');
        const button = document.getElementById('twoFactorToggle');
        
        if (status.textContent === 'Disabled') {
            // Enable 2FA
            status.textContent = 'Enabled';
            status.className = 'status-badge enabled';
            button.textContent = 'Disable';
            this.showAlert('Two-factor authentication enabled', 'success');
        } else {
            // Disable 2FA
            status.textContent = 'Disabled';
            status.className = 'status-badge disabled';
            button.textContent = 'Enable';
            this.showAlert('Two-factor authentication disabled', 'info');
        }
    }

    loadNotificationSettings() {
        const settings = JSON.parse(localStorage.getItem('notificationSettings_' + this.userKey())) || {
            evidenceUploads: true,
            evidenceVerification: true,
            caseAssignments: true,
            caseUpdates: true,
            systemAlerts: true,
            securityAlerts: true
        };

        Object.keys(settings).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.checked = settings[key];
            }
        });
    }

    saveNotificationSettings() {
        const settings = {
            evidenceUploads: document.getElementById('evidenceUploads').checked,
            evidenceVerification: document.getElementById('evidenceVerification').checked,
            caseAssignments: document.getElementById('caseAssignments').checked,
            caseUpdates: document.getElementById('caseUpdates').checked,
            systemAlerts: document.getElementById('systemAlerts').checked,
            securityAlerts: document.getElementById('securityAlerts').checked
        };

        localStorage.setItem('notificationSettings_' + this.userKey(), JSON.stringify(settings));
        this.showAlert('Notification preferences saved', 'success');
    }

    userKey() {
        return localStorage.getItem('currentUser') || this.currentUser?.email || this.currentUser?.walletAddress || 'user';
    }

    resetProfileForm() {
        this.loadUserData();
        this.showAlert('Form reset to saved values', 'info');
    }

    showAlert(message, type) {
        if (typeof showAlert === 'function') {
            showAlert(message, type);
        } else {
            alert(message);
        }
    }
}

// Tab management
function showSettingsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[onclick="showSettingsTab('${tabName}')"]`).classList.add('active');
}

// Global functions
function resetProfileForm() {
    accountSettings.resetProfileForm();
}

function logoutAllSessions() {
    accountSettings.logoutAllSessions();
}

function toggleTwoFactor() {
    accountSettings.toggleTwoFactor();
}

function saveNotificationSettings() {
    accountSettings.saveNotificationSettings();
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// Initialize
function initializeAccountSettings() {
    window.accountSettings = new AccountSettings();
}

// Export
window.AccountSettings = AccountSettings;