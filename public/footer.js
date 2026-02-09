/**
 * Unified Footer Manager for EVID-DGC
 * Dynamically injects the footer into dashboard pages and handles animations
 */

class FooterManager {
    constructor() {
        this.init();
    }

    init() {
        this.injectStyles();
        // Wait for DOM to be ready
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

        const footerHTML = `
        <footer class="footer footer-animate">
            <div class="footer-container">
                <div class="footer-section slide-up" style="animation-delay: 0.1s;">
                    <div class="footer-brand">
                        <img src="logo-32x32.png" alt="Logo" class="footer-logo" style="height: 24px; width: 24px;">
                        <span>EVID-DGC</span>
                    </div>
                    <p>Secure blockchain evidence management for law enforcement and legal professionals.</p>
                </div>
                
                <div class="footer-section slide-up" style="animation-delay: 0.2s;">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="index.html#how-it-works">How It Works</a></li>
                        <li><a href="index.html#documentation">Documentation</a></li>
                        <li><a href="index.html#faq">FAQ</a></li>
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
                        <li><a href="https://github.com/Gooichand/blockchain-evidence" target="_blank">GitHub</a></li>
                        <li><a href="api-reference.html">API Documentation</a></li>
                        <li><a href="help-center.html">Support</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom fade-in" style="animation-delay: 0.5s;">
                <p>&copy; <span id="footerYear">${new Date().getFullYear()}</span> Blockchain Evidence Management. All rights reserved.</p>
            </div>
        </footer>
        `;

        // Insert at the end of body
        document.body.insertAdjacentHTML('beforeend', footerHTML);

        // Initialize Lucide icons if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Initialize
const footerManager = new FooterManager();
