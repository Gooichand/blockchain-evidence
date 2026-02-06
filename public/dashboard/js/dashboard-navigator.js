// Dashboard Navigation System - Comprehensive Fix
class DashboardNavigator {
    constructor() {
        this.roleMapping = {
            'public_viewer': 'dashboard-public.html',
            'investigator': 'dashboard-investigator.html',
            'forensic_analyst': 'dashboard-analyst.html',
            'legal_professional': 'dashboard-legal.html',
            'court_official': 'dashboard-court.html',
            'evidence_manager': 'dashboard-manager.html',
            'auditor': 'dashboard-auditor.html',
            'admin': 'admin.html'
        };
        
        this.roleNames = {
            'public_viewer': 'Public Viewer',
            'investigator': 'Investigator',
            'forensic_analyst': 'Forensic Analyst',
            'legal_professional': 'Legal Professional',
            'court_official': 'Court Official',
            'evidence_manager': 'Evidence Manager',
            'auditor': 'Auditor',
            'admin': 'Administrator'
        };
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
    }

    checkAuthentication() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Skip check for index page
        if (currentPage === 'index.html' || currentPage === '') {
            return;
        }

        const selectedRole = localStorage.getItem('selectedRole');
        const roleCompleted = localStorage.getItem('roleWizardCompleted');
        
        console.log('Dashboard Navigator - Current page:', currentPage);
        console.log('Dashboard Navigator - Selected role:', selectedRole);
        console.log('Dashboard Navigator - Role completed:', roleCompleted);

        // If no role selected, redirect to index
        if (!selectedRole || roleCompleted !== 'true') {
            console.log('No role selected, redirecting to index');
            window.location.href = 'index.html';
            return;
        }

        // Check if user is on correct dashboard
        const expectedPage = this.roleMapping[selectedRole];
        if (currentPage !== expectedPage) {
            console.log(`Wrong dashboard. Expected: ${expectedPage}, Current: ${currentPage}`);
            window.location.href = expectedPage;
            return;
        }

        // Update UI with user info
        this.updateUserInterface(selectedRole);
    }

    updateUserInterface(role) {
        // Update navbar user info
        const userRoleEl = document.getElementById('userRole');
        const userWalletEl = document.getElementById('userWallet');
        const currentUser = localStorage.getItem('currentUser');

        if (userRoleEl) {
            userRoleEl.textContent = this.roleNames[role] || 'User';
        }

        if (userWalletEl && currentUser) {
            userWalletEl.textContent = this.truncateWallet(currentUser);
        }

        // Update page title
        document.title = `${this.roleNames[role]} Dashboard | EVID-DGC`;
    }

    truncateWallet(address) {
        if (!address || address.length < 10) return '0x****...****';
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Role change button (if exists)
        const changeRoleBtn = document.getElementById('changeRoleBtn');
        if (changeRoleBtn) {
            changeRoleBtn.addEventListener('click', this.changeRole.bind(this));
        }
    }

    logout() {
        // Clear all user data
        localStorage.removeItem('selectedRole');
        localStorage.removeItem('roleWizardCompleted');
        localStorage.removeItem('roleSelectedAt');
        localStorage.removeItem('currentUser');
        
        // Clear all user-specific data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('evidUser_') || key.startsWith('emailUser_')) {
                localStorage.removeItem(key);
            }
        });

        // Redirect to index
        window.location.href = 'index.html';
    }

    changeRole() {
        // Reset role selection
        localStorage.removeItem('selectedRole');
        localStorage.removeItem('roleWizardCompleted');
        localStorage.removeItem('roleSelectedAt');
        
        // Redirect to index for new role selection
        window.location.href = 'index.html';
    }

    redirectToDashboard(role = null) {
        const selectedRole = role || localStorage.getItem('selectedRole');
        if (selectedRole && this.roleMapping[selectedRole]) {
            window.location.href = this.roleMapping[selectedRole];
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Initialize dashboard navigator
const dashboardNavigator = new DashboardNavigator();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    dashboardNavigator.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Re-check authentication when page becomes visible
        dashboardNavigator.checkAuthentication();
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', function() {
    dashboardNavigator.checkAuthentication();
});

// Export for global use
window.DashboardNavigator = DashboardNavigator;
window.dashboardNavigator = dashboardNavigator;