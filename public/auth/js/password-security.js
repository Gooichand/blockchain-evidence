/**
 * Password Security and Strength Management System
 * Enforces strong password policies with complexity requirements
 */

class PasswordSecurityManager {
    constructor() {
        this.policies = {
            minLength: 12,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            minSpecialChars: 2,
            preventCommonPasswords: true,
            preventUserInfo: true,
            preventReuse: 5, // Last 5 passwords
            maxAge: 90, // Days before password change required
            warningDays: 14, // Days before expiry to show warning
            lockoutAttempts: 5,
            lockoutDuration: 30 // Minutes
        };
        
        this.specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        this.commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            'dragon', 'master', 'shadow', 'superman', 'michael',
            'football', 'baseball', 'liverpool', 'jordan', 'harley'
        ];
        
        this.init();
    }

    init() {
        this.loadPasswordHistory();
        this.createPasswordModal();
        this.setupPasswordValidation();
        this.checkPasswordExpiry();
    }

    // Validate password strength
    validatePassword(password, userInfo = {}) {
        const results = {
            isValid: false,
            score: 0,
            strength: 'Very Weak',
            issues: [],
            suggestions: []
        };

        // Length check
        if (password.length < this.policies.minLength) {
            results.issues.push(`Password must be at least ${this.policies.minLength} characters long`);
        } else if (password.length >= this.policies.minLength) {
            results.score += 20;
        }

        if (password.length > this.policies.maxLength) {
            results.issues.push(`Password must not exceed ${this.policies.maxLength} characters`);
        }

        // Character type checks
        if (this.policies.requireUppercase && !/[A-Z]/.test(password)) {
            results.issues.push('Password must contain at least one uppercase letter');
        } else if (/[A-Z]/.test(password)) {
            results.score += 15;
        }

        if (this.policies.requireLowercase && !/[a-z]/.test(password)) {
            results.issues.push('Password must contain at least one lowercase letter');
        } else if (/[a-z]/.test(password)) {
            results.score += 15;
        }

        if (this.policies.requireNumbers && !/[0-9]/.test(password)) {
            results.issues.push('Password must contain at least one number');
        } else if (/[0-9]/.test(password)) {
            results.score += 15;
        }

        if (this.policies.requireSpecialChars) {
            const specialCharRegex = new RegExp(`[${this.escapeRegex(this.specialChars)}]`);
            const specialCharCount = (password.match(specialCharRegex) || []).length;
            
            if (specialCharCount < this.policies.minSpecialChars) {
                results.issues.push(`Password must contain at least ${this.policies.minSpecialChars} special characters`);
            } else {
                results.score += 20;
            }
        }

        // Common password check
        if (this.policies.preventCommonPasswords && this.isCommonPassword(password)) {
            results.issues.push('Password is too common. Please choose a more unique password');
        }

        // User info check
        if (this.policies.preventUserInfo && this.containsUserInfo(password, userInfo)) {
            results.issues.push('Password should not contain personal information');
        }

        // Password reuse check
        if (this.isPasswordReused(password, userInfo.userId)) {
            results.issues.push(`Password cannot be one of your last ${this.policies.preventReuse} passwords`);
        }

        // Additional complexity checks
        results.score += this.calculateComplexityBonus(password);

        // Determine strength
        results.strength = this.getStrengthLabel(results.score);
        results.isValid = results.issues.length === 0 && results.score >= 60;

        // Generate suggestions
        results.suggestions = this.generateSuggestions(password, results.issues);

        return results;
    }

    // Calculate complexity bonus
    calculateComplexityBonus(password) {
        let bonus = 0;
        
        // Length bonus
        if (password.length >= 16) bonus += 10;
        if (password.length >= 20) bonus += 5;
        
        // Character variety bonus
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= password.length * 0.7) bonus += 10;
        
        // Pattern avoidance bonus
        if (!this.hasRepeatingPatterns(password)) bonus += 5;
        if (!this.hasSequentialChars(password)) bonus += 5;
        
        return Math.min(bonus, 15); // Cap bonus at 15 points
    }

    // Check for repeating patterns
    hasRepeatingPatterns(password) {
        // Check for 3+ character repetitions
        for (let i = 0; i <= password.length - 3; i++) {
            const pattern = password.substring(i, i + 3);
            if (password.indexOf(pattern, i + 1) !== -1) {
                return true;
            }
        }
        return false;
    }

    // Check for sequential characters
    hasSequentialChars(password) {
        const sequences = ['abc', '123', 'qwe', 'asd', 'zxc'];
        const lowerPassword = password.toLowerCase();
        
        return sequences.some(seq => {
            return lowerPassword.includes(seq) || lowerPassword.includes(seq.split('').reverse().join(''));
        });
    }

    // Get strength label
    getStrengthLabel(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Strong';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Weak';
        return 'Very Weak';
    }

    // Check if password is common
    isCommonPassword(password) {
        const lowerPassword = password.toLowerCase();
        return this.commonPasswords.some(common => 
            lowerPassword.includes(common) || common.includes(lowerPassword)
        );
    }

    // Check if password contains user info
    containsUserInfo(password, userInfo) {
        if (!userInfo) return false;
        
        const lowerPassword = password.toLowerCase();
        const checkFields = ['firstName', 'lastName', 'email', 'username'];
        
        return checkFields.some(field => {
            if (userInfo[field]) {
                const value = userInfo[field].toLowerCase();
                return lowerPassword.includes(value) || value.includes(lowerPassword);
            }
            return false;
        });
    }

    // Check password reuse
    isPasswordReused(password, userId) {
        if (!userId) return false;
        
        const history = this.getPasswordHistory(userId);
        return history.some(oldPassword => this.comparePasswords(password, oldPassword));
    }

    // Compare passwords (would use proper hashing in production)
    comparePasswords(password1, password2) {
        // In production, this would compare hashed passwords
        return password1 === password2;
    }

    // Generate password suggestions
    generateSuggestions(password, issues) {
        const suggestions = [];
        
        if (issues.some(issue => issue.includes('length'))) {
            suggestions.push('Try using a passphrase with multiple words');
            suggestions.push('Add more characters to meet minimum length requirement');
        }
        
        if (issues.some(issue => issue.includes('uppercase'))) {
            suggestions.push('Add at least one uppercase letter (A-Z)');
        }
        
        if (issues.some(issue => issue.includes('lowercase'))) {
            suggestions.push('Add at least one lowercase letter (a-z)');
        }
        
        if (issues.some(issue => issue.includes('number'))) {
            suggestions.push('Include at least one number (0-9)');
        }
        
        if (issues.some(issue => issue.includes('special'))) {
            suggestions.push(`Add special characters like: ${this.specialChars.substring(0, 10)}...`);
        }
        
        if (issues.some(issue => issue.includes('common'))) {
            suggestions.push('Avoid common passwords and dictionary words');
            suggestions.push('Create a unique combination of words and characters');
        }
        
        if (issues.some(issue => issue.includes('personal'))) {
            suggestions.push('Avoid using your name, email, or other personal information');
        }
        
        return suggestions;
    }

    // Generate secure password
    generateSecurePassword(length = 16) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = this.specialChars;
        
        let password = '';
        
        // Ensure at least one character from each required type
        password += this.getRandomChar(uppercase);
        password += this.getRandomChar(lowercase);
        password += this.getRandomChar(numbers);
        password += this.getRandomChar(special);
        
        // Fill remaining length with random characters
        const allChars = uppercase + lowercase + numbers + special;
        for (let i = password.length; i < length; i++) {
            password += this.getRandomChar(allChars);
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // Get random character from string
    getRandomChar(str) {
        return str.charAt(Math.floor(Math.random() * str.length));
    }

    // Check password expiry
    checkPasswordExpiry() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;
        
        const passwordInfo = this.getPasswordInfo(currentUser);
        if (!passwordInfo) return;
        
        const lastChanged = new Date(passwordInfo.lastChanged);
        const now = new Date();
        const daysSinceChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));
        
        if (daysSinceChange >= this.policies.maxAge) {
            this.showPasswordExpiredModal();
        } else if (daysSinceChange >= (this.policies.maxAge - this.policies.warningDays)) {
            const daysRemaining = this.policies.maxAge - daysSinceChange;
            this.showPasswordExpiryWarning(daysRemaining);
        }
    }

    // Show password expiry warning
    showPasswordExpiryWarning(daysRemaining) {
        const warning = document.createElement('div');
        warning.className = 'password-expiry-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i data-lucide="alert-triangle"></i>
                <span>Your password expires in ${daysRemaining} days. <a href="#" onclick="passwordManager.showChangePasswordModal()">Change now</a></span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(warning);
    }

    // Show password expired modal
    showPasswordExpiredModal() {
        const modal = document.getElementById('password-expired-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    // Create password modals
    createPasswordModal() {
        // Change password modal
        const changeModal = document.createElement('div');
        changeModal.id = 'change-password-modal';
        changeModal.className = 'modal';
        changeModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔐 Change Password</h2>
                    <button class="modal-close" onclick="passwordManager.closeChangePasswordModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="current-password">Current Password</label>
                            <input type="password" id="current-password" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">New Password</label>
                            <div class="password-input-group">
                                <input type="password" id="new-password" class="form-control" required>
                                <button type="button" class="btn btn-outline btn-sm" onclick="passwordManager.generatePassword()">
                                    <i data-lucide="refresh-cw"></i>
                                    Generate
                                </button>
                                <button type="button" class="btn btn-outline btn-sm" onclick="passwordManager.togglePasswordVisibility('new-password')">
                                    <i data-lucide="eye"></i>
                                </button>
                            </div>
                            <div id="password-strength" class="password-strength"></div>
                            <div id="password-requirements" class="password-requirements"></div>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirm New Password</label>
                            <input type="password" id="confirm-password" class="form-control" required>
                            <div id="password-match" class="password-match"></div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="save"></i>
                                Change Password
                            </button>
                            <button type="button" class="btn btn-outline" onclick="passwordManager.closeChangePasswordModal()">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(changeModal);
        
        // Password expired modal
        const expiredModal = document.createElement('div');
        expiredModal.id = 'password-expired-modal';
        expiredModal.className = 'modal';
        expiredModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔒 Password Expired</h2>
                </div>
                <div class="modal-body">
                    <div class="expired-message">
                        <i data-lucide="lock"></i>
                        <p>Your password has expired and must be changed for security reasons.</p>
                        <p>You cannot continue until you set a new password.</p>
                    </div>
                    <button class="btn btn-primary" onclick="passwordManager.showChangePasswordModal(); passwordManager.closeExpiredModal();">
                        <i data-lucide="key"></i>
                        Change Password Now
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(expiredModal);
    }

    // Setup password validation
    setupPasswordValidation() {
        document.addEventListener('DOMContentLoaded', () => {
            const newPasswordInput = document.getElementById('new-password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', () => {
                    this.validatePasswordInput();
                });
            }
            
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', () => {
                    this.validatePasswordMatch();
                });
            }
            
            const changeForm = document.getElementById('change-password-form');
            if (changeForm) {
                changeForm.addEventListener('submit', (e) => {
                    this.handlePasswordChange(e);
                });
            }
        });
    }

    // Validate password input
    validatePasswordInput() {
        const passwordInput = document.getElementById('new-password');
        const strengthDiv = document.getElementById('password-strength');
        const requirementsDiv = document.getElementById('password-requirements');
        
        if (!passwordInput || !strengthDiv || !requirementsDiv) return;
        
        const password = passwordInput.value;
        const currentUser = localStorage.getItem('currentUser');
        const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
        
        const validation = this.validatePassword(password, userData);
        
        // Update strength indicator
        strengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill strength-${validation.strength.toLowerCase().replace(' ', '-')}" 
                     style="width: ${validation.score}%"></div>
            </div>
            <span class="strength-label">${validation.strength} (${validation.score}/100)</span>
        `;
        
        // Update requirements
        if (validation.issues.length > 0) {
            requirementsDiv.innerHTML = `
                <div class="requirements-list">
                    <h4>Requirements:</h4>
                    <ul>
                        ${validation.issues.map(issue => `<li class="requirement-failed">${issue}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            requirementsDiv.innerHTML = `
                <div class="requirements-success">
                    <i data-lucide="check-circle"></i>
                    <span>All requirements met!</span>
                </div>
            `;
        }
        
        // Show suggestions if needed
        if (validation.suggestions.length > 0) {
            requirementsDiv.innerHTML += `
                <div class="password-suggestions">
                    <h4>Suggestions:</h4>
                    <ul>
                        ${validation.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    // Validate password match
    validatePasswordMatch() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const matchDiv = document.getElementById('password-match');
        
        if (!matchDiv) return;
        
        if (confirmPassword === '') {
            matchDiv.innerHTML = '';
            return;
        }
        
        if (newPassword === confirmPassword) {
            matchDiv.innerHTML = `
                <div class="match-success">
                    <i data-lucide="check-circle"></i>
                    <span>Passwords match</span>
                </div>
            `;
        } else {
            matchDiv.innerHTML = `
                <div class="match-failed">
                    <i data-lucide="x-circle"></i>
                    <span>Passwords do not match</span>
                </div>
            `;
        }
    }

    // Handle password change
    async handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate current password
        if (!this.verifyCurrentPassword(currentPassword)) {
            alert('Current password is incorrect');
            return;
        }
        
        // Validate new password
        const currentUser = localStorage.getItem('currentUser');
        const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
        const validation = this.validatePassword(newPassword, userData);
        
        if (!validation.isValid) {
            alert('New password does not meet security requirements');
            return;
        }
        
        // Check password match
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        // Save new password
        this.saveNewPassword(currentUser, newPassword);
        
        alert('Password changed successfully!');
        this.closeChangePasswordModal();
    }

    // Verify current password
    verifyCurrentPassword(password) {
        // In production, this would verify against stored hash
        return true; // Simplified for demo
    }

    // Save new password
    saveNewPassword(userId, password) {
        // Add to password history
        this.addToPasswordHistory(userId, password);
        
        // Update password info
        const passwordInfo = {
            lastChanged: new Date().toISOString(),
            changeCount: (this.getPasswordInfo(userId)?.changeCount || 0) + 1
        };
        
        localStorage.setItem(`passwordInfo_${userId}`, JSON.stringify(passwordInfo));
        
        // In production, would hash and store password securely
        console.log('Password updated for user:', userId);
    }

    // Password history management
    addToPasswordHistory(userId, password) {
        const history = this.getPasswordHistory(userId);
        history.unshift(password); // Add to beginning
        
        // Keep only last N passwords
        if (history.length > this.policies.preventReuse) {
            history.splice(this.policies.preventReuse);
        }
        
        localStorage.setItem(`passwordHistory_${userId}`, JSON.stringify(history));
    }

    getPasswordHistory(userId) {
        try {
            const history = localStorage.getItem(`passwordHistory_${userId}`);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    getPasswordInfo(userId) {
        try {
            const info = localStorage.getItem(`passwordInfo_${userId}`);
            return info ? JSON.parse(info) : null;
        } catch (error) {
            return null;
        }
    }

    loadPasswordHistory() {
        // Load existing password history from storage
        // This would typically be done from a secure backend
    }

    // UI Methods
    showChangePasswordModal() {
        document.getElementById('change-password-modal').classList.add('active');
    }

    closeChangePasswordModal() {
        document.getElementById('change-password-modal').classList.remove('active');
        document.getElementById('change-password-form').reset();
        document.getElementById('password-strength').innerHTML = '';
        document.getElementById('password-requirements').innerHTML = '';
        document.getElementById('password-match').innerHTML = '';
    }

    closeExpiredModal() {
        document.getElementById('password-expired-modal').classList.remove('active');
    }

    generatePassword() {
        const password = this.generateSecurePassword(16);
        document.getElementById('new-password').value = password;
        this.validatePasswordInput();
    }

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling.nextElementSibling;
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

    // Utility methods
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Admin methods
    updatePasswordPolicy(newPolicy) {
        this.policies = { ...this.policies, ...newPolicy };
        localStorage.setItem('passwordPolicy', JSON.stringify(this.policies));
    }

    getPasswordPolicy() {
        return { ...this.policies };
    }

    // Initialize password security for user
    initializePasswordSecurity(userId) {
        // Set initial password info if not exists
        if (!this.getPasswordInfo(userId)) {
            const passwordInfo = {
                lastChanged: new Date().toISOString(),
                changeCount: 1
            };
            localStorage.setItem(`passwordInfo_${userId}`, JSON.stringify(passwordInfo));
        }
        
        // Check expiry
        this.checkPasswordExpiry();
    }
}

// Initialize password manager
const passwordManager = new PasswordSecurityManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.passwordManager = passwordManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordSecurityManager;
}