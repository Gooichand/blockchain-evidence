/**
 * EVID-DGC - Enhanced Stability and Rotation Fixes
 * Comprehensive JavaScript fixes for all stability issues
 */

// Global stability configuration
const STABILITY_CONFIG = {
    DEBOUNCE_DELAY: 300,
    RESIZE_DELAY: 150,
    SCROLL_DELAY: 100,
    ANIMATION_DURATION: 300,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Enhanced error handling and retry mechanism
class StabilityManager {
    constructor() {
        this.retryCount = new Map();
        this.isInitialized = false;
        this.orientationChangeHandlers = [];
        this.resizeHandlers = [];
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupViewportFixes();
        this.setupOrientationHandling();
        this.setupResizeHandling();
        this.setupScrollHandling();
        this.setupTouchHandling();
        this.setupErrorHandling();
        this.setupPerformanceOptimizations();
        
        this.isInitialized = true;
        console.log('🔧 Stability Manager initialized');
    }

    // Viewport and container fixes
    setupViewportFixes() {
        // Fix viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';

        // Prevent horizontal scroll
        this.preventHorizontalScroll();
        
        // Fix iOS Safari viewport issues
        this.fixIOSViewport();
    }

    preventHorizontalScroll() {
        const style = document.createElement('style');
        style.textContent = `
            html, body {
                overflow-x: hidden !important;
                max-width: 100vw !important;
                position: relative;
            }
            
            * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            
            .container, .card, .role-card, .modal-content {
                max-width: 100% !important;
                overflow-wrap: break-word !important;
                word-wrap: break-word !important;
            }
        `;
        document.head.appendChild(style);
    }

    fixIOSViewport() {
        if (this.isIOS()) {
            const fixViewport = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            fixViewport();
            window.addEventListener('resize', this.debounce(fixViewport, STABILITY_CONFIG.RESIZE_DELAY));
            window.addEventListener('orientationchange', this.debounce(fixViewport, STABILITY_CONFIG.RESIZE_DELAY));
        }
    }

    // Enhanced orientation change handling
    setupOrientationHandling() {
        let orientationTimer;
        
        const handleOrientationChange = () => {
            clearTimeout(orientationTimer);
            orientationTimer = setTimeout(() => {
                this.handleOrientationChange();
                this.orientationChangeHandlers.forEach(handler => {
                    try {
                        handler();
                    } catch (error) {
                        console.warn('Orientation handler error:', error);
                    }
                });
            }, STABILITY_CONFIG.RESIZE_DELAY);
        };

        // Multiple event listeners for better compatibility
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        // Screen orientation API (modern browsers)
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }
    }

    handleOrientationChange() {
        // Close mobile menu on orientation change
        const navMenu = document.getElementById('navMenu');
        const menuToggle = document.getElementById('menuToggle');
        
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (menuToggle) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        }

        // Recalculate layout
        this.recalculateLayout();
        
        // Fix modal positioning
        this.fixModalPositioning();
        
        // Trigger resize event for other components
        window.dispatchEvent(new Event('resize'));
    }

    recalculateLayout() {
        // Force reflow for better layout calculation
        const elements = document.querySelectorAll('.card, .role-card, .modal-content, .container');
        elements.forEach(el => {
            const display = el.style.display;
            el.style.display = 'none';
            el.offsetHeight; // Trigger reflow
            el.style.display = display;
        });
    }

    fixModalPositioning() {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            const content = modal.querySelector('.modal-content');
            if (content) {
                // Reset positioning
                content.style.transform = 'scale(1)';
                content.style.marginTop = '0';
                
                // Recenter if needed
                setTimeout(() => {
                    const rect = content.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    
                    if (rect.height > viewportHeight * 0.9) {
                        modal.style.alignItems = 'flex-start';
                        modal.style.paddingTop = '20px';
                    } else {
                        modal.style.alignItems = 'center';
                        modal.style.paddingTop = '0';
                    }
                }, 100);
            }
        });
    }

    // Enhanced resize handling
    setupResizeHandling() {
        const handleResize = this.debounce(() => {
            this.handleResize();
            this.resizeHandlers.forEach(handler => {
                try {
                    handler();
                } catch (error) {
                    console.warn('Resize handler error:', error);
                }
            });
        }, STABILITY_CONFIG.RESIZE_DELAY);

        window.addEventListener('resize', handleResize);
    }

    handleResize() {
        // Update CSS custom properties
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        
        document.documentElement.style.setProperty('--vw', `${vw}px`);
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Fix grid layouts
        this.fixGridLayouts();
        
        // Update modal constraints
        this.updateModalConstraints();
    }

    fixGridLayouts() {
        const grids = document.querySelectorAll('.role-grid, .doc-grid, .contact-grid');
        grids.forEach(grid => {
            const computedStyle = window.getComputedStyle(grid);
            const gridCols = computedStyle.gridTemplateColumns;
            
            // Force grid recalculation
            grid.style.gridTemplateColumns = 'none';
            grid.offsetHeight; // Trigger reflow
            grid.style.gridTemplateColumns = gridCols;
        });
    }

    updateModalConstraints() {
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            const maxHeight = window.innerHeight * 0.9;
            modal.style.maxHeight = `${maxHeight}px`;
        });
    }

    // Scroll handling improvements
    setupScrollHandling() {
        let scrollTimer;
        
        const handleScroll = () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.updateScrollElements();
            }, STABILITY_CONFIG.SCROLL_DELAY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    updateScrollElements() {
        // Update scroll-up button
        const scrollBtn = document.getElementById('scrollUpBtn');
        if (scrollBtn) {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }

        // Update sticky navigation
        const nav = document.querySelector('.header-nav');
        if (nav) {
            if (window.scrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }
    }

    // Touch handling for mobile devices
    setupTouchHandling() {
        // Prevent double-tap zoom on buttons
        const buttons = document.querySelectorAll('.btn, .role-card, .nav-link');
        buttons.forEach(button => {
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.click();
            }, { passive: false });
        });

        // Handle touch scrolling in modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            let startY = 0;
            
            modal.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            modal.addEventListener('touchmove', (e) => {
                const currentY = e.touches[0].clientY;
                const modalContent = modal.querySelector('.modal-content');
                
                if (modalContent && modalContent.scrollTop === 0 && currentY > startY) {
                    // Prevent overscroll at top
                    e.preventDefault();
                }
            }, { passive: false });
        });
    }

    // Enhanced error handling
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error, 'global');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'promise');
        });

        // Network error handling
        window.addEventListener('offline', () => {
            this.showNetworkStatus(false);
        });

        window.addEventListener('online', () => {
            this.showNetworkStatus(true);
        });
    }

    handleError(error, type) {
        const errorKey = `${type}_${error.message || error}`;
        const retryCount = this.retryCount.get(errorKey) || 0;
        
        if (retryCount < STABILITY_CONFIG.MAX_RETRIES) {
            this.retryCount.set(errorKey, retryCount + 1);
            
            setTimeout(() => {
                // Attempt recovery based on error type
                this.attemptRecovery(error, type);
            }, STABILITY_CONFIG.RETRY_DELAY * (retryCount + 1));
        } else {
            // Show user-friendly error message
            this.showErrorMessage(error, type);
        }
    }

    attemptRecovery(error, type) {
        switch (type) {
            case 'global':
                // Reinitialize components
                this.reinitializeComponents();
                break;
            case 'promise':
                // Retry failed operations
                this.retryFailedOperations();
                break;
            default:
                console.warn('Unknown error type for recovery:', type);
        }
    }

    reinitializeComponents() {
        try {
            // Reinitialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Reinitialize navigation
            if (typeof initializeNavigation === 'function') {
                initializeNavigation();
            }
            
            // Reinitialize role selection
            if (typeof initializeRoleSelection === 'function') {
                initializeRoleSelection();
            }
        } catch (error) {
            console.error('Component reinitialization failed:', error);
        }
    }

    retryFailedOperations() {
        // Retry common failed operations
        const retryOperations = [
            () => this.checkWalletConnection(),
            () => this.validateForms(),
            () => this.updateUI()
        ];

        retryOperations.forEach(operation => {
            try {
                operation();
            } catch (error) {
                console.warn('Retry operation failed:', error);
            }
        });
    }

    showErrorMessage(error, type) {
        const message = this.getErrorMessage(error, type);
        if (typeof showAlert === 'function') {
            showAlert(message, 'error');
        } else {
            console.error('Error display failed:', message);
        }
    }

    getErrorMessage(error, type) {
        const messages = {
            global: 'An unexpected error occurred. Please refresh the page.',
            promise: 'A network operation failed. Please check your connection.',
            wallet: 'Wallet connection failed. Please try reconnecting.',
            form: 'Form validation failed. Please check your inputs.'
        };
        
        return messages[type] || 'An error occurred. Please try again.';
    }

    showNetworkStatus(isOnline) {
        const statusEl = document.getElementById('networkStatus') || this.createNetworkStatusElement();
        
        if (isOnline) {
            statusEl.textContent = 'Connection restored';
            statusEl.className = 'network-status online';
            setTimeout(() => statusEl.remove(), 3000);
        } else {
            statusEl.textContent = 'No internet connection';
            statusEl.className = 'network-status offline';
        }
    }

    createNetworkStatusElement() {
        const statusEl = document.createElement('div');
        statusEl.id = 'networkStatus';
        statusEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(statusEl);
        return statusEl;
    }

    // Performance optimizations
    setupPerformanceOptimizations() {
        // Lazy load images
        this.setupLazyLoading();
        
        // Optimize animations
        this.optimizeAnimations();
        
        // Memory management
        this.setupMemoryManagement();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    optimizeAnimations() {
        // Reduce animations on low-end devices
        if (this.isLowEndDevice()) {
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.1s !important;
                    transition-duration: 0.1s !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            const animatedElements = document.querySelectorAll('.card, .role-card, .btn');
            animatedElements.forEach(el => {
                if (document.hidden) {
                    el.style.animationPlayState = 'paused';
                } else {
                    el.style.animationPlayState = 'running';
                }
            });
        });
    }

    setupMemoryManagement() {
        // Clean up event listeners on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Periodic cleanup
        setInterval(() => {
            this.performPeriodicCleanup();
        }, 300000); // 5 minutes
    }

    performPeriodicCleanup() {
        // Clear retry counts
        this.retryCount.clear();
        
        // Remove old error messages
        const oldAlerts = document.querySelectorAll('.alert');
        oldAlerts.forEach(alert => {
            if (Date.now() - parseInt(alert.dataset.timestamp || '0') > 30000) {
                alert.remove();
            }
        });
    }

    cleanup() {
        // Remove event listeners
        this.orientationChangeHandlers = [];
        this.resizeHandlers = [];
        
        // Clear timers
        clearTimeout(this.orientationTimer);
        clearTimeout(this.resizeTimer);
        clearTimeout(this.scrollTimer);
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    isLowEndDevice() {
        return navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
    }

    // Public API methods
    addOrientationChangeHandler(handler) {
        this.orientationChangeHandlers.push(handler);
    }

    addResizeHandler(handler) {
        this.resizeHandlers.push(handler);
    }

    removeOrientationChangeHandler(handler) {
        const index = this.orientationChangeHandlers.indexOf(handler);
        if (index > -1) {
            this.orientationChangeHandlers.splice(index, 1);
        }
    }

    removeResizeHandler(handler) {
        const index = this.resizeHandlers.indexOf(handler);
        if (index > -1) {
            this.resizeHandlers.splice(index, 1);
        }
    }

    checkWalletConnection() {
        // Placeholder for wallet connection check
        if (window.ethereum && typeof userAccount !== 'undefined') {
            return true;
        }
        return false;
    }

    validateForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.checkValidity && !input.checkValidity()) {
                    input.reportValidity();
                }
            });
        });
    }

    updateUI() {
        // Force UI update
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Update dynamic content
        this.updateDynamicContent();
    }

    updateDynamicContent() {
        // Update timestamps
        const timestamps = document.querySelectorAll('[data-timestamp]');
        timestamps.forEach(el => {
            const timestamp = parseInt(el.dataset.timestamp);
            if (timestamp) {
                el.textContent = new Date(timestamp).toLocaleString();
            }
        });
    }
}

