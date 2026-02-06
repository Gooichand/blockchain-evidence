// Enhanced Error Handling and Loading States
class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupGlobalErrorHandling();
        this.setupNetworkMonitoring();
        this.createToastContainer();
    }

    setupGlobalErrorHandling() {
        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showToast('An unexpected error occurred. Please refresh the page.', 'error');
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showToast('A network error occurred. Please check your connection.', 'error');
        });
    }

    setupNetworkMonitoring() {
        // Monitor network status
        window.addEventListener('online', () => {
            this.showNetworkStatus('Connected', 'online');
            this.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNetworkStatus('Offline', 'offline');
            this.showToast('Connection lost. Some features may not work.', 'warning');
        });

        // Initial network status
        if (!navigator.onLine) {
            this.showNetworkStatus('Offline', 'offline');
        }
    }

    showNetworkStatus(text, status) {
        let statusEl = document.getElementById('networkStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'networkStatus';
            statusEl.className = 'network-status';
            document.body.appendChild(statusEl);
        }

        statusEl.textContent = text;
        statusEl.className = `network-status ${status}`;

        // Auto-hide after 3 seconds if online
        if (status === 'online') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        } else {
            statusEl.style.display = 'block';
        }
    }

    createToastContainer() {
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" aria-label="Close notification">
                <i data-lucide="x"></i>
            </button>
        `;

        container.appendChild(toast);
        lucide.createIcons();

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    showErrorBoundary(error, componentName = 'Component') {
        const errorBoundary = document.createElement('div');
        errorBoundary.className = 'error-boundary';
        errorBoundary.innerHTML = `
            <h3>Something went wrong</h3>
            <p>An error occurred in ${componentName}. Please try refreshing the page.</p>
            <button class="retry-button" onclick="window.location.reload()">
                Refresh Page
            </button>
            <details style="margin-top: 1rem; text-align: left;">
                <summary>Error Details</summary>
                <pre style="font-size: 0.75rem; margin-top: 0.5rem;">${error.stack || error.message}</pre>
            </details>
        `;
        return errorBoundary;
    }
}

// Loading States Manager
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }

    show(id = 'global', message = 'Loading...') {
        this.activeLoaders.add(id);
        
        let loader = document.getElementById(`loader-${id}`);
        if (!loader) {
            loader = document.createElement('div');
            loader.id = `loader-${id}`;
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div>
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
    }

    hide(id = 'global') {
        this.activeLoaders.delete(id);
        
        const loader = document.getElementById(`loader-${id}`);
        if (loader) {
            loader.style.display = 'none';
        }
    }

    hideAll() {
        this.activeLoaders.forEach(id => this.hide(id));
        this.activeLoaders.clear();
    }

    setButtonLoading(button, loading = true) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    createSkeleton(container, type = 'text', count = 3) {
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-${type}`;
            
            if (type === 'text') {
                const length = ['short', 'medium', 'long'][Math.floor(Math.random() * 3)];
                skeleton.classList.add(length);
            }
            
            container.appendChild(skeleton);
        }
    }
}

// Form Validation Enhancement
class FormValidator {
    constructor() {
        this.rules = {};
    }

    addRule(fieldId, validator, message) {
        if (!this.rules[fieldId]) {
            this.rules[fieldId] = [];
        }
        this.rules[fieldId].push({ validator, message });
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        const rules = this.rules[fieldId] || [];
        let isValid = true;
        let errorMessage = '';

        for (const rule of rules) {
            if (!rule.validator(field.value)) {
                isValid = false;
                errorMessage = rule.message;
                break;
            }
        }

        this.updateFieldState(field, isValid, errorMessage);
        return isValid;
    }

    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (!this.validateField(field.id)) {
                isValid = false;
            }
        });

        return isValid;
    }

    updateFieldState(field, isValid, message = '') {
        // Remove existing validation classes
        field.classList.remove('valid', 'invalid');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (isValid) {
            field.classList.add('valid');
        } else {
            field.classList.add('invalid');
            
            if (message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = message;
                field.parentNode.appendChild(errorDiv);
            }
        }
    }

    setupRealTimeValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field.id);
            });

            field.addEventListener('input', () => {
                // Clear error state on input
                if (field.classList.contains('invalid')) {
                    field.classList.remove('invalid');
                    const errorDiv = field.parentNode.querySelector('.field-error');
                    if (errorDiv) {
                        errorDiv.remove();
                    }
                }
            });
        });
    }
}

// Progress Tracker
class ProgressTracker {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.progress = 0;
        this.total = 100;
        this.createProgressBar();
    }

    createProgressBar() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
    }

    update(current, total = this.total) {
        this.progress = Math.min(100, (current / total) * 100);
        
        const fill = this.container.querySelector('.progress-fill');
        const text = this.container.querySelector('.progress-text');
        
        if (fill) fill.style.width = `${this.progress}%`;
        if (text) text.textContent = `${Math.round(this.progress)}%`;
    }

    complete() {
        this.update(100, 100);
        setTimeout(() => {
            if (this.container) {
                this.container.style.display = 'none';
            }
        }, 1000);
    }
}

// Initialize systems
document.addEventListener('DOMContentLoaded', () => {
    window.errorHandler = new ErrorHandler();
    window.loadingManager = new LoadingManager();
    window.formValidator = new FormValidator();
});

// Enhanced showAlert function
function showAlert(message, type = 'info', duration = 5000) {
    if (window.errorHandler) {
        window.errorHandler.showToast(message, type, duration);
    } else {
        // Fallback to basic alert
        alert(message);
    }
}

// Export classes
window.ErrorHandler = ErrorHandler;
window.LoadingManager = LoadingManager;
window.FormValidator = FormValidator;
window.ProgressTracker = ProgressTracker;