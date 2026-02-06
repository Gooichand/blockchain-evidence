// Retention Policy Management JavaScript
let currentUser = null;
let retentionPolicies = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadRetentionPolicies();
    await loadEvidenceExpiry();
    setupCronJob();
});

// Load retention policies
async function loadRetentionPolicies() {
    try {
        const response = await fetch('/api/retention-policies');
        const data = await response.json();
        
        if (data.success) {
            retentionPolicies = data.policies;
            displayPolicies();
            populatePolicySelects();
        }
    } catch (error) {
        console.error('Error loading policies:', error);
    }
}

// Display policies
function displayPolicies() {
    const container = document.getElementById('policiesList');
    container.innerHTML = retentionPolicies.map(policy => `
        <div class="policy-card">
            <h4>${policy.name}</h4>
            <p><strong>Case Type:</strong> ${policy.case_type}</p>
            <p><strong>Retention:</strong> ${policy.retention_days} days (${Math.round(policy.retention_days/365)} years)</p>
            <p><strong>Method:</strong> ${policy.archive_method}</p>
            <p><strong>Jurisdiction:</strong> ${policy.jurisdiction || 'N/A'}</p>
            <p><strong>Law Reference:</strong> ${policy.law_reference || 'N/A'}</p>
            <div class="policy-actions">
                <button onclick="editPolicy(${policy.id})" class="btn btn-secondary">Edit</button>
                <button onclick="deletePolicy(${policy.id})" class="btn btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load evidence expiry information
async function loadEvidenceExpiry() {
    try {
        const filter = document.getElementById('expiryFilter').value;
        const response = await fetch(`/api/evidence/expiry?filter=${filter}`);
        const data = await response.json();
        
        if (data.success) {
            displayEvidenceExpiry(data.evidence);
        }
    } catch (error) {
        console.error('Error loading evidence expiry:', error);
    }
}

// Display evidence expiry
function displayEvidenceExpiry(evidence) {
    const container = document.getElementById('evidenceExpiryList');
    
    if (!evidence.length) {
        container.innerHTML = '<p>No evidence found for selected filter.</p>';
        return;
    }
    
    container.innerHTML = evidence.map(item => {
        const daysUntilExpiry = item.expiry_date ? 
            Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
        let statusClass = 'status-active';
        let statusText = 'Active';
        
        if (item.legal_hold) {
            statusClass = 'legal-hold';
            statusText = 'Legal Hold';
        } else if (daysUntilExpiry !== null) {
            if (daysUntilExpiry < 0) {
                statusClass = 'status-expired';
                statusText = `Expired ${Math.abs(daysUntilExpiry)} days ago`;
            } else if (daysUntilExpiry <= 30) {
                statusClass = 'status-warning';
                statusText = `Expires in ${daysUntilExpiry} days`;
            }
        }
        
        return `
            <div class="evidence-item ${statusClass}">
                <h4>${item.title}</h4>
                <p><strong>Case:</strong> ${item.case_id}</p>
                <p><strong>Status:</strong> <span class="${statusClass}">${statusText}</span></p>
                <p><strong>Expiry Date:</strong> ${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'Not set'}</p>
                <div class="evidence-actions">
                    ${!item.legal_hold ? `<button onclick="setLegalHold(${item.id}, true)" class="btn btn-warning">Set Legal Hold</button>` : 
                      `<button onclick="setLegalHold(${item.id}, false)" class="btn btn-secondary">Remove Legal Hold</button>`}
                    <button onclick="updateRetentionPolicy(${item.id})" class="btn btn-primary">Update Policy</button>
                    ${daysUntilExpiry < 0 && !item.legal_hold ? `<button onclick="destroyEvidence(${item.id})" class="btn btn-danger">Destroy Evidence</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Create retention policy
async function createRetentionPolicy() {
    const formData = {
        name: document.getElementById('policyName').value,
        caseType: document.getElementById('caseType').value,
        retentionDays: parseInt(document.getElementById('retentionDays').value),
        archiveMethod: document.getElementById('archiveMethod').value,
        jurisdiction: document.getElementById('jurisdiction').value,
        lawReference: document.getElementById('lawReference').value,
        userWallet: currentUser.wallet_address
    };
    
    try {
        const response = await fetch('/api/retention-policies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            closeModal('createPolicyModal');
            await loadRetentionPolicies();
            showNotification('Retention policy created successfully', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error creating policy', 'error');
    }
}

// Set legal hold
async function setLegalHold(evidenceId, hold) {
    try {
        const response = await fetch(`/api/evidence/${evidenceId}/legal-hold`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                legalHold: hold,
                userWallet: currentUser.wallet_address
            })
        });
        
        const data = await response.json();
        if (data.success) {
            await loadEvidenceExpiry();
            showNotification(`Legal hold ${hold ? 'set' : 'removed'} successfully`, 'success');
        }
    } catch (error) {
        showNotification('Error updating legal hold', 'error');
    }
}

// Apply bulk retention policy
async function applyBulkPolicy() {
    const policyId = document.getElementById('bulkPolicySelect').value;
    const evidenceIds = document.getElementById('evidenceIds').value
        .split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    try {
        const response = await fetch('/api/evidence/bulk-retention-policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                policyId: parseInt(policyId),
                evidenceIds,
                userWallet: currentUser.wallet_address
            })
        });
        
        const data = await response.json();
        if (data.success) {
            closeModal('bulkPolicyModal');
            await loadEvidenceExpiry();
            showNotification(`Policy applied to ${data.updated} evidence items`, 'success');
        }
    } catch (error) {
        showNotification('Error applying bulk policy', 'error');
    }
}

// Generate retention report
async function generateRetentionReport() {
    try {
        const response = await fetch('/api/retention-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userWallet: currentUser.wallet_address })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `retention_report_${new Date().toISOString().split('T')[0]}.pdf`;
            a.click();
            showNotification('Report generated successfully', 'success');
        }
    } catch (error) {
        showNotification('Error generating report', 'error');
    }
}

// Setup cron job simulation for expiry checks
function setupCronJob() {
    // Check for expiring evidence every hour
    setInterval(checkExpiringEvidence, 60 * 60 * 1000);
    checkExpiringEvidence(); // Initial check
}

// Check for expiring evidence
async function checkExpiringEvidence() {
    try {
        const response = await fetch('/api/evidence/check-expiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userWallet: currentUser.wallet_address })
        });
        
        const data = await response.json();
        if (data.notifications_sent > 0) {
            console.log(`Sent ${data.notifications_sent} expiry notifications`);
        }
    } catch (error) {
        console.error('Error checking expiring evidence:', error);
    }
}

// Utility functions
function showCreatePolicyModal() {
    document.getElementById('createPolicyModal').style.display = 'block';
}

function showBulkPolicyModal() {
    document.getElementById('bulkPolicyModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function populatePolicySelects() {
    const select = document.getElementById('bulkPolicySelect');
    select.innerHTML = retentionPolicies.map(policy => 
        `<option value="${policy.id}">${policy.name} (${policy.retention_days} days)</option>`
    ).join('');
}

function showNotification(message, type) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        padding: 15px; border-radius: 5px; color: white;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}