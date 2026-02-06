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
        this.loadUserData();
        this.loadSessions();
    }

    loadCurrentUser() {
        const currentUserKey = localStorage.getItem('currentUser');
        if (currentUserKey) {
            if (currentUserKey.startsWith('email_')) {
                this.currentUser = JSON.parse(localStorage.getItem('evidUser_' + currentUserKey));
            } else {
                this.currentUser = JSON.parse(localStorage.getItem('evidUser_' + currentUserKey));
            }
        }

        if (!this.currentUser) {
            window.location.href = '/';
            return;
        }
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

        // Load profile data
        document.getElementById('fullName').value = this.currentUser.fullName || '';
        document.getElementById('email').value = this.currentUser.email || this.currentUser.walletAddress || '';
        document.getElementById('department').value = this.currentUser.department || '';
        document.getElementById('jurisdiction').value = this.currentUser.jurisdiction || '';
        document.getElementById('badgeNumber').value = this.currentUser.badgeNumber || '';
        
        // Display role
        const roleNames = {
            1: 'Public Viewer', 2: 'Investigator', 3: 'Forensic Analyst',
            4: 'Legal Professional', 5: 'Court Official', 6: 'Evidence Manager',
            7: 'Auditor', 8: 'Administrator'
        };
        document.getElementById('currentRole').value = roleNames[this.currentUser.role] || this.currentUser.role || 'Unknown';

        // Load notification preferences
        this.loadNotificationSettings();
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const updatedData = {
            ...this.currentUser,
            fullName: formData.get('fullName') || document.getElementById('fullName').value,
            department: formData.get('department') || document.getElementById('department').value,
            jurisdiction: formData.get('jurisdiction') || document.getElementById('jurisdiction').value,
            badgeNumber: formData.get('badgeNumber') || document.getElementById('badgeNumber').value,
            lastUpdated: new Date().toISOString()
        };

        try {
            // Save to localStorage
            const currentUserKey = localStorage.getItem('currentUser');
            if (currentUserKey.startsWith('email_')) {
                localStorage.setItem('evidUser_' + currentUserKey, JSON.stringify(updatedData));
                localStorage.setItem('emailUser_' + this.currentUser.email, JSON.stringify(updatedData));
            } else {
                localStorage.setItem('evidUser_' + currentUserKey, JSON.stringify(updatedData));
            }

            this.currentUser = updatedData;
            this.showAlert('Profile updated successfully!', 'success');
        } catch (error) {
            this.showAlert('Failed to update profile. Please try again.', 'error');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate current password
        if (this.currentUser.password && this.currentUser.password !== currentPassword) {
            this.showAlert('Current password is incorrect', 'error');
            return;
        }

        // Validate new password
        if (newPassword !== confirmPassword) {
            this.showAlert('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            // Update password
            const updatedData = {
                ...this.currentUser,
                password: newPassword,
                lastPasswordChange: new Date().toISOString()
            };

            // Save to localStorage
            const currentUserKey = localStorage.getItem('currentUser');
            if (currentUserKey.startsWith('email_')) {
                localStorage.setItem('evidUser_' + currentUserKey, JSON.stringify(updatedData));
                localStorage.setItem('emailUser_' + this.currentUser.email, JSON.stringify(updatedData));
            } else {
                localStorage.setItem('evidUser_' + currentUserKey, JSON.stringify(updatedData));
            }

            this.currentUser = updatedData;
            
            // Clear form
            document.getElementById('passwordForm').reset();
            
            this.showAlert('Password updated successfully!', 'success');
        } catch (error) {
            this.showAlert('Failed to update password. Please try again.', 'error');
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

    loadSessions() {
        // Simulate session data
        this.sessions = [
            {
                id: 1,
                device: 'Current Session',
                browser: 'Chrome on Windows',
                location: 'Local',
                lastActive: new Date().toISOString(),
                current: true
            }
        ];

        this.renderSessions();
    }

    renderSessions() {
        const sessionsList = document.getElementById('sessionsList');
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
        const settings = JSON.parse(localStorage.getItem('notificationSettings_' + this.currentUser.walletAddress)) || {
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

        localStorage.setItem('notificationSettings_' + this.currentUser.walletAddress, JSON.stringify(settings));
        this.showAlert('Notification preferences saved', 'success');
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