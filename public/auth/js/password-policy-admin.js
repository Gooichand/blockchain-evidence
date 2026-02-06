/**
 * Password Policy Admin Configuration
 * Admin interface for managing password policies
 */

class PasswordPolicyAdmin {
    constructor() {
        this.defaultPolicies = {
            minLength: 12,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            minSpecialChars: 2,
            preventCommonPasswords: true,
            preventUserInfo: true,
            preventReuse: 5,
            maxAge: 90,
            warningDays: 14,
            lockoutAttempts: 5,
            lockoutDuration: 30
        };
        this.init();
    }

    init() {
        this.loadCurrentPolicies();
        this.createAdminPanel();
    }

    // Create admin configuration panel
    createAdminPanel() {
        const adminPanel = document.createElement('div');
        adminPanel.className = 'card policy-config';
        adminPanel.innerHTML = `
            <div class="card-header">
                <h2>🔐 Password Policy Configuration</h2>
                <p>Configure password security requirements for all users</p>
            </div>
            <div class="card-body">
                <div class="policy-settings">
                    ${this.generatePolicySettings()}
                </div>
                <div class="policy-actions">
                    <button class="btn btn-primary" onclick="passwordPolicyAdmin.savePolicies()">
                        <i data-lucide="save"></i>
                        Save Policies
                    </button>
                    <button class="btn btn-outline" onclick="passwordPolicyAdmin.resetToDefaults()">
                        <i data-lucide="refresh-cw"></i>
                        Reset to Defaults
                    </button>
                    <button class="btn btn-warning" onclick="passwordPolicyAdmin.testPassword()">
                        <i data-lucide="shield-check"></i>
                        Test Password
                    </button>
                    <button class="btn btn-info" onclick="passwordPolicyAdmin.exportPolicies()">
                        <i data-lucide="download"></i>
                        Export
                    </button>
                </div>
                <div id="policy-status" class="policy-status"></div>
            </div>
        `;
        
        // Add to admin page if container exists
        const container = document.querySelector('.container');
        if (container && this.isAdmin()) {
            container.appendChild(adminPanel);
        }
    }

    // Generate policy settings HTML
    generatePolicySettings() {
        return `
            <div class="policy-group">
                <h4>Length Requirements</h4>
                <div class="policy-setting">
                    <label>Minimum Length:</label>
                    <input type="number" class="policy-input" id="minLength" 
                           value="${this.currentPolicies.minLength}" min="8" max="50">
                </div>
                <div class="policy-setting">
                    <label>Maximum Length:</label>
                    <input type="number" class="policy-input" id="maxLength" 
                           value="${this.currentPolicies.maxLength}" min="20" max="256">
                </div>
            </div>

            <div class="policy-group">
                <h4>Character Requirements</h4>
                <div class="policy-setting">
                    <label>Require Uppercase Letters:</label>
                    <input type="checkbox" class="policy-checkbox" id="requireUppercase" 
                           ${this.currentPolicies.requireUppercase ? 'checked' : ''}>
                </div>
                <div class="policy-setting">
                    <label>Require Lowercase Letters:</label>
                    <input type="checkbox" class="policy-checkbox" id="requireLowercase" 
                           ${this.currentPolicies.requireLowercase ? 'checked' : ''}>
                </div>
                <div class="policy-setting">
                    <label>Require Numbers:</label>
                    <input type="checkbox" class="policy-checkbox" id="requireNumbers" 
                           ${this.currentPolicies.requireNumbers ? 'checked' : ''}>
                </div>
                <div class="policy-setting">
                    <label>Require Special Characters:</label>
                    <input type="checkbox" class="policy-checkbox" id="requireSpecialChars" 
                           ${this.currentPolicies.requireSpecialChars ? 'checked' : ''}>
                </div>
                <div class="policy-setting">
                    <label>Minimum Special Characters:</label>
                    <input type="number" class="policy-input" id="minSpecialChars" 
                           value="${this.currentPolicies.minSpecialChars}" min="1" max="10">
                </div>
            </div>

            <div class="policy-group">
                <h4>Security Policies</h4>
                <div class="policy-setting">
                    <label>Prevent Common Passwords:</label>
                    <input type="checkbox" class="policy-checkbox" id="preventCommonPasswords" 
                           ${this.currentPolicies.preventCommonPasswords ? 'checked' : ''}>
                </div>
                <div class="policy-setting">
                    <label>Prevent User Information:</label>
                    <input type="checkbox" class="policy-checkbox" id="preventUserInfo" 
                           ${this.currentPolicies.preventUserInfo ? 'checked' : ''}>
                </div>
                <div class="policy-setting">
                    <label>Prevent Password Reuse (last N):</label>
                    <input type="number" class="policy-input" id="preventReuse" 
                           value="${this.currentPolicies.preventReuse}" min="0" max="20">
                </div>
            </div>

            <div class="policy-group">
                <h4>Expiry Settings</h4>
                <div class="policy-setting">
                    <label>Password Max Age (days):</label>
                    <input type="number" class="policy-input" id="maxAge" 
                           value="${this.currentPolicies.maxAge}" min="30" max="365">
                </div>
                <div class="policy-setting">
                    <label>Warning Days Before Expiry:</label>
                    <input type="number" class="policy-input" id="warningDays" 
                           value="${this.currentPolicies.warningDays}" min="1" max="30">
                </div>
            </div>

            <div class="policy-group">
                <h4>Account Lockout</h4>
                <div class="policy-setting">
                    <label>Failed Attempts Before Lockout:</label>
                    <input type="number" class="policy-input" id="lockoutAttempts" 
                           value="${this.currentPolicies.lockoutAttempts}" min="3" max="10">
                </div>
                <div class="policy-setting">
                    <label>Lockout Duration (minutes):</label>
                    <input type="number" class="policy-input" id="lockoutDuration" 
                           value="${this.currentPolicies.lockoutDuration}" min="5" max="120">
                </div>
            </div>
        `;
    }

