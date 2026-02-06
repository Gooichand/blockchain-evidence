/**
 * EVID-DGC Configuration
 * Application configuration and constants
 */
const config = {
    // Production mode - no demo behaviors
    DEMO_MODE: false,
    
    // Blockchain configuration
    TARGET_CHAIN_ID: '0x89', // Polygon Mainnet
    NETWORK_NAME: 'Polygon Mainnet',
    
    // File upload limits
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'video/mp4',
        'video/avi',
        'video/mov',
        'audio/mp3',
        'audio/wav',
        'audio/m4a',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ],
    
    // Legacy support
    ALLOWED_TYPES: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/avi',
        'audio/mp3', 'audio/wav', 'audio/ogg',
        'application/pdf', 'application/msword',
        'text/plain', 'text/csv'
    ],
    
    // API endpoints
    API_BASE_URL: (() => {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        if (host.includes('onrender.com')) {
            return 'https://blockchain-evidence.onrender.com/api';
        }
        return window.location.origin + '/api';
    })(),
    
    // UI configuration
    VERSION: '2.0.0',
    ITEMS_PER_PAGE: 20,
    ANIMATION_DURATION: 300,
    NOTIFICATION_TIMEOUT: 5000,
    
    // Security settings
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_LOGIN_ATTEMPTS: 5,
    
    // Application info
    APP_NAME: 'EVID-DGC',
    APP_VERSION: '1.0.0',
    
    // Development settings
    DEBUG: false,
    LOG_LEVEL: 'error'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}

// Make available globally
window.config = config;