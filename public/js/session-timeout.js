/**
 * Session Timeout Management System
 * Configurable session timeouts based on user roles
 */

class SessionTimeoutManager {
    constructor() {
        this.timeouts = {
            // Role-based timeout configurations (in minutes)
            'admin': 30,                    // 30 minutes for admin
            'evidence_manager': 45,         // 45 minutes for evidence managers
            'court_official': 60,           // 1 hour for court officials
            'auditor': 90,                  // 1.5 hours for auditors
            'legal_professional': 120,      // 2 hours for legal professionals
            'forensic_analyst': 120,        // 2 hours for analysts
            'investigator': 180,            // 3 hours for investigators
            'public_viewer': 240,           // 4 hours for public viewers
            
            // Numeric role mappings (backward compatibility)
            8: 30,   // admin
            6: 45,   // evidence_manager
            5: 60,   // court_official
            7: 90,   // auditor
            4: 120,  // legal_professional
            3: 120,  // forensic_analyst
            2: 180,  // investigator
            1: 240   // public_viewer
        };
        
        this.warningTime = 5; // Warning 5 minutes before timeout
        this.checkInterval = 60000; // Check every minute
        this.currentTimeout = null;
        this.warningTimeout = null;
        this.intervalId = null;
        this.lastActivity = Date.now();
        this.isWarningShown = false;
        
        this.init();
    }

    init() {
        this.setupActivityListeners();
        this.startSessionMonitoring();
        this.createTimeoutModal();
        this.loadSessionSettings();
    }

    // Get timeout for specific role
    getTimeoutForRole(role) {
        return this.timeouts[role] || 240; // Default 4 hours
    }

    // Start session for user
    startSession(userId, role) {
        this.userId = userId;
        this.userRole = role;
        this.sessionTimeout = this.getTimeoutForRole(role);
        this.lastActivity = Date.now();
        
        // Store session info
        this.saveSessionInfo();
        
        // Set timeout
        this.resetTimeout();
        
        console.log(`Session started for ${role}: ${this.sessionTimeout} minutes`);
    }

    // Reset timeout on activity
    resetTimeout() {
        this.clearTimeouts();
        this.lastActivity = Date.now();
        this.isWarningShown = false;
        
        const timeoutMs = this.sessionTimeout * 60 * 1000;
        const warningMs = (this.sessionTimeout - this.warningTime) * 60 * 1000;
        
        // Set warning timeout
        this.warningTimeout = setTimeout(() => {
            this.showTimeoutWarning();
        }, warningMs);
        
        // Set session timeout
        this.currentTimeout = setTimeout(() => {
            this.handleSessionTimeout();
        }, timeoutMs);
        
        this.updateSessionDisplay();
    }

