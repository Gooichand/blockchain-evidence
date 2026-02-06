/**
 * Session Timeout Admin Configuration
 * Admin interface for managing session timeouts
 */

class SessionTimeoutAdmin {
    constructor() {
        this.defaultTimeouts = {
            'admin': 30,
            'evidence_manager': 45,
            'court_official': 60,
            'auditor': 90,
            'legal_professional': 120,
            'forensic_analyst': 120,
            'investigator': 180,
            'public_viewer': 240
        };
        this.init();
    }

    init() {
        this.loadCurrentSettings();
        this.createAdminPanel();
    }

    // Create admin configuration panel
    createAdminPanel() {
        const adminPanel = document.createElement('div');
        adminPanel.className = 'card session-config';
        adminPanel.innerHTML = `
            <div class="card-header">
                <h2>⏱️ Session Timeout Configuration</h2>
                <p>Configure session timeouts for different user roles</p>
            </div>
            <div class="card-body">
                <div class="timeout-settings" id="timeout-settings">
                    ${this.generateTimeoutSettings()}
                </div>
                <div class="config-actions">
                    <button class="btn btn-primary" onclick="sessionTimeoutAdmin.saveSettings()">
                        <i data-lucide="save"></i>
                        Save Settings
                    </button>
                    <button class="btn btn-outline" onclick="sessionTimeoutAdmin.resetToDefaults()">
                        <i data-lucide="refresh-cw"></i>
                        Reset to Defaults
                    </button>
                    <button class="btn btn-warning" onclick="sessionTimeoutAdmin.viewActiveSessions()">
                        <i data-lucide="users"></i>
                        View Active Sessions
                    </button>
                </div>
                <div id="settings-status" class="settings-status"></div>
            </div>
        `;
        
        // Add to admin page if container exists
        const container = document.querySelector('.container');
        if (container && this.isAdmin()) {
            container.appendChild(adminPanel);
        }
    }

    // Generate timeout settings HTML
    generateTimeoutSettings() {
        const roles = [
            { key: 'admin', name: 'Administrator', desc: 'System administrators' },
            { key: 'evidence_manager', name: 'Evidence Manager', desc: 'Evidence lifecycle management' },
            { key: 'court_official', name: 'Court Official', desc: 'Court proceedings management' },
            { key: 'auditor', name: 'Auditor', desc: 'System auditing and compliance' },
            { key: 'legal_professional', name: 'Legal Professional', desc: 'Legal review and compliance' },
            { key: 'forensic_analyst', name: 'Forensic Analyst', desc: 'Evidence analysis' },
            { key: 'investigator', name: 'Investigator', desc: 'Case investigations' },
            { key: 'public_viewer', name: 'Public Viewer', desc: 'Public case viewing' }
        ];

        return roles.map(role => `
            <div class="timeout-setting">
                <div class="role-info">
                    <h4>${role.name}</h4>
                    <p>${role.desc}</p>
                </div>
                <div class="timeout-control">
                    <input type="number" 
                           class="timeout-input" 
                           id="timeout-${role.key}"
                           value="${this.getCurrentTimeout(role.key)}"
                           min="5" 
                           max="480"
                           step="5">
                    <span class="timeout-unit">minutes</span>
                </div>
            </div>
        `).join('');
    }

    // Get current timeout for role
    getCurrentTimeout(role) {
        if (window.sessionManager) {
            return window.sessionManager.getTimeoutForRole(role);
        }
        return this.defaultTimeouts[role] || 240;
    }

    // Save timeout settings
    saveSettings() {
        const settings = {};
        const inputs = document.querySelectorAll('.timeout-input');
        
        inputs.forEach(input => {
            const role = input.id.replace('timeout-', '');
            const value = parseInt(input.value);
            
            if (value >= 5 && value <= 480) {
                settings[role] = value;
            }
        });

        // Update session manager
        if (window.sessionManager) {
            Object.keys(settings).forEach(role => {
                window.sessionManager.updateRoleTimeout(role, settings[role]);
            });
        }

        // Save to localStorage
        localStorage.setItem('sessionTimeoutConfig', JSON.stringify(settings));
        
        this.showStatus('Settings saved successfully!', 'success');
        
        // Log admin action
        this.logAdminAction('timeout_config_updated', settings);
    }

    // Reset to default settings
    resetToDefaults() {
        if (confirm('Reset all timeout settings to defaults? This will affect all users.')) {
            // Reset inputs
            Object.keys(this.defaultTimeouts).forEach(role => {
                const input = document.getElementById(`timeout-${role}`);
                if (input) {
                    input.value = this.defaultTimeouts[role];
                }
            });

            // Update session manager
            if (window.sessionManager) {
                Object.keys(this.defaultTimeouts).forEach(role => {
                    window.sessionManager.updateRoleTimeout(role, this.defaultTimeouts[role]);
                });
            }

            // Clear custom config
            localStorage.removeItem('sessionTimeoutConfig');
            
            this.showStatus('Settings reset to defaults', 'info');
            this.logAdminAction('timeout_config_reset');
        }
    }

