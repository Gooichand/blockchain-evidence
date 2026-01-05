const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('CRITICAL: Missing SUPABASE_URL or SUPABASE_KEY environment variables. Database connection cannot be established.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