    // Save password policies
    savePolicies() {
        const policies = {};
        
        // Collect all policy values
        const inputs = document.querySelectorAll('.policy-input, .policy-checkbox');
        inputs.forEach(input => {
            const key = input.id;
            if (input.type === 'checkbox') {
                policies[key] = input.checked;
            } else if (input.type === 'number') {
                policies[key] = parseInt(input.value);
            } else {
                policies[key] = input.value;
            }
        });

        // Validate policies
        const validation = this.validatePolicies(policies);
        if (!validation.isValid) {
            alert('Policy validation failed: ' + validation.errors.join(', '));
            return;
        }

        // Update password manager
        if (window.passwordManager) {
            window.passwordManager.updatePasswordPolicy(policies);
        }

        // Save to localStorage
        localStorage.setItem('passwordPolicies', JSON.stringify(policies));
        this.currentPolicies = policies;
        
        this.showStatus('Password policies saved successfully!', 'success');
        this.logAdminAction('password_policies_updated', policies);
    }

    // Validate policy configuration
    validatePolicies(policies) {
        const errors = [];
        
        if (policies.minLength > policies.maxLength) {
            errors.push('Minimum length cannot be greater than maximum length');
        }
        
        if (policies.minLength < 8) {
            errors.push('Minimum length should be at least 8 characters');
        }
        
        if (policies.maxAge < policies.warningDays) {
            errors.push('Warning days cannot be greater than password max age');
        }
        
        if (policies.minSpecialChars > policies.minLength) {
            errors.push('Minimum special characters cannot exceed minimum length');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Reset to default policies
    resetToDefaults() {
        if (confirm('Reset all password policies to defaults? This will affect all users.')) {
            // Reset form inputs
            Object.keys(this.defaultPolicies).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = this.defaultPolicies[key];
                    } else {
                        input.value = this.defaultPolicies[key];
                    }
                }
            });

            // Update password manager
            if (window.passwordManager) {
                window.passwordManager.updatePasswordPolicy(this.defaultPolicies);
            }

            // Clear custom policies
            localStorage.removeItem('passwordPolicies');
            this.currentPolicies = { ...this.defaultPolicies };
            
