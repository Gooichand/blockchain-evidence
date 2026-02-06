/**
 * Unified Navbar System for EVID-DGC
 * Handles navigation across all dashboard pages
 */

class NavbarManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.renderNavbar();
        this.attachEventListeners();
    }

    async loadUserData() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;

        this.currentUser = currentUser;
        
        try {
            const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUser) || '{}');
            this.userRole = userData.role;
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    renderNavbar() {
        const navbarHTML = `
            <nav class="unified-navbar">
                <div class="navbar-container">
                    <div class="navbar-left">
                        <a href="index.html" class="navbar-brand">
                            <i data-lucide="shield-check"></i>
                            <span>EVID-DGC</span>
                        </a>
                        ${this.renderRoleNavigation()}
                    </div>
                    <div class="navbar-right">
                        ${this.renderUserInfo()}
                        <button class="logout-btn" onclick="navbarManager.logout()">
                            <i data-lucide="log-out"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>
        `;

        // Replace existing navbar
        const existingNav = document.querySelector('nav, .dashboard-nav, .header-nav, .role-nav-header');
        if (existingNav) {
            existingNav.outerHTML = navbarHTML;
        } else {
            // Insert at the beginning of body
            document.body.insertAdjacentHTML('afterbegin', navbarHTML);
        }

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderRoleNavigation() {
        if (!this.userRole) return '';

        const roleNavItems = this.getRoleNavigationItems();
        return `
            <div class="role-nav-items">
                ${roleNavItems.map(item => `
                    <a href="${item.href}" class="nav-item" onclick="navbarManager.navigateTo('${item.href}', event)">
                        <i data-lucide="${item.icon}"></i>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    getRoleNavigationItems() {
        const roleNavigation = {
            'admin': [
                { label: 'Dashboard', icon: 'home', href: 'admin.html' },
                { label: 'Users', icon: 'users', href: 'user-management.html' },
                { label: 'Settings', icon: 'settings', href: 'settings.html' }
            ],
            'investigator': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-investigator.html' },
                { label: 'Cases', icon: 'folder', href: 'cases.html' },
                { label: 'Evidence', icon: 'file-text', href: 'evidence-manager.html' }
            ],
            'forensic_analyst': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-analyst.html' },
                { label: 'Analysis', icon: 'microscope', href: 'analysis.html' },
                { label: 'Reports', icon: 'file-text', href: 'reports.html' }
            ],
            'legal_professional': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-legal.html' },
                { label: 'Cases', icon: 'briefcase', href: 'legal-cases.html' },
                { label: 'Documents', icon: 'file-plus', href: 'legal-docs.html' }
            ],
            'court_official': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-court.html' },
                { label: 'Proceedings', icon: 'gavel', href: 'proceedings.html' },
                { label: 'Schedule', icon: 'calendar', href: 'scheduling.html' }
            ],
            'evidence_manager': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-manager.html' },
                { label: 'Evidence', icon: 'package', href: 'evidence-manager.html' },
                { label: 'Inventory', icon: 'warehouse', href: 'inventory.html' }
            ],
            'auditor': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-auditor.html' },
                { label: 'Audit Trail', icon: 'activity', href: 'audit-trail.html' },
                { label: 'Compliance', icon: 'check-square', href: 'compliance.html' }
            ],
            'public_viewer': [
                { label: 'Dashboard', icon: 'home', href: 'dashboard-public.html' },
                { label: 'Cases', icon: 'folder', href: 'cases-public.html' },
                { label: 'Search', icon: 'search', href: 'search-public.html' }
            ]
        };

        // Handle numeric roles
        const numericRoleMap = {
            1: 'public_viewer',
            2: 'investigator', 
            3: 'forensic_analyst',
            4: 'legal_professional',
            5: 'court_official',
            6: 'evidence_manager',
            7: 'auditor',
            8: 'admin'
        };

        const roleKey = numericRoleMap[this.userRole] || this.userRole;
        return roleNavigation[roleKey] || [];
    }

    renderUserInfo() {
        if (!this.currentUser) return '';

        const roleName = this.getRoleName();
        const displayUser = this.formatUserDisplay();

        return `
            <div class="user-info-display">
                <span class="user-role-badge">${roleName}</span>
                <span class="user-identifier">${displayUser}</span>
            </div>
        `;
    }

    getRoleName() {
        const roleNames = {
            'admin': 'Administrator',
            'investigator': 'Investigator',
            'forensic_analyst': 'Forensic Analyst',
            'legal_professional': 'Legal Professional',
            'court_official': 'Court Official',
            'evidence_manager': 'Evidence Manager',
            'auditor': 'Auditor',
            'public_viewer': 'Public Viewer',
            1: 'Public Viewer',
            2: 'Investigator',
            3: 'Forensic Analyst',
            4: 'Legal Professional',
            5: 'Court Official',
            6: 'Evidence Manager',
            7: 'Auditor',
            8: 'Administrator'
        };

        return roleNames[this.userRole] || 'User';
    }

    formatUserDisplay() {
        if (!this.currentUser) return '';
        
        if (this.currentUser.startsWith('email_')) {
            return 'Email User';
        }
        
        if (this.currentUser.startsWith('0x')) {
            return this.currentUser.slice(0, 6) + '...' + this.currentUser.slice(-4);
        }
        
        return this.currentUser.length > 12 ? this.currentUser.slice(0, 12) + '...' : this.currentUser;
    }

    navigateTo(href, event) {
        // Prevent default link behavior
        if (event) {
            event.preventDefault();
        }
        
        // Navigate in same tab
        window.location.href = href;
    }

    attachEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                const roleNavItems = document.querySelector('.role-nav-items');
                if (roleNavItems) {
                    roleNavItems.classList.toggle('mobile-open');
                }
            });
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    }
}

// Initialize navbar manager
let navbarManager;
document.addEventListener('DOMContentLoaded', () => {
    navbarManager = new NavbarManager();
});

// Add navbar styles
const navbarStyles = `
<style>
.unified-navbar {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-light);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-light);
}

.navbar-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    max-width: 1400px;
    margin: 0 auto;
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 32px;
}

.navbar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--primary-red);
    text-decoration: none;
}

.navbar-brand i {
    width: 28px;
    height: 28px;
}

.role-nav-items {
    display: flex;
    align-items: center;
    gap: 20px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.nav-item:hover {
    color: var(--primary-red);
    background: var(--primary-red-light);
}

.nav-item i {
    width: 16px;
    height: 16px;
}

.navbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-info-display {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-role-badge {
    background: var(--primary-red);
    color: var(--white);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.user-identifier {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: var(--text-muted);
    background: var(--light-gray);
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-light);
}

.logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #dc3545;
    color: var(--white);
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
}

.logout-btn:hover {
    background: #c82333;
    transform: translateY(-1px);
}

.logout-btn i {
    width: 16px;
    height: 16px;
}

.mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
}

@media (max-width: 768px) {
    .navbar-container {
        flex-wrap: wrap;
    }
    
    .navbar-left {
        flex: 1;
        justify-content: space-between;
    }
    
    .role-nav-items {
        display: none;
        width: 100%;
        flex-direction: column;
        gap: 8px;
        padding: 16px 0;
        border-top: 1px solid var(--border-light);
        margin-top: 16px;
    }
    
    .role-nav-items.mobile-open {
        display: flex;
    }
    
    .mobile-menu-toggle {
        display: block;
    }
    
    .user-identifier {
        display: none;
    }
    
    .navbar-right {
        gap: 8px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', navbarStyles);