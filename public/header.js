class HeaderManager {
    constructor() {
        this.activeSection = null;
        this.sectionMap = [];
        this.observer = null;
        this.observedSections = [];
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.programmaticScroll = false;
        this.init();
    }

    init() {
        this.loadStyles();
        this.render();
        this.attachEventListeners();
        this.initScrollSpy();
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
                    <div class="dock-indicator" id="dockIndicator"></div>
                    <a href="index.html#home" class="dock-link" data-section="home">
                        <i data-lucide="home"></i>
                        <span>Home</span>
                    </a>
                    <a href="index.html#how-it-works" class="dock-link" data-section="how-it-works">
                        <i data-lucide="workflow"></i>
                        <span>How It Works</span>
                    </a>
                    <a href="index.html#documentation" class="dock-link" data-section="documentation">
                        <i data-lucide="book-open"></i>
                        <span>Documentation</span>
                    </a>
                    <a href="index.html#faq" class="dock-link" data-section="faq">
                        <i data-lucide="help-circle"></i>
                        <span>Q&A</span>
                    </a>
                    <a href="index.html#career" class="dock-link" data-section="career">
                        <i data-lucide="briefcase"></i>
                        <span>Career</span>
                    </a>
                    <a href="index.html#contact" class="dock-link" data-section="contact">
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

    initScrollSpy() {
        const nav = document.getElementById('dockNavItems');
        if (!nav) return;

        const links = nav.querySelectorAll('.dock-link');
        this.sectionMap = [];

        links.forEach(link => {
            const sectionId = link.dataset.section;
            if (sectionId) {
                this.sectionMap.push({ link, sectionId });
            }
        });

        const sectionIds = this.sectionMap.map(s => s.sectionId);
        const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
        this.observedSections = sections;

        if (sections.length === 0) return;

        let observerTimeout;
        this.observer = new IntersectionObserver((entries) => {
            if (this.programmaticScroll) return;

            let maxRatio = 0;
            let mostVisible = null;

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    mostVisible = entry.target.id;
                }
            });

            if (mostVisible && mostVisible !== this.activeSection) {
                clearTimeout(observerTimeout);
                observerTimeout = setTimeout(() => {
                    this.setActiveSection(mostVisible);
                }, 30);
            } else if (!mostVisible && this.activeSection) {
                const scrollY = window.scrollY;
                let bestSection = sectionIds[0];
                for (let i = sections.length - 1; i >= 0; i--) {
                    const section = sections[i];
                    if (section && section.offsetTop <= scrollY + 120) {
                        bestSection = section.id;
                        break;
                    }
                }
                if (bestSection !== this.activeSection) {
                    clearTimeout(observerTimeout);
                    observerTimeout = setTimeout(() => {
                        this.setActiveSection(bestSection);
                    }, 30);
                }
            }
        }, {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '-5% 0px -5% 0px'
        });

        sections.forEach(section => {
            if (section) this.observer.observe(section);
        });

        const initialSection = sectionIds[0];
        const scrollY = window.scrollY;
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (section && section.offsetTop <= scrollY + 120) {
                this.setActiveSection(section.id);
                return;
            }
        }
        this.setActiveSection(initialSection);

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateIndicatorPosition();
            }, 100);
        });
    }

    setActiveSection(sectionId) {
        if (this.activeSection === sectionId) {
            this.updateIndicatorPosition();
            return;
        }

        this.activeSection = sectionId;

        this.sectionMap.forEach(({ link, sectionId: sid }) => {
            const isActive = sid === sectionId;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        this.updateIndicatorPosition();
    }

    updateIndicatorPosition() {
        const indicator = document.getElementById('dockIndicator');
        if (!indicator) return;

        const activeLink = this.sectionMap.find(s => s.sectionId === this.activeSection)?.link;
        if (!activeLink) {
            indicator.style.opacity = '0';
            return;
        }

        const parent = activeLink.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();

        const left = linkRect.left - parentRect.left;
        const width = linkRect.width;

        indicator.style.left = left + 'px';
        indicator.style.width = width + 'px';
        indicator.style.opacity = '1';
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
                link.addEventListener('click', (e) => {
                    navMenu.classList.remove('mobile-open');
                    const icon = toggleBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'menu');
                        this.updateIcons();
                    }

                    const sectionId = link.dataset.section;
                    if (sectionId) {
                        const target = document.getElementById(sectionId);
                        if (target) {
                            e.preventDefault();
                            this.setActiveSection(sectionId);
                            this.programmaticScroll = true;
                            if (typeof lenis !== 'undefined' && lenis) {
                                lenis.scrollTo(target, { duration: 1.2 });
                                setTimeout(() => {
                                    this.programmaticScroll = false;
                                }, 1500);
                            } else {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                setTimeout(() => {
                                    this.programmaticScroll = false;
                                }, 1000);
                            }
                        }
                    }
                });
            });
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.headerManager) {
        window.headerManager.destroy();
    }
    window.headerManager = new HeaderManager();
});