            this.showStatus('Password policies reset to defaults', 'info');
            this.logAdminAction('password_policies_reset');
        }
    }

    // Test password against current policies
    testPassword() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🧪 Test Password Against Policies</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="test-password">Enter Password to Test:</label>
                        <div class="password-input-group">
                            <input type="password" id="test-password" class="form-control" 
                                   placeholder="Enter password to test">
                            <button type="button" class="btn btn-outline btn-sm" 
                                    onclick="passwordPolicyAdmin.generateTestPassword()">
                                Generate
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" 
                                    onclick="passwordPolicyAdmin.toggleTestPasswordVisibility()">
                                <i data-lucide="eye"></i>
                            </button>
                        </div>
                    </div>
                    <div id="test-results" class="test-results"></div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="passwordPolicyAdmin.runPasswordTest()">
                            <i data-lucide="play"></i>
                            Test Password
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('active');
        
        // Auto-test on input
        const testInput = modal.querySelector('#test-password');
        testInput.addEventListener('input', () => {
            this.runPasswordTest();
        });
    }

    // Run password test
    runPasswordTest() {
        const testPassword = document.getElementById('test-password').value;
        const resultsDiv = document.getElementById('test-results');
        
        if (!testPassword) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        if (window.passwordManager) {
            const validation = window.passwordManager.validatePassword(testPassword, {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com'
            });
            
            resultsDiv.innerHTML = `
                <div class="test-result">
                    <div class="strength-display">
                        <div class="strength-bar">
                            <div class="strength-fill strength-${validation.strength.toLowerCase().replace(' ', '-')}" 
                                 style="width: ${validation.score}%"></div>
                        </div>
                        <span class="strength-label">${validation.strength} (${validation.score}/100)</span>
                    </div>
                    
                    ${validation.isValid ? 
                        '<div class="test-success"><i data-lucide="check-circle"></i> Password meets all requirements</div>' :
                        '<div class="test-failed"><i data-lucide="x-circle"></i> Password does not meet requirements</div>'
                    }
                    
                    ${validation.issues.length > 0 ? `
                        <div class="test-issues">
                            <h4>Issues Found:</h4>
                            <ul>
                                ${validation.issues.map(issue => `<li>${issue}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${validation.suggestions.length > 0 ? `
                        <div class="test-suggestions">
                            <h4>Suggestions:</h4>
                            <ul>
                                ${validation.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }

    // Generate test password
    generateTestPassword() {
        if (window.passwordManager) {
            const password = window.passwordManager.generateSecurePassword(16);
            document.getElementById('test-password').value = password;
            this.runPasswordTest();
        }
    }

    // Toggle test password visibility
    toggleTestPasswordVisibility() {
        const input = document.getElementById('test-password');
        const button = input.parentElement.querySelector('button:last-child');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        
        lucide.createIcons();
    }

    // Export policies
    exportPolicies() {
        const config = {
            policies: this.currentPolicies,
            exportDate: new Date().toISOString(),
            exportedBy: localStorage.getItem('currentUser'),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'password-policies.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.logAdminAction('password_policies_exported');
    }

    // Import policies
    importPolicies(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                if (config.policies) {
                    // Validate and apply policies
                    const validation = this.validatePolicies(config.policies);
                    if (validation.isValid) {
                        Object.keys(config.policies).forEach(key => {
                            const input = document.getElementById(key);
                            if (input) {
                                if (input.type === 'checkbox') {
                                    input.checked = config.policies[key];
                                } else {
                                    input.value = config.policies[key];
                                }
                            }
                        });
                        
                        this.showStatus('Policies imported successfully', 'success');
                        this.logAdminAction('password_policies_imported', { source: file.name });
                    } else {
                        this.showStatus('Invalid policy configuration: ' + validation.errors.join(', '), 'error');
                    }
                }
            } catch (error) {
                this.showStatus('Error importing policies: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // Show status message
    showStatus(message, type) {
        const statusDiv = document.getElementById('policy-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
    }

    // Load current policies
    loadCurrentPolicies() {
        try {
            const policies = localStorage.getItem('passwordPolicies');
            if (policies) {
                this.currentPolicies = JSON.parse(policies);
            } else {
                this.currentPolicies = { ...this.defaultPolicies };
            }
        } catch (error) {
            console.error('Error loading password policies:', error);
            this.currentPolicies = { ...this.defaultPolicies };
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
        
        const logs = JSON.parse(localStorage.getItem('passwordPolicyLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 entries
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('passwordPolicyLogs', JSON.stringify(logs));
        console.log('Password policy action logged:', logEntry);
    }

    // Get policy statistics
    getPolicyStatistics() {
        return {
            totalPolicyChanges: JSON.parse(localStorage.getItem('passwordPolicyLogs') || '[]').length,
            currentPolicyVersion: '1.0',
            lastModified: new Date().toISOString(),
            complianceLevel: this.calculateComplianceLevel()
        };
    }

    // Calculate compliance level
    calculateComplianceLevel() {
        let score = 0;
        const policies = this.currentPolicies;
        
        // Length requirements
        if (policies.minLength >= 12) score += 20;
        else if (policies.minLength >= 8) score += 10;
        
        // Character requirements
        if (policies.requireUppercase) score += 15;
        if (policies.requireLowercase) score += 15;
        if (policies.requireNumbers) score += 15;
        if (policies.requireSpecialChars) score += 15;
        
        // Security features
        if (policies.preventCommonPasswords) score += 10;
        if (policies.preventUserInfo) score += 5;
        if (policies.preventReuse > 0) score += 5;
        
        return Math.min(score, 100);
    }
}

// Initialize password policy admin
const passwordPolicyAdmin = new PasswordPolicyAdmin();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.passwordPolicyAdmin = passwordPolicyAdmin;
}