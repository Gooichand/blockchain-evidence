class HeaderManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadStyles();
        this.render();
        this.attachEventListeners();
    }

    loadStyles() {
        if (!document.querySelector('link[href="header.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'header.css';
            document.head.appendChild(link);
        }
    }

    render() {
        if (document.querySelector('.dock-nav')) return;

        const headerHTML = `
        <header class="dock-nav">
            <div class="dock-container">
                <a href="index.html" class="dock-brand">
                    <img src="logo-32x32.png" alt="EVID-DGC" class="dock-brand-logo">
                    <span class="dock-brand-text">EVID-DGC</span>
                </a>

                <button class="dock-menu-toggle" id="dockMenuToggle" aria-label="Toggle navigation">
                    <i data-lucide="menu"></i>
                </button>

                <nav class="dock-nav-items" id="dockNavItems">
                    <a href="index.html" class="dock-link">
                        <i data-lucide="home"></i>
                        <span>Home</span>
                    </a>
                    <a href="index.html#how-it-works" class="dock-link">
                        <i data-lucide="workflow"></i>
                        <span>How It Works</span>
                    </a>
                    <a href="index.html#documentation" class="dock-link">
                        <i data-lucide="book-open"></i>
                        <span>Documentation</span>
                    </a>
                    <a href="index.html#faq" class="dock-link">
                        <i data-lucide="help-circle"></i>
                        <span>Q&A</span>
                    </a>
                    <a href="index.html#career" class="dock-link">
                        <i data-lucide="briefcase"></i>
                        <span>Career</span>
                    </a>
                    <a href="index.html#contact" class="dock-link">
                        <i data-lucide="phone"></i>
                        <span>Contacts</span>
                    </a>
                    <a href="index.html#login-options" class="dock-login-btn">
                        <i data-lucide="log-in"></i>
                        <span>Login</span>
                    </a>
                </nav>
            </div>
        </header>
        <noscript>
            <div style="padding: 1rem; text-align: center; background: #fff3f3; color: #d32f2f; font-weight: bold;">
                JavaScript is required for the full experience. <a href="index.html">View Site Map</a>
            </div>
        </noscript>
        `;

        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.outerHTML = headerHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }

        this.updateIcons();
    }

    updateIcons() {
        if (typeof lucide !== 'undefined') {
            try {
                lucide.createIcons();
            } catch (err) {
                console.warn('Lucide icon creation failed:', err);
            }
        } else {
            console.warn('Lucide icons not loaded');
        }
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('dockMenuToggle');
        const navMenu = document.getElementById('dockNavItems');

        if (toggleBtn && navMenu) {
            if (toggleBtn.dataset.menuListenersAttached === 'true') return;
            toggleBtn.dataset.menuListenersAttached = 'true';

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navMenu.classList.toggle('mobile-open');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', navMenu.classList.contains('mobile-open') ? 'x' : 'menu');
                    this.updateIcons();
                }
            });

            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('mobile-open') && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
                    navMenu.classList.remove('mobile-open');
                    const icon = toggleBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'menu');
                        this.updateIcons();
                    }
                }
            });

            navMenu.querySelectorAll('.dock-link, .dock-login-btn').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('mobile-open');
                    const icon = toggleBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'menu');
                        this.updateIcons();
                    }
                });
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.headerManager = new HeaderManager();
});
