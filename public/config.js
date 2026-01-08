// Essential Configuration
const config = {
    // Supabase Database (Use environment variables in production)
    SUPABASE_URL: process.env.SUPABASE_URL || 'your_supabase_url_here',
    SUPABASE_KEY: process.env.SUPABASE_KEY || 'your_supabase_anon_key_here',

    // File Upload Limits
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],

    // Network
    NETWORK_NAME: 'Sepolia Testnet',
    TARGET_CHAIN_ID: '0xaa36a7', // Sepolia
    DEMO_MODE: false
};