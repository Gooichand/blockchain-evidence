// Keyboard Navigation and Focus Management
class AccessibilityManager {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');
        
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusTrapping();
        this.setupSkipLinks();
        this.improveFormAccessibility();
    }

    setupKeyboardNavigation() {
        // Global keyboard event handler
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Escape':
                    this.handleEscapeKey(e);
                    break;
                case 'Tab':
                    this.handleTabKey(e);
                    break;
                case 'Enter':
                    this.handleEnterKey(e);
                    break;
            }
        });
    }

    handleEscapeKey(e) {
        // Close any open modals
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            e.preventDefault();
            this.closeModal(activeModal);
        }

        // Close any open dropdowns
        const openDropdowns = document.querySelectorAll('.dropdown.open');
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }

    handleTabKey(e) {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            this.trapFocusInModal(e, activeModal);
        }
    }

    handleEnterKey(e) {
        // Allow Enter key to activate buttons and links
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            e.target.click();
        }
    }

    setupFocusTrapping() {
        // Monitor for modal openings
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('modal') && target.classList.contains('active')) {
                        this.trapFocusInModal(null, target);
                        this.focusFirstElement(target);
                    }
                }
            });
        });

        // Observe all modals
        document.querySelectorAll('.modal').forEach(modal => {
            observer.observe(modal, { attributes: true });
        });
    }

    trapFocusInModal(e, modal) {
        const focusableElements = modal.querySelectorAll(this.focusableElements);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!e) {
            // Initial focus when modal opens
            if (firstElement) firstElement.focus();
            return;
        }

        if (e.key === 'Tab') {
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    focusFirstElement(container) {
        const firstFocusable = container.querySelector(this.focusableElements);
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }

    closeModal(modal) {
        modal.classList.remove('active');
        
        // Return focus to the element that opened the modal
        const trigger = document.querySelector(`[data-modal="${modal.id}"]`);
        if (trigger) {
            trigger.focus();
        }
    }

    setupSkipLinks() {
        // Add skip to main content link if not present
        if (!document.querySelector('.skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to main content';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // Ensure main content has ID
        const main = document.querySelector('main') || document.querySelector('.container');
        if (main && !main.id) {
            main.id = 'main-content';
        }
    }

    improveFormAccessibility() {
        // Associate labels with inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            if (!input.id) {
                input.id = 'input_' + Math.random().toString(36).substr(2, 9);
            }

            // Find associated label
            let label = document.querySelector(`label[for="${input.id}"]`);
            if (!label) {
                // Look for parent label
                label = input.closest('label');
                if (label) {
                    label.setAttribute('for', input.id);
                }
            }

            // Add aria-label if no label found
            if (!label && !input.getAttribute('aria-label')) {
                const placeholder = input.getAttribute('placeholder');
                if (placeholder) {
                    input.setAttribute('aria-label', placeholder);
                }
            }
        });

        // Improve error messaging
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('invalid', (e) => {
                this.showAccessibleError(e.target);
            });
        });
    }

    showAccessibleError(input) {
        // Remove existing error
        const existingError = input.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        // Create accessible error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.id = input.id + '_error';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.textContent = input.validationMessage;

        // Insert after input
        input.parentNode.insertBefore(errorDiv, input.nextSibling);

        // Associate error with input
        input.setAttribute('aria-describedby', errorDiv.id);
        input.classList.add('error');

        // Remove error when input becomes valid
        input.addEventListener('input', () => {
            if (input.validity.valid) {
                errorDiv.remove();
                input.removeAttribute('aria-describedby');
                input.classList.remove('error');
            }
        });
    }

    // Public methods for modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.focusFirstElement(modal);
        }
    }

    closeModalById(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            this.closeModal(modal);
        }
    }

    // Announce changes to screen readers
    announce(message, priority = 'polite') {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = message;
        
        document.body.appendChild(announcer);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcer);
        }, 1000);
    }
}

// Initialize accessibility manager
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});

// Export for global use
window.AccessibilityManager = AccessibilityManager;