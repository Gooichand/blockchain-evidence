/**
 * Unified Footer Manager for EVID-DGC
 * Dynamically injects the premium footer into all pages and handles animations
 */

class FooterManager {
    constructor() {
        this.init();
    }

    init() {
        this.injectStyles();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }

    injectStyles() {
        if (!document.querySelector('link[href="footer.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'footer.css';
            document.head.appendChild(link);
        }
    }

    render() {
        // Prevent duplicate footers
        if (document.querySelector('footer.footer')) return;

        const year = new Date().getFullYear();

        const footerHTML = `
        <footer class="footer footer-animate">
            <div class="footer-particles" aria-hidden="true">
                <span class="footer-particle footer-particle-1"></span>
                <span class="footer-particle footer-particle-2"></span>
                <span class="footer-particle footer-particle-3"></span>
                <span class="footer-particle footer-particle-4"></span>
                <span class="footer-particle footer-particle-5"></span>
                <span class="footer-particle footer-particle-6"></span>
                <span class="footer-particle footer-particle-7"></span>
                <span class="footer-particle footer-particle-8"></span>
            </div>

            <div class="footer-container">
                <div class="footer-section footer-section-brand slide-up" style="animation-delay: 0.1s;">
                    <div class="footer-brand">
                        <img src="logo-32x32.png" alt="EVID-DGC logo" class="footer-logo">
                        <span>EVID-DGC</span>
                    </div>
                    <p>Secure blockchain evidence management for law enforcement, forensic laboratories, and courts.</p>
                    <div class="footer-connect">
                        <a href="https://www.linkedin.com/company/evid-dgc/" class="footer-linkedin" target="_blank"
                            rel="noopener noreferrer" aria-label="Connect with EVID-DGC on LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="linkedin-svg"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                        </a>
                        <span class="footer-connect-label">Connect on LinkedIn</span>
                    </div>
                </div>

                <div class="footer-section slide-up" style="animation-delay: 0.2s;">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="index.html#how-it-works">How It Works</a></li>
                        <li><a href="index.html#documentation">Documentation</a></li>
                        <li><a href="index.html#faq">Q&amp;A</a></li>
                        <li><a href="index.html#contact">Contact</a></li>
                    </ul>
                </div>

                <div class="footer-section slide-up" style="animation-delay: 0.3s;">
                    <h3>Legal</h3>
                    <ul>
                        <li><a href="privacy.html">Privacy Policy</a></li>
                        <li><a href="terms_of_service.html">Terms of Service</a></li>
                        <li><a href="security_policy.html">Security Policy</a></li>
                    </ul>
                </div>

                <div class="footer-section slide-up" style="animation-delay: 0.4s;">
                    <h3>Resources</h3>
                    <ul>
                        <li><a href="quickstart.html">Documentation</a></li>
                        <li><a href="api-reference.html">API Documentation</a></li>
                        <li><a href="help-center.html">Support</a></li>
                    </ul>
                </div>
            </div>

            <div class="footer-trust fade-in" style="animation-delay: 0.5s;">
                <div class="footer-trust-card">
                    <i data-lucide="shield-check"></i>
                    <span>Secure by Design</span>
                </div>
                <div class="footer-trust-card">
                    <i data-lucide="lock"></i>
                    <span>Tamper-Proof Records</span>
                </div>
                <div class="footer-trust-card">
                    <i data-lucide="link"></i>
                    <span>Blockchain Verified</span>
                </div>
                <div class="footer-trust-card">
                    <i data-lucide="scale"></i>
                    <span>Court-Ready Documentation</span>
                </div>
            </div>

            <div class="footer-bottom fade-in" style="animation-delay: 0.6s;">
                <p>&copy; <span id="footerYear">${year}</span> EVID-DGC · Blockchain Evidence Management. All rights
                    reserved.</p>
            </div>
        </footer>
        `;

        // Insert at the end of body
        document.body.insertAdjacentHTML('beforeend', footerHTML);

        // Initialize Lucide icons if available
        this.updateIcons();
        this.initLinkedInRipple();
    }

    initLinkedInRipple() {
        const btn = document.querySelector('.footer-linkedin');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.4;
            const ripple = document.createElement('span');
            ripple.className = 'footer-ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
            ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }

    updateIcons() {
        if (typeof lucide !== 'undefined') {
            try {
                lucide.createIcons();
            } catch (err) {
                console.warn('Footer Lucide icon creation failed:', err);
            }
        } else {
            // Log once but don't overwhelm
            if (!window.lucideWarned) {
                console.warn('Lucide icons not loaded for footer');
                window.lucideWarned = true;
            }
        }
    }
}

// Initialize
const footerManager = new FooterManager();
