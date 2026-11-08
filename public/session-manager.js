/**
 * Session Management and Rate Limiting System
 * SECURITY FIX: Removed hardcoded admin credentials and bypasses.
 */
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.rateLimiter = new Map();
        this.init();
    }

    init() {
        this.cleanupExpiredSessions();
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    }

    createSession(userWallet, deviceInfo = {}) {
        const sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const session = {
            id: sessionId,
            userWallet,
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                ...deviceInfo
            },
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
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
        
        // Check if session is expired (2 hours)
        const sessionAge = Date.now() - new Date(session.createdAt).getTime();
        if (sessionAge > 2 * 60 * 60 * 1000) {
            this.terminateSession(sessionId);
            return false;
        }
        
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
        const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('sessionData_'));
        sessionKeys.forEach(key => {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            if (sessionData.userWallet === userWallet && sessionData.id !== exceptSessionId) {
                this.terminateSession(sessionData.id);
            }
        });
    }

    cleanupExpiredSessions() {
        const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('sessionData_'));
        const now = Date.now();
        sessionKeys.forEach(key => {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            const sessionAge = now - new Date(sessionData.createdAt || 0).getTime();
            if (sessionAge > 2 * 60 * 60 * 1000) {
                this.terminateSession(sessionData.id);
            }
        });
    }

    checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const attempts = this.rateLimiter.get(identifier) || [];
        const recentAttempts = attempts.filter(time => now - time < windowMs);
        return recentAttempts.length < maxAttempts;
    }

    recordAttempt(identifier) {
        const now = Date.now();
        const attempts = this.rateLimiter.get(identifier) || [];
        attempts.push(now);
        this.rateLimiter.set(identifier, attempts);
        localStorage.setItem('rateLimit_' + identifier, JSON.stringify(attempts));
    }

    clearAttempts(identifier) {
        this.rateLimiter.delete(identifier);
        localStorage.removeItem('rateLimit_' + identifier);
    }

    loadRateLimitData() {
        const rateLimitKeys = Object.keys(localStorage).filter(key => key.startsWith('rateLimit_'));
        rateLimitKeys.forEach(key => {
            const identifier = key.replace('rateLimit_', '');
            const attempts = JSON.parse(localStorage.getItem(key) || '[]');
            this.rateLimiter.set(identifier, attempts);
        });
    }
}

class AuthenticationManager {
    constructor() {
        this.sessionManager = new SessionManager();
        this.init();
    }

    init() {
        this.sessionManager.loadRateLimitData();
    }

    async handleEmailLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!this.sessionManager.checkRateLimit(email)) {
            window.showNotification('Throttled', 'Too many attempts. Try again later.', 'error');
            return;
        }
        
        this.sessionManager.recordAttempt(email);

        try {
            // SECURITY FIX: Replaced local password check with server-side validation
            const response = await window.apiClient.post('/auth/email/login', { email, password });
            
            if (response.success) {
                this.completeLogin(email, response.user, response.user.role === 'admin');
            }
        } catch (error) {
            console.error('Login error:', error);
            window.showNotification('Login Failed', error.message, 'error');
        }
    }

    completeLogin(email, userData, isAdmin) {
        this.sessionManager.clearAttempts(email);
        const storageKey = (userData.wallet_address || userData.walletAddress || email).toLowerCase();
        const userToStore = {
          ...userData,
          walletAddress: storageKey,
          wallet_address: storageKey,
        };
        localStorage.setItem('currentUser', storageKey);
        localStorage.setItem('evidUser_' + storageKey, JSON.stringify(userToStore));
        localStorage.setItem('evidUser_' + email.toLowerCase(), JSON.stringify(userToStore));
        
        const sessionId = this.sessionManager.createSession(
            storageKey,
            { loginType: 'email' }
        );

        window.showNotification('Success', 'Login successful!', 'success');

        setTimeout(() => {
            window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
        }, 1000);
    }

    logout() {
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) this.sessionManager.terminateSession(sessionId);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionId');
        window.location.href = '/';
    }
}

window.authManager = new AuthenticationManager();
window.logout = () => window.authManager.logout();
/**
 * Idle timeout: signs the user out after 30 minutes without activity,
 * with a warning at 25 minutes. Activity is shared across tabs through
 * localStorage so work in any tab keeps the session alive.
 */
class IdleTimeoutManager {
    constructor() {
        this.warnAfterMs = 25 * 60 * 1000;
        this.logoutAfterMs = 30 * 60 * 1000;
        this.storageKey = 'evidLastActivity';
        this.warned = false;
        this.lastWrite = 0;
        this.checkTimer = null;
        this.activityHandler = this.recordActivity.bind(this);
        this.init();
    }

    init() {
        ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach((evt) => {
            window.addEventListener(evt, this.activityHandler, { passive: true });
        });
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey) this.warned = false;
        });
        this.recordActivity();
        this.checkTimer = setInterval(() => this.check(), 30 * 1000);
    }

    isSignedIn() {
        return Boolean(localStorage.getItem('authToken'));
    }

    recordActivity() {
        const now = Date.now();
        // Throttle writes to once every 5 seconds.
        if (now - this.lastWrite < 5000) return;
        this.lastWrite = now;
        this.warned = false;
        localStorage.setItem(this.storageKey, String(now));
    }

    lastActivity() {
        const raw = Number(localStorage.getItem(this.storageKey) || 0);
        return Number.isFinite(raw) && raw > 0 ? raw : Date.now();
    }

    check() {
        if (!this.isSignedIn()) return;
        const idleFor = Date.now() - this.lastActivity();

        if (idleFor >= this.logoutAfterMs) {
            this.logoutForInactivity();
            return;
        }

        if (idleFor >= this.warnAfterMs && !this.warned) {
            this.warned = true;
            const minutesLeft = Math.max(1, Math.ceil((this.logoutAfterMs - idleFor) / 60000));
            const message = `You have been inactive for a while. You will be signed out in about ${minutesLeft} minute(s) for security.`;
            if (typeof window.showAlert === 'function') {
                window.showAlert(message, 'warning');
            } else if (typeof window.showNotification === 'function') {
                window.showNotification('Session expiring', message, 'warning');
            }
        }
    }

    logoutForInactivity() {
        clearInterval(this.checkTimer);
        if (typeof window.apiClient !== 'undefined') {
            window.apiClient.post('/auth/logout', {}).catch(() => {});
        }
        localStorage.clear();
        const notice = 'You were signed out due to inactivity.';
        try { sessionStorage.setItem('evidSignOutNotice', notice); } catch (_) {}
        window.location.href = '/?auth=idle';
    }
}

window.idleTimeoutManager = new IdleTimeoutManager();
