// Session Management and Rate Limiting System
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.rateLimiter = new Map();
        this.init();
    }

    init() {
        // Clean up expired sessions on page load
        this.cleanupExpiredSessions();
        
        // Set up periodic cleanup
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Every 5 minutes
    }

    createSession(userWallet, deviceInfo = {}) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userWallet,
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                ...deviceInfo
            },
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            ipAddress: 'localhost', // In production, get real IP
            isActive: true
        };
        
        this.sessions.set(sessionId, session);
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('sessionData_' + sessionId, JSON.stringify(session));
        
        return sessionId;
    }

    validateSession(sessionId) {
        if (!sessionId) return false;
        
        const session = this.sessions.get(sessionId) || 
                       JSON.parse(localStorage.getItem('sessionData_' + sessionId) || 'null');
        
        if (!session || !session.isActive) return false;
        
        // Check if session is expired (24 hours)
        const sessionAge = Date.now() - new Date(session.createdAt).getTime();
        if (sessionAge > 24 * 60 * 60 * 1000) {
            this.terminateSession(sessionId);
            return false;
        }
        
        // Update last active
        session.lastActive = new Date().toISOString();
        this.sessions.set(sessionId, session);
        localStorage.setItem('sessionData_' + sessionId, JSON.stringify(session));
        
        return true;
    }

    terminateSession(sessionId) {
        this.sessions.delete(sessionId);
        localStorage.removeItem('sessionData_' + sessionId);
        
        if (localStorage.getItem('sessionId') === sessionId) {
            localStorage.removeItem('sessionId');
        }
    }

    terminateAllUserSessions(userWallet, exceptSessionId = null) {
        // Get all session keys from localStorage
        const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('sessionData_'));
        
        sessionKeys.forEach(key => {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            if (sessionData.userWallet === userWallet && sessionData.id !== exceptSessionId) {
                this.terminateSession(sessionData.id);
            }
        });
    }

    getUserSessions(userWallet) {
        const sessions = [];
        const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('sessionData_'));
        
        sessionKeys.forEach(key => {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            if (sessionData.userWallet === userWallet && sessionData.isActive) {
                sessions.push(sessionData);
            }
        });
        
        return sessions;
    }

    cleanupExpiredSessions() {
        const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('sessionData_'));
        const now = Date.now();
        
        sessionKeys.forEach(key => {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            const sessionAge = now - new Date(sessionData.createdAt || 0).getTime();
            
            if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
                const sessionId = sessionData.id;
                this.terminateSession(sessionId);
            }
        });
    }

    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Rate limiting methods
    checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const attempts = this.rateLimiter.get(identifier) || [];
        
        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => now - time < windowMs);
        
        if (recentAttempts.length >= maxAttempts) {
            return false; // Rate limited
        }
        
        return true; // Allow attempt
    }

    recordAttempt(identifier) {
        const now = Date.now();
        const attempts = this.rateLimiter.get(identifier) || [];
        attempts.push(now);
        this.rateLimiter.set(identifier, attempts);
        
        // Also store in localStorage for persistence
        localStorage.setItem('rateLimit_' + identifier, JSON.stringify(attempts));
    }

    clearAttempts(identifier) {
        this.rateLimiter.delete(identifier);
        localStorage.removeItem('rateLimit_' + identifier);
    }

    loadRateLimitData() {
        // Load rate limit data from localStorage on page load
        const rateLimitKeys = Object.keys(localStorage).filter(key => key.startsWith('rateLimit_'));
        
        rateLimitKeys.forEach(key => {
            const identifier = key.replace('rateLimit_', '');
            const attempts = JSON.parse(localStorage.getItem(key) || '[]');
            this.rateLimiter.set(identifier, attempts);
        });
    }
}

// Enhanced Authentication Handler
class AuthenticationManager {
    constructor() {
        this.sessionManager = new SessionManager();
        this.init();
    }

    init() {
        this.sessionManager.loadRateLimitData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Override existing email login handler
        const emailLoginForm = document.getElementById('emailLoginForm');
        if (emailLoginForm) {
            emailLoginForm.removeEventListener('submit', handleEmailLogin);
            emailLoginForm.addEventListener('submit', this.handleEmailLogin.bind(this));
        }
    }

    async handleEmailLogin(event) {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Check rate limit
        if (!this.sessionManager.checkRateLimit(email)) {
            showAlert('Too many login attempts. Please try again in 15 minutes.', 'error');
            return;
        }
        
        // Record attempt
        this.sessionManager.recordAttempt(email);

        try {
            // Admin login
            if (email.toLowerCase() === 'gc67766@gmail.com' && password === '@Gopichand1@') {
                const adminData = {
                    email: 'Gc67766@gmail.com',
                    fullName: 'System Administrator',
                    role: 8,
                    department: 'Administration',
                    isRegistered: true,
                    walletAddress: '0x29bb7718d5c6da6e787deae8fd6bb3459e8539f2',
                    loginType: 'email',
                    accountType: 'admin'
                };

                this.completeLogin(email, adminData, true);
                return;
            }

            // Regular user login
            const savedUser = localStorage.getItem('emailUser_' + email);
            if (!savedUser) {
                showAlert('Account not found. Please register first.', 'error');
                return;
            }

            const userData = JSON.parse(savedUser);
            if (userData.password !== password) {
                showAlert('Invalid password.', 'error');
                return;
            }

            this.completeLogin(email, userData, false);

        } catch (error) {
            console.error('Login error:', error);
            showAlert('Login failed. Please try again.', 'error');
        }
    }

    completeLogin(email, userData, isAdmin) {
        // Clear rate limit on successful login
        this.sessionManager.clearAttempts(email);

        // Store user data
        localStorage.setItem('emailUser_' + email, JSON.stringify(userData));
        localStorage.setItem('currentUser', 'email_' + email);
        localStorage.setItem('evidUser_email_' + email, JSON.stringify(userData));
        
        // Create session
        const sessionId = this.sessionManager.createSession(
            userData.walletAddress || email,
            { loginType: 'email', userAgent: navigator.userAgent }
        );

        showAlert(isAdmin ? 'Admin login successful!' : 'Login successful!', 'success');

        setTimeout(() => {
            if (isAdmin) {
                displayAdminEmailOptions();
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1500);
    }

    logout() {
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
            this.sessionManager.terminateSession(sessionId);
        }
        
        localStorage.clear();
        window.location.href = '/';
    }

    logoutAllSessions() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const currentSessionId = localStorage.getItem('sessionId');
            this.sessionManager.terminateAllUserSessions(
                currentUser.walletAddress || currentUser.email,
                currentSessionId
            );
        }
    }

    getCurrentUser() {
        const currentUserKey = localStorage.getItem('currentUser');
        if (!currentUserKey) return null;

        return JSON.parse(localStorage.getItem('evidUser_' + currentUserKey) || 'null');
    }

    validateCurrentSession() {
        const sessionId = localStorage.getItem('sessionId');
        return this.sessionManager.validateSession(sessionId);
    }
}

// Initialize authentication manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthenticationManager();
});

// Global functions
function logout() {
    if (window.authManager) {
        window.authManager.logout();
    } else {
        localStorage.clear();
        window.location.href = '/';
    }
}

function logoutAllSessions() {
    if (window.authManager) {
        window.authManager.logoutAllSessions();
    }
}

// Export classes
window.SessionManager = SessionManager;
window.AuthenticationManager = AuthenticationManager;