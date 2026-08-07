// Role Management Utility
class RoleManager {
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
    }

    getCurrentRole() {
        return localStorage.getItem('selectedRole');
    }

    isRoleSelected() {
        return localStorage.getItem('roleWizardCompleted') === 'true' &&
            localStorage.getItem('selectedRole') !== null;
    }

    getDashboardUrl(role) {
        return this.roleMapping[role] || 'dashboard.html';
    }

    redirectToDashboard(role = null) {
        const selectedRole = role || this.getCurrentRole();
        if (selectedRole) {
            const dashboardUrl = this.getDashboardUrl(selectedRole);
            window.location.href = dashboardUrl;
        } else {
            window.location.href = 'index.html';
        }
    }

    checkRoleAccess(requiredRole = null) {
        const currentRole = this.getCurrentRole();

        if (!this.isRoleSelected()) {
            window.location.href = 'index.html';
            return false;
        }

        if (requiredRole && currentRole !== requiredRole) {
            this.redirectToDashboard();
            return false;
        }

        return true;
    }

    resetRole() {
        localStorage.removeItem('roleWizardCompleted');
        localStorage.removeItem('selectedRole');
        window.location.href = 'index.html';
    }
}

// Global instance
const roleManager = new RoleManager();

// Auto-redirect if on wrong dashboard
document.addEventListener('DOMContentLoaded', function () {
    // Skip check for index page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        return;
    }

    // Check if user has selected a role
    if (!roleManager.isRoleSelected()) {
        window.location.href = 'index.html';
        return;
    }

    // Get current page and expected page
    const currentPage = window.location.pathname.split('/').pop();
    const currentRole = roleManager.getCurrentRole();
    const expectedPage = roleManager.getDashboardUrl(currentRole).split('/').pop();

    // Redirect if on wrong dashboard
    if (currentPage !== expectedPage && currentPage !== 'index.html') {
        roleManager.redirectToDashboard();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoleManager, roleManager };
}