    // View active sessions
    viewActiveSessions() {
        const sessions = this.getActiveSessions();
        this.showSessionsModal(sessions);
    }

    // Get active sessions (mock data for demo)
    getActiveSessions() {
        const mockSessions = [
            {
                userId: 'admin_user',
                role: 'admin',
                loginTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
                timeoutLimit: 30,
                remainingTime: 13
            },
            {
                userId: 'evidence_mgr_1',
                role: 'evidence_manager',
                loginTime: new Date(Date.now() - 25 * 60 * 1000),
                lastActivity: new Date(Date.now() - 5 * 60 * 1000),
                timeoutLimit: 45,
                remainingTime: 15
            }
        ];
        
        return mockSessions;
    }

    // Show active sessions modal
    showSessionsModal(sessions) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Active Sessions</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="sessions-table">
                        <table class="user-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Login Time</th>
                                    <th>Last Activity</th>
                                    <th>Remaining</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sessions.map(session => `
                                    <tr>
                                        <td>${session.userId}</td>
                                        <td><span class="badge">${session.role}</span></td>
                                        <td>${session.loginTime.toLocaleTimeString()}</td>
                                        <td>${session.lastActivity.toLocaleTimeString()}</td>
                                        <td>${session.remainingTime}m</td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" onclick="sessionTimeoutAdmin.extendSession('${session.userId}')">
                                                Extend
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="sessionTimeoutAdmin.terminateSession('${session.userId}')">
                                                Terminate
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    // Extend user session
    extendSession(userId) {
        if (confirm(`Extend session for ${userId}?`)) {
            // In real implementation, this would call backend API
            this.showStatus(`Session extended for ${userId}`, 'success');
            this.logAdminAction('session_extended', { userId });
        }
    }

    // Terminate user session
    terminateSession(userId) {
        if (confirm(`Terminate session for ${userId}? User will be logged out immediately.`)) {
            // In real implementation, this would call backend API
            this.showStatus(`Session terminated for ${userId}`, 'warning');
            this.logAdminAction('session_terminated', { userId });
        }
    }

    // Show status message
    showStatus(message, type) {
        const statusDiv = document.getElementById('settings-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
    }

    // Load current settings
    loadCurrentSettings() {
        try {
            const config = localStorage.getItem('sessionTimeoutConfig');
            if (config) {
                this.currentSettings = JSON.parse(config);
            } else {
                this.currentSettings = { ...this.defaultTimeouts };
            }
        } catch (error) {
            console.error('Error loading timeout settings:', error);
            this.currentSettings = { ...this.defaultTimeouts };
        }
    }

    // Check if current user is admin
    isAdmin() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return false;
        
        try {
            const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
            return userData.role === 'admin' || userData.role === 8;
        } catch (error) {
            return false;
        }
    }

    // Log admin actions
    logAdminAction(action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            admin: localStorage.getItem('currentUser'),
            action: action,
            data: data
        };
        
        // Store in localStorage for demo (would be sent to backend in production)
        const logs = JSON.parse(localStorage.getItem('adminActionLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 entries
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('adminActionLogs', JSON.stringify(logs));
        console.log('Admin action logged:', logEntry);
    }

    // Get session statistics
    getSessionStatistics() {
        return {
            totalActiveSessions: 2, // Mock data
            averageSessionDuration: 45,
            timeoutEvents: 5,
            extensionRequests: 12,
            configurationChanges: 3
        };
    }

    // Export configuration
    exportConfiguration() {
        const config = {
            timeouts: this.currentSettings,
            exportDate: new Date().toISOString(),
            exportedBy: localStorage.getItem('currentUser')
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'session-timeout-config.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.logAdminAction('config_exported');
    }

    // Import configuration
    importConfiguration(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                if (config.timeouts) {
                    // Validate and apply configuration
                    Object.keys(config.timeouts).forEach(role => {
                        const timeout = config.timeouts[role];
                        if (timeout >= 5 && timeout <= 480) {
                            const input = document.getElementById(`timeout-${role}`);
                            if (input) {
                                input.value = timeout;
                            }
                        }
                    });
                    
                    this.showStatus('Configuration imported successfully', 'success');
                    this.logAdminAction('config_imported', { source: file.name });
                }
            } catch (error) {
                this.showStatus('Error importing configuration', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize admin interface
const sessionTimeoutAdmin = new SessionTimeoutAdmin();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.sessionTimeoutAdmin = sessionTimeoutAdmin;
}