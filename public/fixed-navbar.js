/**
 * Fixed Unified Navbar System for EVID-DGC
 * Resolves display issues across all dashboard pages
 */

class FixedNavbarManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.injectStyles();
        this.renderNavbar();
        this.highlightCurrent();
        this.attachEventListeners();
    }

    async loadUserData() {
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) return;

        try {
            if (currentUserData.startsWith('{')) {
                const parsed = JSON.parse(currentUserData);
                const user = parsed.user;

                if (parsed.type === 'email') {
                    this.currentUser = user.full_name || user.fullName || user.email;
                } else {
                    this.currentUser = user.walletAddress || user.wallet_address || user.address;
                }

                this.userRole = user.role;
            } else {
                // Legacy format
                this.currentUser = currentUserData;
                const userData = JSON.parse(localStorage.getItem('evidUser_' + currentUserData) || '{}');
                this.userRole = userData.role;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback
            this.currentUser = currentUserData;
        }
    }

    injectStyles() {
        // Remove existing navbar styles
        const existingStyles = document.querySelectorAll('style[data-navbar-styles]');
        existingStyles.forEach(style => style.remove());

        const navbarStyles = `
        <style data-navbar-styles>
        :root {
            --primary-red: #dc2626;
            --primary-red-light: rgba(220, 38, 38, 0.08);
            --text-secondary: #4b5563;
            --text-muted: #9ca3af;
            --white: #ffffff;
            --light-gray: #f9fafb;
            --border-light: rgba(229, 231, 235, 0.8);
            --shadow-light: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .fixed-navbar {
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(20px) saturate(1.8);
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            border-bottom: 1px solid rgba(229, 231, 235, 0.8);
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06), inset 0 -1px 0 rgba(255, 255, 255, 0.7);
            width: 100%;
            transition: all 0.3s ease;
        }

        .navbar-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 28px;
            max-width: 1400px;
            margin: 0 auto;
            min-height: 64px;
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
            font-size: 1.45rem;
            font-weight: 800;
            color: #dc2626;
            text-decoration: none;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .navbar-brand:hover {
            color: #b91c1c;
            text-decoration: none;
            transform: scale(1.02);
        }

        .navbar-brand i {
            width: 28px;
            height: 28px;
        }

        .role-nav-items {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4b5563;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.92rem;
            padding: 8px 16px;
            border-radius: 10px;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid transparent;
        }

        .nav-item:hover {
            color: #dc2626;
            background: rgba(220, 38, 38, 0.06);
            border-color: rgba(220, 38, 38, 0.15);
            text-decoration: none;
            transform: translateY(-1px);
        }

        .nav-item.active {
            color: #dc2626;
            background: rgba(220, 38, 38, 0.08);
            border-color: rgba(220, 38, 38, 0.22);
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
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: #ffffff;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        }

        .user-identifier {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 0.82rem;
            font-weight: 600;
            color: #4b5563;
            background: rgba(243, 244, 246, 0.8);
            padding: 6px 12px;
            border-radius: 8px;
            border: 1px solid rgba(229, 231, 235, 0.9);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .logout-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(220, 38, 38, 0.08);
            color: #dc2626;
            border: 1px solid rgba(220, 38, 38, 0.2);
            padding: 8px 16px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: inherit;
        }

        .logout-btn:hover {
            background: #dc2626;
            color: #ffffff;
            border-color: #dc2626;
            box-shadow: 0 6px 18px rgba(220, 38, 38, 0.3);
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
            color: #4b5563;
        }

        .mobile-menu-toggle:hover {
            color: #dc2626;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .navbar-container {
                flex-wrap: wrap;
                padding: 12px 16px;
            }
            
            .navbar-left {
                flex: 1;
                justify-content: space-between;
                gap: 16px;
            }
            
            .role-nav-items {
                display: none;
                width: 100%;
                flex-direction: column;
                gap: 8px;
                padding: 16px 0;
                border-top: 1px solid #e5e7eb;
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

            .user-role-badge {
                font-size: 0.7rem;
                padding: 4px 8px;
            }
        }

        /* Fix for negative margin issues */
        body {
            margin: 0;
            padding: 0;
        }

        .fixed-navbar + * {
            margin-top: 0 !important;
        }

        /* Ensure proper spacing after navbar */
        .container {
            margin-top: 0;
        }

        /* Fix hero sections that might have negative margins */
        .analyst-hero,
        .auditor-hero,
        .court-hero,
        .investigator-hero,
        .legal-hero,
        .manager-hero,
        .public-hero {
            margin-top: 0 !important;
        }
        </style>
        `;

        document.head.insertAdjacentHTML('beforeend', navbarStyles);
    }

    renderNavbar() {
        // Never stack a second app navbar (e.g. after SPA view swaps).
        if (document.getElementById('appNavbar')) return;

        const navbarHTML = `
            <nav class="fixed-navbar" id="appNavbar">
                <div class="navbar-container">
                    <div class="navbar-left">
                        <a href="index.html" class="navbar-brand">
                            <i data-lucide="shield-check"></i>
                            <span>EVID-DGC</span>
                        </a>
                        <button class="mobile-menu-toggle" onclick="fixedNavbarManager.toggleMobileMenu()">
                            <i data-lucide="menu"></i>
                        </button>
                        ${this.renderRoleNavigation()}
                    </div>
                    <div class="navbar-right">
                        ${this.renderUserInfo()}
                        <button class="logout-btn" onclick="fixedNavbarManager.logout()">
                            <i data-lucide="log-out"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>
        `;

        // Remove existing navbars (keep page-specific nav elements like the analyst tab bar)
        const existingNavs = document.querySelectorAll('nav:not(.analyst-tabs), .dashboard-nav, .header-nav, .role-nav-header, .unified-navbar');
        existingNavs.forEach(nav => nav.remove());

        // Insert at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);

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
                    <a href="${item.href}" class="nav-item" onclick="fixedNavbarManager.navigateTo('${item.href}', event)">
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
                { label: 'Queue', icon: 'inbox', href: 'dashboard-analyst.html#queue' },
                { label: 'Tools', icon: 'microscope', href: 'dashboard-analyst.html#tools' },
                { label: 'Reports', icon: 'file-text', href: 'dashboard-analyst.html#reports' }
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
            ],
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
            'admin': 'Admin',
            'investigator': 'Investigator',
            'forensic_analyst': 'Analyst',
            'legal_professional': 'Legal',
            'court_official': 'Court',
            'evidence_manager': 'Manager',
            'auditor': 'Auditor',
            'public_viewer': 'Public',
            1: 'Public',
            2: 'Investigator',
            3: 'Analyst',
            4: 'Legal',
            5: 'Court',
            6: 'Manager',
            7: 'Auditor',
            8: 'Admin'
        };

        return roleNames[this.userRole] || 'User';
    }

    formatUserDisplay() {
        if (!this.currentUser) return '';

        // If it looks like a wallet address
        if (this.currentUser.startsWith('0x')) {
            return this.currentUser.slice(0, 6) + '...' + this.currentUser.slice(-4);
        }

        // For email/names, return truncated if too long, otherwise full
        return this.currentUser.length > 15 ? this.currentUser.slice(0, 15) + '...' : this.currentUser;
    }

    navigateTo(href, event) {
        // Prevent default link behavior
        if (event) {
            event.preventDefault();
        }

        // Single-navbar UX: analyst workstation views switch in place via the SPA.
        if (href.startsWith('dashboard-analyst.html') && window.analystDashboard && window.analystDashboard.showView) {
            const idx = href.indexOf('#');
            const view = idx !== -1 ? href.slice(idx + 1) : 'dashboard';
            if (['dashboard', 'queue', 'tools', 'reports'].includes(view)) {
                window.analystDashboard.showView(view);
                this.markActiveNav(href);
                return;
            }
        }

        // Navigate in same tab
        window.location.href = href;
    }

    markActiveNav(href) {
        const items = document.querySelectorAll('.role-nav-items .nav-item');
        items.forEach((item) => {
            item.classList.toggle('active', item.getAttribute('href') === href);
        });
    }

    highlightCurrent() {
        const hash = (window.location.hash || '').replace('#', '') || 'dashboard';
        const items = document.querySelectorAll('.role-nav-items .nav-item');
        items.forEach((item) => {
            const href = item.getAttribute('href') || '';
            if (!href.startsWith('dashboard-analyst.html')) return;
            const expected = 'dashboard-analyst.html' + (hash === 'dashboard' ? '' : '#' + hash);
            item.classList.toggle('active', href === expected);
        });
    }

    toggleMobileMenu() {
        const roleNavItems = document.querySelector('.role-nav-items');
        const toggleBtn = document.querySelector('.mobile-menu-toggle i');

        if (roleNavItems) {
            roleNavItems.classList.toggle('mobile-open');

            // Update toggle icon
            if (roleNavItems.classList.contains('mobile-open')) {
                toggleBtn.setAttribute('data-lucide', 'x');
            } else {
                toggleBtn.setAttribute('data-lucide', 'menu');
            }

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    attachEventListeners() {
        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            const navbar = document.querySelector('.fixed-navbar');
            const roleNavItems = document.querySelector('.role-nav-items');

            if (navbar && !navbar.contains(event.target) && roleNavItems) {
                roleNavItems.classList.remove('mobile-open');
                const toggleBtn = document.querySelector('.mobile-menu-toggle i');
                if (toggleBtn) {
                    toggleBtn.setAttribute('data-lucide', 'menu');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        });
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    }
}

// Initialize fixed navbar manager
let fixedNavbarManager;
document.addEventListener('DOMContentLoaded', () => {
    fixedNavbarManager = new FixedNavbarManager();
});

// Backward compatibility
window.navbarManager = {
    logout: () => fixedNavbarManager?.logout(),
    navigateTo: (href, event) => fixedNavbarManager?.navigateTo(href, event)
};