    // Clear all timeouts
    clearTimeouts() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
            this.warningTimeout = null;
        }
    }

    // Setup activity listeners
    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.recordActivity();
            }, true);
        });
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.recordActivity();
            }
        });
    }

    // Record user activity
    recordActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // Only reset if significant time has passed (prevent excessive resets)
        if (timeSinceLastActivity > 30000) { // 30 seconds
            this.lastActivity = now;
            if (this.userId && this.userRole) {
                this.resetTimeout();
            }
        }
    }

    // Start monitoring session
    startSessionMonitoring() {
        this.intervalId = setInterval(() => {
            this.checkSession();
        }, this.checkInterval);
    }

    // Check session validity
    checkSession() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            this.clearSession();
            return;
        }
        
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        if (!loginTimestamp) {
            this.clearSession();
            return;
        }
        
        const loginTime = new Date(loginTimestamp);
        const now = new Date();
        const sessionAge = (now - loginTime) / (1000 * 60); // minutes
        
        if (sessionAge > this.sessionTimeout) {
            this.handleSessionTimeout();
        }
    }

    // Show timeout warning
    showTimeoutWarning() {
        if (this.isWarningShown) return;
        
        this.isWarningShown = true;
        const modal = document.getElementById('session-timeout-modal');
        const countdown = document.getElementById('timeout-countdown');
        
        let remainingTime = this.warningTime * 60; // seconds
        
        const updateCountdown = () => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            countdown.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (remainingTime <= 0) {
                this.handleSessionTimeout();
                return;
            }
            
            remainingTime--;
            setTimeout(updateCountdown, 1000);
        };
        
        updateCountdown();
        modal.classList.add('active');
    }

    // Handle session timeout
    handleSessionTimeout() {
        this.clearSession();
        this.showTimeoutMessage();
        
        // Redirect to login after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }

    // Clear session
    clearSession() {
        this.clearTimeouts();
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Clear session storage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('sessionInfo');
        
        this.userId = null;
        this.userRole = null;
    }

    // Show timeout message
    showTimeoutMessage() {
        const modal = document.getElementById('session-expired-modal');
        modal.classList.add('active');
    }

    // Extend session
    extendSession() {
        this.recordActivity();
        this.resetTimeout();
        this.closeTimeoutModal();
    }

    // Close timeout modal
    closeTimeoutModal() {
        document.getElementById('session-timeout-modal').classList.remove('active');
        this.isWarningShown = false;
    }

    // Create timeout modals
    createTimeoutModal() {
        // Warning modal
        const warningModal = document.createElement('div');
        warningModal.id = 'session-timeout-modal';
        warningModal.className = 'modal session-modal';
        warningModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⏰ Session Timeout Warning</h2>
                </div>
                <div class="modal-body">
                    <div class="timeout-icon">
                        <i data-lucide="clock"></i>
                    </div>
                    <p>Your session will expire in:</p>
                    <div class="countdown-display">
                        <span id="timeout-countdown">5:00</span>
                    </div>
                    <p>Click "Stay Logged In" to extend your session.</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="sessionManager.extendSession()">
                            <i data-lucide="refresh-cw"></i>
                            Stay Logged In
                        </button>
                        <button class="btn btn-outline" onclick="sessionManager.handleSessionTimeout()">
                            <i data-lucide="log-out"></i>
                            Logout Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(warningModal);
        
        // Expired modal
        const expiredModal = document.createElement('div');
        expiredModal.id = 'session-expired-modal';
        expiredModal.className = 'modal session-modal';
        expiredModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔒 Session Expired</h2>
                </div>
                <div class="modal-body">
                    <div class="expired-icon">
                        <i data-lucide="lock"></i>
                    </div>
                    <p>Your session has expired for security reasons.</p>
                    <p>You will be redirected to the login page.</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="window.location.href='index.html'">
                            <i data-lucide="log-in"></i>
                            Login Again
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(expiredModal);
    }

    // Save session info
    saveSessionInfo() {
        const sessionInfo = {
            userId: this.userId,
            role: this.userRole,
            timeout: this.sessionTimeout,
            startTime: new Date().toISOString(),
            lastActivity: new Date(this.lastActivity).toISOString()
        };
        localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
    }

    // Load session settings
    loadSessionSettings() {
        try {
            const sessionInfo = localStorage.getItem('sessionInfo');
            if (sessionInfo) {
                const info = JSON.parse(sessionInfo);
                this.userId = info.userId;
                this.userRole = info.role;
                this.sessionTimeout = info.timeout;
                this.lastActivity = new Date(info.lastActivity).getTime();
            }
        } catch (error) {
            console.error('Error loading session settings:', error);
        }
    }

    // Update session display
    updateSessionDisplay() {
        const display = document.getElementById('session-info');
        if (display) {
            const remaining = this.getRemainingTime();
            display.innerHTML = `
                <div class="session-status">
                    <span class="session-time">Session: ${remaining}</span>
                    <span class="session-role">${this.getRoleName(this.userRole)}</span>
                </div>
            `;
        }
    }

    // Get remaining session time
    getRemainingTime() {
        if (!this.lastActivity || !this.sessionTimeout) return 'Unknown';
        
        const elapsed = (Date.now() - this.lastActivity) / (1000 * 60); // minutes
        const remaining = Math.max(0, this.sessionTimeout - elapsed);
        
        const hours = Math.floor(remaining / 60);
        const minutes = Math.floor(remaining % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Get role display name
    getRoleName(role) {
        const roleNames = {
            'admin': 'Administrator',
            'evidence_manager': 'Evidence Manager',
            'court_official': 'Court Official',
            'auditor': 'Auditor',
            'legal_professional': 'Legal Professional',
            'forensic_analyst': 'Forensic Analyst',
            'investigator': 'Investigator',
            'public_viewer': 'Public Viewer',
            8: 'Administrator',
            6: 'Evidence Manager',
            5: 'Court Official',
            7: 'Auditor',
            4: 'Legal Professional',
            3: 'Forensic Analyst',
            2: 'Investigator',
            1: 'Public Viewer'
        };
        return roleNames[role] || 'User';
    }

    // Admin functions to configure timeouts
    updateRoleTimeout(role, minutes) {
        this.timeouts[role] = minutes;
        this.saveTimeoutConfig();
    }

    // Save timeout configuration
    saveTimeoutConfig() {
        localStorage.setItem('sessionTimeoutConfig', JSON.stringify(this.timeouts));
    }

    // Load timeout configuration
    loadTimeoutConfig() {
        try {
            const config = localStorage.getItem('sessionTimeoutConfig');
            if (config) {
                this.timeouts = { ...this.timeouts, ...JSON.parse(config) };
            }
        } catch (error) {
            console.error('Error loading timeout config:', error);
        }
    }

    // Get session statistics
    getSessionStats() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return null;
        
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        if (!loginTimestamp) return null;
        
        const loginTime = new Date(loginTimestamp);
        const now = new Date();
        const sessionDuration = (now - loginTime) / (1000 * 60); // minutes
        
        return {
            userId: currentUser,
            role: this.userRole,
            sessionDuration: Math.floor(sessionDuration),
            timeoutLimit: this.sessionTimeout,
            remainingTime: Math.max(0, this.sessionTimeout - sessionDuration),
            lastActivity: new Date(this.lastActivity)
        };
    }

    // Initialize session on login
    initializeSession(userId, userData) {
        this.startSession(userId, userData.role);
        
        // Update login timestamp
        localStorage.setItem('loginTimestamp', new Date().toISOString());
        
        // Show session info
        this.showSessionInfo();
    }

    // Show session information
    showSessionInfo() {
        const timeout = this.getTimeoutForRole(this.userRole);
        const roleName = this.getRoleName(this.userRole);
        
        // Create session info display
        const sessionDisplay = document.createElement('div');
        sessionDisplay.id = 'session-info';
        sessionDisplay.className = 'session-info-display';
        sessionDisplay.innerHTML = `
            <div class="session-details">
                <span class="session-role">${roleName}</span>
                <span class="session-timeout">Timeout: ${timeout} minutes</span>
            </div>
        `;
        
        // Add to navbar if exists
        const navbar = document.querySelector('.unified-navbar .navbar-right');
        if (navbar) {
            navbar.insertBefore(sessionDisplay, navbar.firstChild);
        }
    }
}

// Initialize session manager
const sessionManager = new SessionTimeoutManager();

// Integration with existing login system
if (typeof window !== 'undefined') {
    window.sessionManager = sessionManager;
    
    // Override login function to include session management
    const originalLogin = window.login;
    window.login = function(userAccount, userData) {
        // Start session management
        sessionManager.initializeSession(userAccount, userData);
        
        // Call original login if exists
        if (originalLogin) {
            originalLogin(userAccount, userData);
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionTimeoutManager;
}