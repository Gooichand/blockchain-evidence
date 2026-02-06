/**
 * 2FA Login Integration
 * Integrates 2FA with existing login system
 */

// Enhanced login function with 2FA support
async function enhancedLogin(userAccount, userData) {
    try {
        // Check if user role requires 2FA
        if (window.twoFactorAuth && window.twoFactorAuth.requiresVerification(userAccount, userData.role)) {
            // Show 2FA verification modal
            await window.twoFactorAuth.showVerificationModal();
        }
        
        // Proceed with normal login
        localStorage.setItem('currentUser', userAccount);
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('2FA verification failed:', error);
        alert('Two-factor authentication failed. Please try again.');
    }
}

// Override existing login functions
if (typeof window !== 'undefined') {
    // Store original login function
    window.originalLogin = window.login || function() {};
    
    // Enhanced login with 2FA
    window.login = function(userAccount, userData) {
        if (userData) {
            enhancedLogin(userAccount, userData);
        } else {
            // Fallback to original login
            window.originalLogin(userAccount, userData);
        }
    };
}

// Add 2FA setup prompt for sensitive roles
function checkAndPrompt2FASetup() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || !window.twoFactorAuth) return;
    
    const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
    
    // Check if user has sensitive role but no 2FA
    if (window.twoFactorAuth.requiresTwoFactor(userData.role) && 
        !window.twoFactorAuth.is2FAEnabled(currentUser)) {
        
        // Show setup prompt after 3 seconds
        setTimeout(() => {
            if (confirm('Your role requires enhanced security. Would you like to set up Two-Factor Authentication now?')) {
                window.twoFactorAuth.showSetupModal();
            }
        }, 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load 2FA system
    if (window.twoFactorAuth) {
        checkAndPrompt2FASetup();
    }
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        enhancedLogin,
        checkAndPrompt2FASetup
    };
}