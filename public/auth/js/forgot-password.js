// Forgot Password System
class ForgotPasswordManager {
    constructor() {
        this.initializeForgotPassword();
    }

    initializeForgotPassword() {
        // Add forgot password link to login forms
        this.addForgotPasswordLinks();
        
        // Handle forgot password form submission
        const forgotForm = document.getElementById('forgotPasswordForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', this.handleForgotPassword.bind(this));
        }

        // Handle reset password form submission
        const resetForm = document.getElementById('resetPasswordForm');
        if (resetForm) {
            resetForm.addEventListener('submit', this.handleResetPassword.bind(this));
        }
    }

    addForgotPasswordLinks() {
        // Add to email login modal
        const emailLoginForm = document.getElementById('emailLoginForm');
        if (emailLoginForm && !emailLoginForm.querySelector('.forgot-password-link')) {
            const forgotLink = document.createElement('div');
            forgotLink.className = 'forgot-password-link';
            forgotLink.innerHTML = `
                <a href="#" onclick="showForgotPasswordModal()" class="text-blue-600 hover:text-blue-800 text-sm">
                    Forgot your password?
                </a>
            `;
            emailLoginForm.appendChild(forgotLink);
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();
        
        const email = document.getElementById('forgotEmail').value;
        const submitBtn = event.target.querySelector('button[type="submit"]');
        
        if (!email) {
            this.showError('Please enter your email address');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Simulate API call (replace with actual endpoint)
            const response = await this.sendResetEmail(email);
            
            if (response.success) {
                this.showSuccess('Password reset email sent! Check your inbox.');
                document.getElementById('forgotPasswordModal').classList.remove('active');
            } else {
                this.showError(response.error || 'Failed to send reset email');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Email';
        }
    }

    async handleResetPassword(event) {
        event.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const token = this.getResetTokenFromURL();
        
        if (!newPassword || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        try {
            const response = await this.resetPassword(token, newPassword);
            
            if (response.success) {
                this.showSuccess('Password reset successful! You can now login.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                this.showError(response.error || 'Failed to reset password');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    async sendResetEmail(email) {
        // Simulate sending reset email
        // In production, this would call your backend API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Check if email exists in localStorage (for demo)
                const userExists = localStorage.getItem('emailUser_' + email);
                if (userExists) {
                    // Generate reset token and store it
                    const resetToken = this.generateResetToken();
                    const resetData = {
                        email: email,
                        token: resetToken,
                        expires: Date.now() + (15 * 60 * 1000) // 15 minutes
                    };
                    localStorage.setItem('resetToken_' + resetToken, JSON.stringify(resetData));
                    
                    // In production, send actual email here
                    console.log(`Reset link: ${window.location.origin}/reset-password.html?token=${resetToken}`);
                    
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: 'Email not found' });
                }
            }, 1000);
        });
    }

    async resetPassword(token, newPassword) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const resetData = localStorage.getItem('resetToken_' + token);
                if (!resetData) {
                    resolve({ success: false, error: 'Invalid or expired reset token' });
                    return;
                }

                const data = JSON.parse(resetData);
                if (Date.now() > data.expires) {
                    localStorage.removeItem('resetToken_' + token);
                    resolve({ success: false, error: 'Reset token has expired' });
                    return;
                }

                // Update user password
                const userData = localStorage.getItem('emailUser_' + data.email);
                if (userData) {
                    const user = JSON.parse(userData);
                    user.password = newPassword;
                    localStorage.setItem('emailUser_' + data.email, JSON.stringify(user));
                    
                    // Remove reset token
                    localStorage.removeItem('resetToken_' + token);
                    
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: 'User not found' });
                }
            }, 1000);
        });
    }

    generateResetToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    getResetTokenFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token');
    }

    showError(message) {
        if (typeof showAlert === 'function') {
            showAlert(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        if (typeof showAlert === 'function') {
            showAlert(message, 'success');
        } else {
            alert(message);
        }
    }
}

// Global functions for modal management
function showForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.add('active');
    document.getElementById('forgotEmail').focus();
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ForgotPasswordManager();
});

// Export for use in other files
window.ForgotPasswordManager = ForgotPasswordManager;