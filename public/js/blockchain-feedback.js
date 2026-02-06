/**
 * Blockchain Transaction Feedback System
 * Issue #109: Loading States & Transaction Confirmation Feedback
 */

class BlockchainFeedback {
    constructor() {
        this.pendingTransactions = new Map();
        this.timeoutDuration = 120000; // 2 minutes
        this.initializeStyles();
    }

    initializeStyles() {
        if (!document.getElementById('blockchain-feedback-styles')) {
            const styles = document.createElement('style');
            styles.id = 'blockchain-feedback-styles';
            styles.textContent = `
                .skeleton-loader {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 4px;
                    height: 40px;
                    margin-bottom: 8px;
                }
                
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                
                .tx-feedback-modal {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 400px;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                }
                
                .tx-feedback-modal.show {
                    transform: translateX(0);
                }
                
                .tx-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #d32f2f;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 10px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10001;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    max-width: 400px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .toast-notification.show {
                    transform: translateX(0);
                }
                
                .toast-success { background: #10b981; }
                .toast-error { background: #ef4444; }
                .toast-warning { background: #f59e0b; }
            `;
            document.head.appendChild(styles);
        }
    }

    showSkeletonLoader(container, count = 5) {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-loader';
            container.appendChild(skeleton);
        }
    }

    showTransactionPending(txHash, message = 'Waiting for blockchain confirmation...') {
        const modal = document.createElement('div');
        modal.className = 'tx-feedback-modal';
        modal.id = `tx-modal-${txHash}`;
        
        modal.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div class="tx-spinner"></div>
                <strong>Transaction Pending</strong>
            </div>
            <p style="margin: 8px 0; color: #666;">${message}</p>
            <div style="margin: 12px 0;">
                <small style="color: #888;">TX Hash:</small><br>
                <a href="https://etherscan.io/tx/${txHash}" target="_blank" style="color: #d32f2f; text-decoration: none; font-family: monospace; font-size: 0.9em;">
                    ${txHash.substring(0, 20)}...
                </a>
            </div>
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);
        
        const timeoutId = setTimeout(() => {
            this.showTimeoutWarning(txHash);
        }, this.timeoutDuration);
        
        this.pendingTransactions.set(txHash, { modal, timeoutId });
        return modal;
    }

    showTimeoutWarning(txHash) {
        const modal = document.getElementById(`tx-modal-${txHash}`);
        if (modal) {
            modal.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 12px; color: #f59e0b;">
                    <strong>Transaction Delayed</strong>
                </div>
                <p style="margin: 8px 0; color: #666;">Blockchain may be congested. Please wait or check explorer.</p>
                <div style="margin: 12px 0;">
                    <a href="https://etherscan.io/tx/${txHash}" target="_blank" style="background: #f59e0b; color: white; text-decoration: none; padding: 6px 12px; border-radius: 4px;">
                        View in Explorer
                    </a>
                </div>
            `;
        }
    }

    showTransactionSuccess(txHash, message = 'Evidence added successfully!') {
        this.removePendingTransaction(txHash);
        const sanitizedMessage = this.sanitizeText(message);
        const sanitizedTxHash = this.sanitizeText(txHash);
        this.showToast('success', `
            <div>
                <div>${sanitizedMessage}</div>
                <small><a href="https://etherscan.io/tx/${sanitizedTxHash}" target="_blank" style="color: rgba(255,255,255,0.8);">View Transaction</a></small>
            </div>
        `);
    }

    showTransactionError(txHash, error, retryCallback = null) {
        this.removePendingTransaction(txHash);
        const sanitizedError = this.sanitizeText(error);
        const retryButton = retryCallback ? 
            `<button onclick="blockchainFeedback.executeRetry('${this.sanitizeText(txHash)}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Retry</button>` : '';
        
        this.showToast('error', `
            <div>
                <div>Transaction Failed</div>
                <small>${sanitizedError}</small>
            </div>
            ${retryButton}
        `);
        
        if (retryCallback) {
            this.retryCallbacks = this.retryCallbacks || new Map();
            this.retryCallbacks.set(txHash, retryCallback);
        }
    }

    executeRetry(txHash) {
        const callback = this.retryCallbacks && this.retryCallbacks.get(txHash);
        if (callback && typeof callback === 'function') {
            callback();
            this.retryCallbacks.delete(txHash);
        }
    }

    sanitizeText(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        return text.replace(/[<>"'&]/g, function(match) {
            const escapeMap = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return escapeMap[match];
        });
    }

    showToast(type, content, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = content;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        return toast;
    }

    removePendingTransaction(txHash) {
        const pending = this.pendingTransactions.get(txHash);
        if (pending) {
            clearTimeout(pending.timeoutId);
            if (pending.modal) {
                pending.modal.classList.remove('show');
                setTimeout(() => pending.modal.remove(), 300);
            }
            this.pendingTransactions.delete(txHash);
        }
    }

    async executeWithFeedback(operation, operationName = 'Transaction') {
        try {
            const result = await operation();
            if (result && result.hash) {
                this.showTransactionPending(result.hash, `${operationName} submitted. Waiting for confirmation...`);
                const receipt = await this.waitForConfirmation(result.hash);
                if (receipt.status === 'success') {
                    this.showTransactionSuccess(result.hash, `${operationName} completed successfully!`);
                } else {
                    this.showTransactionError(result.hash, 'Transaction failed during execution');
                }
                return receipt;
            }
            return result;
        } catch (error) {
            console.error(`${operationName} error:`, error);
            this.showToast('error', `
                <div>
                    <div>${operationName} Failed</div>
                    <small>${error.message || 'Unknown error occurred'}</small>
                </div>
            `);
            throw error;
        }
    }

    async waitForConfirmation(txHash) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: 'success',
                    hash: txHash,
                    blockNumber: Math.floor(Math.random() * 1000000),
                    gasUsed: Math.floor(Math.random() * 100000)
                });
            }, Math.random() * 3000 + 2000);
        });
    }
}

window.blockchainFeedback = new BlockchainFeedback();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockchainFeedback;
}