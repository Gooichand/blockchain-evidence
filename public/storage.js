/**
 * Real Storage System - LocalStorage + API Integration
 * SECURITY FIX: Refactored to use centralized APIClient for secure, signed communication.
 */

// Storage system with localStorage (for non-sensitive UI state) and backend API
window.storage = {
    // User management functions
    async getUser(walletAddress) {
        try {
            const result = await window.apiClient.get(`/users/wallet/${walletAddress}`);
            return result.user || result.data || null;
        } catch (error) {
            console.warn('Error fetching user from API, falling back to local storage:', error);
            const userData = localStorage.getItem('evidUser_' + walletAddress);
            return userData ? JSON.parse(userData) : null;
        }
    },
    
    async saveUser(userData) {
        // Only save non-sensitive profile info locally for UI responsiveness
        const safeData = { ...userData };
        delete safeData.password;
        localStorage.setItem('evidUser_' + (userData.walletAddress || userData.wallet_address), JSON.stringify(safeData));
        return true;
    },
    
    // Evidence API functions
    async getAllEvidence() {
        try {
            const result = await window.apiClient.get('/evidence');
            return result.data || result.evidence || [];
        } catch (error) {
            console.error('Error fetching evidence:', error);
            return [];
        }
    },
    
    async getEvidenceById(id) {
        try {
            const result = await window.apiClient.get(`/evidence/${id}`);
            return result.data || result.evidence || null;
        } catch (error) {
            console.error('Error fetching evidence by ID:', error);
            return null;
        }
    },
    
    async getEvidenceByCase(caseId) {
        try {
            const result = await window.apiClient.get(`/evidence/case/${caseId}`);
            return result.data || result.evidence || [];
        } catch (error) {
            console.error('Error fetching evidence by case:', error);
            return [];
        }
    },
    
    async getAllCases() {
        try {
            const result = await window.apiClient.get('/cases');
            return result.data || result.cases || [];
        } catch (error) {
            console.error('Error fetching cases:', error);
            return [];
        }
    },
    
    async getCaseById(id) {
        try {
            const result = await window.apiClient.get(`/cases/${id}/details`);
            return result.data || result.case || null;
        } catch (error) {
            console.error('Error fetching case by ID:', error);
            return null;
        }
    }
};

// Simple notifications
window.simpleNotifications = {
    addNotification(title, message, type) {
        console.log(`${type}: ${title} - ${message}`);
        // If there's a UI notification system, trigger it here
        if (window.showNotification) {
            window.showNotification(title, message, type);
        }
    }
};