// Enhanced form validation
class FormValidator {
    constructor() {
        this.rules = new Map();
        this.init();
    }

    init() {
        this.setupValidationRules();
        this.attachEventListeners();
    }

    setupValidationRules() {
        this.rules.set('email', {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        });

        this.rules.set('wallet', {
            pattern: /^0x[a-fA-F0-9]{40}$/,
            message: 'Please enter a valid wallet address'
        });

        this.rules.set('password', {
            minLength: 8,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        });
    }

    attachEventListeners() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.matches('form')) {
                if (!this.validateForm(e.target)) {
                    e.preventDefault();
                }
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.dataset.validate || field.type;
        const rule = this.rules.get(type);

        if (!rule) return true;

        let isValid = true;
        let message = '';

        if (rule.pattern && !rule.pattern.test(value)) {
            isValid = false;
            message = rule.message;
        }

        if (rule.minLength && value.length < rule.minLength) {
            isValid = false;
            message = `Minimum length is ${rule.minLength} characters`;
        }

        this.showFieldValidation(field, isValid, message);
        return isValid;
    }

    validateForm(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldValidation(field, isValid, message) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid && message) {
            const errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.textContent = message;
            errorEl.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 4px;
            `;
            field.parentNode.appendChild(errorEl);
            field.style.borderColor = '#dc3545';
        } else {
            field.style.borderColor = isValid ? '#28a745' : '#dc3545';
        }
    }
}

// Enhanced modal manager
class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.setupKeyboardHandling();
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            // Modal close buttons
            if (e.target.matches('.modal-close, [data-modal-close]')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            }

            // Modal backdrop clicks
            if (e.target.matches('.modal')) {
                this.closeModal(e.target);
            }

            // Modal open triggers
            if (e.target.matches('[data-modal-target]')) {
                const targetId = e.target.dataset.modalTarget;
                const modal = document.getElementById(targetId);
                if (modal) {
                    this.openModal(modal);
                }
            }
        });
    }

    setupKeyboardHandling() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                const lastModal = Array.from(this.activeModals).pop();
                this.closeModal(lastModal);
            }
        });
    }

    openModal(modal) {
        if (this.activeModals.has(modal)) return;

        this.activeModals.add(modal);
        modal.classList.add('active');
        document.body.classList.add('no-scroll');

        // Focus management
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Trap focus within modal
        this.trapFocus(modal, focusableElements);
    }

    closeModal(modal) {
        if (!this.activeModals.has(modal)) return;

        this.activeModals.delete(modal);
        modal.classList.remove('active');

        if (this.activeModals.size === 0) {
            document.body.classList.remove('no-scroll');
        }
    }

    trapFocus(modal, focusableElements) {
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);
        
        // Clean up when modal closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' && 
                    !modal.classList.contains('active')) {
                    modal.removeEventListener('keydown', handleTabKey);
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }
}

// Initialize all stability enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize stability manager
    window.stabilityManager = new StabilityManager();
    
    // Initialize form validator
    window.formValidator = new FormValidator();
    
    // Initialize modal manager
    window.modalManager = new ModalManager();
    
    // Add CSS for network status
    const networkStatusCSS = `
        .network-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }
        
        .network-status.online {
            background: #28a745;
        }
        
        .network-status.offline {
            background: #dc3545;
        }
        
        .field-error {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 4px;
            font-family: 'Inter', sans-serif;
        }
        
        .no-scroll {
            overflow: hidden !important;
            height: 100vh !important;
        }
        
        @media (max-width: 768px) {
            .network-status {
                top: 10px;
                right: 10px;
                left: 10px;
                text-align: center;
            }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = networkStatusCSS;
    document.head.appendChild(style);
    
    console.log('🚀 Enhanced stability system initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StabilityManager,
        FormValidator,
        ModalManager,
        STABILITY_CONFIG
    };
}