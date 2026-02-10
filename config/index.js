require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = process.env.PORT || 3000;

const allowedRoles = [
    'public_viewer',
    'investigator',
    'forensic_analyst',
    'legal_professional',
    'court_official',
    'evidence_manager',
    'auditor',
    'admin'
];

// Store connected users for real-time notifications
const connectedUsers = new Map();

module.exports = {
    supabase,
    PORT,
    allowedRoles,
    connectedUsers
};
