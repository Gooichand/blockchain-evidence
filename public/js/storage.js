/**
 * Real Storage System - LocalStorage Only
 */

// Simple storage system using localStorage only
window.storage = {
    async getUser(walletAddress) {
        const userData = localStorage.getItem('evidUser_' + walletAddress);
        return userData ? JSON.parse(userData) : null;
    },
    
    async saveUser(userData) {
        localStorage.setItem('evidUser_' + userData.walletAddress, JSON.stringify(userData));
        return true;
    },
    
    async getAllUsers() {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('evidUser_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    users.push(userData);
                } catch (e) {}
            }
        }
        return users;
    }
};

// Simple notifications
window.simpleNotifications = {
    addNotification(title, message, type) {
        console.log(`${type}: ${title} - ${message}`);
    }
};