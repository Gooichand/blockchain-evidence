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
  // 'admin' intentionally excluded from public registration
];

// Store connected users for real-time notifications
const connectedUsers = new Map();

// Rate limiting configuration (env-driven with sensible defaults)
const rateLimits = {
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 100, // relaxed for local testing
  },
  api: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,
  },
  admin: {
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX, 10) || 50,
  },
  export: {
    windowMs: parseInt(process.env.RATE_LIMIT_EXPORT_WINDOW_MS, 10) || 60 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_EXPORT_MAX, 10) || 100,
  },
  timeline: {
    windowMs: parseInt(process.env.RATE_LIMIT_TIMELINE_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_TIMELINE_MAX, 10) || 100,
  },
  policy: {
    windowMs: parseInt(process.env.RATE_LIMIT_POLICY_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_POLICY_MAX, 10) || 200,
  },
};

module.exports = {
  supabase,
  PORT,
  allowedRoles,
  connectedUsers,
  rateLimits,
};
