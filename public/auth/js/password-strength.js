/**
 * Password Strength Indicator
 * Real-time password validation and strength meter
 */

class PasswordStrength {
    constructor(passwordFieldId, strengthContainerId) {
        this.passwordField = document.getElementById(passwordFieldId);
        this.strengthContainer = document.getElementById(strengthContainerId);
        this.init();
    }

    init() {
        if (!this.passwordField) return;

        this.passwordField.addEventListener('input', (e) => {
            this.checkStrength(e.target.value);
        });

        this.passwordField.addEventListener('focus', () => {
            this.showRequirements();
        });

        this.passwordField.addEventListener('blur', () => {
            this.hideRequirements();
        });
    }

    checkStrength(password) {
        const strength = this.calculateStrength(password);
        this.updateUI(strength, password);
    }

    calculateStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password),
            noCommon: !this.isCommonPassword(password)
        };

        // Calculate score
        Object.values(checks).forEach(check => {
            if (check) score++;
        });

        // Bonus for length
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        return {
            score: Math.min(score, 5),
            checks,
            level: this.getStrengthLevel(score)
        };
    }

    getStrengthLevel(score) {
        if (score <= 2) return 'weak';
        if (score <= 3) return 'fair';
        if (score <= 4) return 'good';
        return 'strong';
    }

    updateUI(strength, password) {
        if (!this.strengthContainer) return;

        const { score, level, checks } = strength;
        const percentage = (score / 5) * 100;

        // Update strength meter
        const meter = this.strengthContainer.querySelector('.strength-fill');
        const text = this.strengthContainer.querySelector('.strength-text');

        if (meter) {
            meter.style.width = `${percentage}%`;
            meter.className = `strength-fill strength-${level}`;
        }

        if (text) {
            if (password.length === 0) {
                text.textContent = 'Password strength';
                text.className = 'strength-text';
            } else {
                text.textContent = `${level.charAt(0).toUpperCase() + level.slice(1)} password`;
                text.className = `strength-text strength-${level}`;
            }
        }

        // Update requirements
        this.updateRequirements(checks);
    }

    updateRequirements(checks) {
        const requirements = this.strengthContainer?.querySelector('.password-requirements');
        if (!requirements) return;

        const items = requirements.querySelectorAll('.requirement-item');
        items.forEach(item => {
            const requirement = item.dataset.requirement;
            const icon = item.querySelector('i');
            
            if (checks[requirement]) {
                item.classList.add('met');
                item.classList.remove('unmet');
                if (icon) {
                    icon.setAttribute('data-lucide', 'check');
                }
            } else {
                item.classList.add('unmet');
                item.classList.remove('met');
                if (icon) {
                    icon.setAttribute('data-lucide', 'x');
                }
            }
        });

        // Refresh Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    showRequirements() {
        const requirements = this.strengthContainer?.querySelector('.password-requirements');
        if (requirements) {
            requirements.style.display = 'block';
        }
    }

    hideRequirements() {
        const requirements = this.strengthContainer?.querySelector('.password-requirements');
        if (requirements && this.passwordField.value.length === 0) {
            requirements.style.display = 'none';
        }
    }

    isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            '1234567890', 'password1', '123123', 'qwerty123'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }

    static createRequirementsHTML() {
        return `
            <div class="password-requirements" style="display: none;">
                <div class="requirement-item" data-requirement="length">
                    <i data-lucide="x"></i>
                    <span>At least 8 characters</span>
                </div>
                <div class="requirement-item" data-requirement="lowercase">
                    <i data-lucide="x"></i>
                    <span>One lowercase letter</span>
                </div>
                <div class="requirement-item" data-requirement="uppercase">
                    <i data-lucide="x"></i>
                    <span>One uppercase letter</span>
                </div>
                <div class="requirement-item" data-requirement="numbers">
                    <i data-lucide="x"></i>
                    <span>One number</span>
                </div>
                <div class="requirement-item" data-requirement="symbols">
                    <i data-lucide="x"></i>
                    <span>One special character</span>
                </div>
                <div class="requirement-item" data-requirement="noCommon">
                    <i data-lucide="x"></i>
                    <span>Not a common password</span>
                </div>
            </div>
        `;
    }
}

// Initialize password strength indicators when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Registration form password
    const regPasswordField = document.getElementById('regPassword');
    if (regPasswordField) {
        const strengthContainer = regPasswordField.parentNode.querySelector('.password-strength');
        if (strengthContainer && !strengthContainer.querySelector('.password-requirements')) {
            strengthContainer.insertAdjacentHTML('beforeend', PasswordStrength.createRequirementsHTML());
        }
        new PasswordStrength('regPassword', 'regPasswordStrength');
    }

    // Login form password (if needed)
    const loginPasswordField = document.getElementById('loginPassword');
    if (loginPasswordField) {
        // Add basic validation for login
        loginPasswordField.addEventListener('input', function() {
            const value = this.value;
            if (value.length > 0 && value.length < 6) {
                this.setCustomValidity('Password must be at least 6 characters');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PasswordStrength = PasswordStrength;
}