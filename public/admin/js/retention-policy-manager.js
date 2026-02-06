// Retention Policy and Legal Hold Management System
class RetentionPolicyManager {
    constructor() {
        this.policies = new Map();
        this.legalHolds = new Map();
        this.currentUser = null;
        this.privilegedRoles = new Set(['admin', 'legal_professional', 'court_official', 'evidence_manager']);
        this.retentionScheduler = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.initializeRetentionScheduler();
        this.loadRetentionPolicies();
        this.loadLegalHolds();
    }

    loadCurrentUser() {
        const wallet = localStorage.getItem('currentUser');
        const role = localStorage.getItem('userRole');
        this.currentUser = { wallet, role };
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.renderRetentionPolicyInterface();
            this.renderLegalHoldInterface();
        });
    }

    // Retention Policy Management
    async createRetentionPolicy(policyData) {
        if (!this.hasAdminAccess()) {
            throw new Error('Admin access required to create retention policies');
        }

        const policy = {
            id: 'RP-' + Date.now(),
            name: policyData.name,
            evidenceTypes: policyData.evidenceTypes,
            retentionDays: policyData.retentionDays,
            jurisdiction: policyData.jurisdiction,
            legalBasis: policyData.legalBasis,
            autoArchive: policyData.autoArchive || false,
            createdBy: this.currentUser.wallet,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        try {
            const response = await fetch('/api/retention-policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(policy)
            });

            if (!response.ok) throw new Error('Failed to create retention policy');

            const result = await response.json();
            this.policies.set(policy.id, policy);
            
            this.logAdminAction('retention_policy_created', policy.id, {
                policyName: policy.name,
                retentionDays: policy.retentionDays
            });

            return result;
        } catch (error) {
            console.error('Error creating retention policy:', error);
            throw error;
        }
    }

    async updateRetentionPolicy(policyId, updates) {
        if (!this.hasAdminAccess()) {
            throw new Error('Admin access required to update retention policies');
        }

        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error('Retention policy not found');
        }

        const updatedPolicy = {
            ...policy,
            ...updates,
            updatedBy: this.currentUser.wallet,
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/retention-policies/${policyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPolicy)
            });

            if (!response.ok) throw new Error('Failed to update retention policy');

            this.policies.set(policyId, updatedPolicy);
            
            this.logAdminAction('retention_policy_updated', policyId, {
                changes: updates
            });

            return updatedPolicy;
        } catch (error) {
            console.error('Error updating retention policy:', error);
            throw error;
        }
    }

    async deleteRetentionPolicy(policyId) {
        if (!this.hasAdminAccess()) {
            throw new Error('Admin access required to delete retention policies');
        }

        // Check if policy is in use
        const evidenceUsingPolicy = await this.getEvidenceByRetentionPolicy(policyId);
        if (evidenceUsingPolicy.length > 0) {
            throw new Error('Cannot delete policy: Evidence items are using this policy');
        }

        try {
            const response = await fetch(`/api/retention-policies/${policyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete retention policy');

            this.policies.delete(policyId);
            
            this.logAdminAction('retention_policy_deleted', policyId, {});

            return true;
        } catch (error) {
            console.error('Error deleting retention policy:', error);
            throw error;
        }
    }

    // Legal Hold Management
    async createLegalHold(holdData) {
        if (!this.hasPrivilegedAccess()) {
            throw new Error('Privileged access required to create legal holds');
        }

        const legalHold = {
            id: 'LH-' + Date.now(),
            caseId: holdData.caseId,
            evidenceIds: holdData.evidenceIds || [],
            reason: holdData.reason,
            legalBasis: holdData.legalBasis,
            courtOrder: holdData.courtOrder || null,
            startDate: new Date().toISOString(),
            endDate: holdData.endDate || null,
            createdBy: this.currentUser.wallet,
            createdAt: new Date().toISOString(),
            isActive: true,
            notifications: {
                stakeholders: holdData.stakeholders || [],
                frequency: holdData.notificationFrequency || 'weekly'
            }
        };

        try {
            const response = await fetch('/api/legal-holds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(legalHold)
            });

            if (!response.ok) throw new Error('Failed to create legal hold');

            const result = await response.json();
            this.legalHolds.set(legalHold.id, legalHold);

            // Apply legal hold to evidence
            await this.applyLegalHoldToEvidence(legalHold.evidenceIds, legalHold.id);

            // Send notifications
            await this.notifyLegalHoldStakeholders(legalHold, 'created');

            this.logAdminAction('legal_hold_created', legalHold.id, {
                caseId: legalHold.caseId,
                evidenceCount: legalHold.evidenceIds.length
            });

            return result;
        } catch (error) {
            console.error('Error creating legal hold:', error);
            throw error;
        }
    }

    async updateLegalHold(holdId, updates) {
        if (!this.hasPrivilegedAccess()) {
            throw new Error('Privileged access required to update legal holds');
        }

        const hold = this.legalHolds.get(holdId);
        if (!hold) {
            throw new Error('Legal hold not found');
        }

        const updatedHold = {
            ...hold,
            ...updates,
            updatedBy: this.currentUser.wallet,
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/legal-holds/${holdId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedHold)
            });

            if (!response.ok) throw new Error('Failed to update legal hold');

            this.legalHolds.set(holdId, updatedHold);

            // Update evidence legal hold status if evidence list changed
            if (updates.evidenceIds) {
                await this.updateEvidenceLegalHoldStatus(hold.evidenceIds, updatedHold.evidenceIds, holdId);
            }

            this.logAdminAction('legal_hold_updated', holdId, {
                changes: updates
            });

            return updatedHold;
        } catch (error) {
            console.error('Error updating legal hold:', error);
            throw error;
        }
    }

    async releaseLegalHold(holdId, releaseReason) {
        if (!this.hasPrivilegedAccess()) {
            throw new Error('Privileged access required to release legal holds');
        }

        const hold = this.legalHolds.get(holdId);
        if (!hold) {
            throw new Error('Legal hold not found');
        }

        const releasedHold = {
            ...hold,
            isActive: false,
            endDate: new Date().toISOString(),
            releaseReason: releaseReason,
            releasedBy: this.currentUser.wallet,
            releasedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/legal-holds/${holdId}/release`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ releaseReason })
            });

            if (!response.ok) throw new Error('Failed to release legal hold');

            this.legalHolds.set(holdId, releasedHold);

            // Remove legal hold from evidence
            await this.removeLegalHoldFromEvidence(hold.evidenceIds, holdId);

            // Send notifications
            await this.notifyLegalHoldStakeholders(releasedHold, 'released');

            this.logAdminAction('legal_hold_released', holdId, {
                releaseReason: releaseReason,
                evidenceCount: hold.evidenceIds.length
            });

            return releasedHold;
        } catch (error) {
            console.error('Error releasing legal hold:', error);
            throw error;
        }
    }

    // Evidence Retention Management
    async applyRetentionPolicy(evidenceIds, policyId) {
        if (!this.hasAdminAccess()) {
            throw new Error('Admin access required to apply retention policies');
        }

        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error('Retention policy not found');
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + policy.retentionDays);

        try {
            const response = await fetch('/api/evidence/apply-retention-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evidenceIds,
                    policyId,
                    expiryDate: expiryDate.toISOString(),
                    appliedBy: this.currentUser.wallet
                })
            });

            if (!response.ok) throw new Error('Failed to apply retention policy');

            this.logAdminAction('retention_policy_applied', policyId, {
                evidenceIds,
                expiryDate: expiryDate.toISOString()
            });

            return await response.json();
        } catch (error) {
            console.error('Error applying retention policy:', error);
            throw error;
        }
    }

    async getExpiringEvidence(daysAhead = 30) {
        try {
            const response = await fetch(`/api/evidence/expiring?days=${daysAhead}`);
            if (!response.ok) throw new Error('Failed to get expiring evidence');
            
            return await response.json();
        } catch (error) {
            console.error('Error getting expiring evidence:', error);
            throw error;
        }
    }

    async archiveExpiredEvidence(evidenceIds, archiveLocation) {
        if (!this.hasAdminAccess()) {
            throw new Error('Admin access required to archive evidence');
        }

        try {
            const response = await fetch('/api/evidence/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evidenceIds,
                    archiveLocation,
                    archivedBy: this.currentUser.wallet,
                    archiveDate: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to archive evidence');

            this.logAdminAction('evidence_archived', null, {
                evidenceIds,
                archiveLocation
            });

            return await response.json();
        } catch (error) {
            console.error('Error archiving evidence:', error);
            throw error;
        }
    }

    // Legal Hold Evidence Management
    async applyLegalHoldToEvidence(evidenceIds, holdId) {
        try {
            const response = await fetch('/api/evidence/apply-legal-hold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evidenceIds,
                    holdId,
                    appliedBy: this.currentUser.wallet
                })
            });

            if (!response.ok) throw new Error('Failed to apply legal hold to evidence');
            return await response.json();
        } catch (error) {
            console.error('Error applying legal hold to evidence:', error);
            throw error;
        }
    }

    async removeLegalHoldFromEvidence(evidenceIds, holdId) {
        try {
            const response = await fetch('/api/evidence/remove-legal-hold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evidenceIds,
                    holdId,
                    removedBy: this.currentUser.wallet
                })
            });

            if (!response.ok) throw new Error('Failed to remove legal hold from evidence');
            return await response.json();
        } catch (error) {
            console.error('Error removing legal hold from evidence:', error);
            throw error;
        }
    }

    async updateEvidenceLegalHoldStatus(oldEvidenceIds, newEvidenceIds, holdId) {
        const toRemove = oldEvidenceIds.filter(id => !newEvidenceIds.includes(id));
        const toAdd = newEvidenceIds.filter(id => !oldEvidenceIds.includes(id));

        if (toRemove.length > 0) {
            await this.removeLegalHoldFromEvidence(toRemove, holdId);
        }

        if (toAdd.length > 0) {
            await this.applyLegalHoldToEvidence(toAdd, holdId);
        }
    }

    // Validation and Checks
    async validateEvidenceDeletion(evidenceId) {
        try {
            const response = await fetch(`/api/evidence/${evidenceId}/deletion-check`);
            if (!response.ok) throw new Error('Failed to validate evidence deletion');
            
            const result = await response.json();
            
            if (result.hasLegalHold) {
                return {
                    canDelete: false,
                    reason: 'Evidence is under legal hold',
                    legalHoldId: result.legalHoldId,
                    legalHoldReason: result.legalHoldReason
                };
            }

            if (result.hasActiveRetention && !result.retentionExpired) {
                return {
                    canDelete: false,
                    reason: 'Evidence retention period has not expired',
                    expiryDate: result.expiryDate,
                    retentionPolicy: result.retentionPolicy
                };
            }

            return {
                canDelete: true,
                reason: 'Evidence can be deleted'
            };
        } catch (error) {
            console.error('Error validating evidence deletion:', error);
            throw error;
        }
    }

    async validateEvidenceModification(evidenceId) {
        try {
            const response = await fetch(`/api/evidence/${evidenceId}/modification-check`);
            if (!response.ok) throw new Error('Failed to validate evidence modification');
            
            const result = await response.json();
            
            if (result.hasLegalHold) {
                return {
                    canModify: false,
                    reason: 'Evidence is under legal hold - modifications are prohibited',
                    legalHoldId: result.legalHoldId
                };
            }

            return {
                canModify: true,
                reason: 'Evidence can be modified'
            };
        } catch (error) {
            console.error('Error validating evidence modification:', error);
            throw error;
        }
    }

    // Notification System
    async notifyLegalHoldStakeholders(legalHold, action) {
        const notifications = legalHold.notifications.stakeholders.map(stakeholder => ({
            recipient: stakeholder,
            title: `Legal Hold ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: `Legal hold for case ${legalHold.caseId} has been ${action}. Reason: ${legalHold.reason}`,
            type: 'legal_hold',
            data: {
                legalHoldId: legalHold.id,
                caseId: legalHold.caseId,
                action: action
            }
        }));

        try {
            const response = await fetch('/api/notifications/bulk-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifications })
            });

            if (!response.ok) throw new Error('Failed to send notifications');
        } catch (error) {
            console.error('Error sending legal hold notifications:', error);
        }
    }

    async notifyRetentionExpiry(evidenceList) {
        const notifications = evidenceList.map(evidence => ({
            recipient: evidence.submittedBy,
            title: 'Evidence Retention Expiring',
            message: `Evidence "${evidence.title}" will expire on ${new Date(evidence.expiryDate).toLocaleDateString()}`,
            type: 'retention_expiry',
            data: {
                evidenceId: evidence.id,
                expiryDate: evidence.expiryDate
            }
        }));

        try {
            const response = await fetch('/api/notifications/bulk-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifications })
            });

            if (!response.ok) throw new Error('Failed to send retention notifications');
        } catch (error) {
            console.error('Error sending retention notifications:', error);
        }
    }

    // Scheduler and Automation
    initializeRetentionScheduler() {
        // Check for expiring evidence daily
        this.retentionScheduler = setInterval(async () => {
            try {
                const expiringEvidence = await this.getExpiringEvidence(7); // 7 days ahead
                if (expiringEvidence.length > 0) {
                    await this.notifyRetentionExpiry(expiringEvidence);
                }

                // Auto-archive expired evidence if policy allows
                const expiredEvidence = await this.getExpiringEvidence(0); // Already expired
                for (const evidence of expiredEvidence) {
                    const policy = this.policies.get(evidence.retentionPolicyId);
                    if (policy && policy.autoArchive) {
                        await this.archiveExpiredEvidence([evidence.id], 'auto-archive');
                    }
                }
            } catch (error) {
                console.error('Error in retention scheduler:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
    }

    // Data Loading
    async loadRetentionPolicies() {
        try {
            const response = await fetch('/api/retention-policies');
            if (!response.ok) throw new Error('Failed to load retention policies');
            
            const policies = await response.json();
            policies.forEach(policy => {
                this.policies.set(policy.id, policy);
            });
        } catch (error) {
            console.error('Error loading retention policies:', error);
        }
    }

    async loadLegalHolds() {
        try {
            const response = await fetch('/api/legal-holds');
            if (!response.ok) throw new Error('Failed to load legal holds');
            
            const holds = await response.json();
            holds.forEach(hold => {
                this.legalHolds.set(hold.id, hold);
            });
        } catch (error) {
            console.error('Error loading legal holds:', error);
        }
    }

    // Utility Methods
    hasAdminAccess() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    hasPrivilegedAccess() {
        return this.currentUser && this.privilegedRoles.has(this.currentUser.role);
    }

    async getEvidenceByRetentionPolicy(policyId) {
        try {
            const response = await fetch(`/api/evidence/by-retention-policy/${policyId}`);
            if (!response.ok) throw new Error('Failed to get evidence by retention policy');
            
            return await response.json();
        } catch (error) {
            console.error('Error getting evidence by retention policy:', error);
            return [];
        }
    }

    async logAdminAction(action, targetId, details) {
        try {
            await fetch('/api/admin-actions/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminWallet: this.currentUser.wallet,
                    action,
                    targetId,
                    details,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    // UI Rendering Methods
    renderRetentionPolicyInterface() {
        // Implementation for rendering retention policy management UI
        console.log('Rendering retention policy interface');
    }

    renderLegalHoldInterface() {
        // Implementation for rendering legal hold management UI
        console.log('Rendering legal hold interface');
    }

    // Cleanup
    destroy() {
        if (this.retentionScheduler) {
            clearInterval(this.retentionScheduler);
        }
    }
}

// Initialize the retention policy manager
let retentionManager;
document.addEventListener('DOMContentLoaded', () => {
    retentionManager = new RetentionPolicyManager();
});

// Export for global access
window.retentionManager = retentionManager;