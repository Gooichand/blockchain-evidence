const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://vkqswulxmuuganmjqumb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcXN3dWx4bXV1Z2FubWpxdW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODc3OTQsImV4cCI6MjA4MjM2Mzc5NH0.LsZKX2aThok0APCNXr9yQ8FnuJnIw6v8RsTIxVLFB4U';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
