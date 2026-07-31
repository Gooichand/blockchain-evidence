const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🔍 Checking admin status for wallet: 0xC7E77FdccEad5d15a71444f7fBEaa9586267602c\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERROR: Missing Supabase credentials in .env file');
  console.log('   Make sure SUPABASE_URL and SUPABASE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminStatus() {
  try {
    console.log('1. Checking if your wallet exists in database...');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', '0xC7E77FdccEad5d15a71444f7fBEaa9586267602c')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ❌ Your wallet is NOT in the database');
        console.log('   💡 Solution: Run the SQL script in Supabase to add it as admin');
      } else {
        console.log('   ❌ Database error:', error.message);
      }
    } else {
      console.log('   ✅ Your wallet found in database:');
      console.log('      Role:', user.role);
      console.log('      Is Active:', user.is_active);
      console.log('      Auth Type:', user.auth_type);
      
      if (user.role !== 'admin') {
        console.log('   ⚠️  WARNING: Your wallet is NOT an admin (role:', user.role + ')');
      } else {
        console.log('   ✅ SUCCESS: Your wallet IS an admin!');
      }
    }
    
    console.log('\n2. Checking all admin users...');
    
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('wallet_address, email, role, is_active, created_at')
      .eq('role', 'admin')
      .eq('is_active', true);
    
    if (adminError) {
      console.log('   ❌ Error fetching admins:', adminError.message);
    } else {
      console.log('   Found', admins.length, 'active admin(s):');
      admins.forEach((admin, i) => {
        console.log(`   ${i+1}. ${admin.wallet_address || admin.email} (Created: ${new Date(admin.created_at).toLocaleDateString()})`);
      });
    }
    
    console.log('\n3. Next steps:');
    if (!user || user.role !== 'admin') {
      console.log('   a. Go to https://app.supabase.com/');
      console.log('   b. Select your project');
      console.log('   c. Go to SQL Editor');
      console.log('   d. Run the SQL from add-admin-wallet.sql');
      console.log('   e. Restart your server: npm start');
    } else {
      console.log('   ✅ Your wallet is already an admin');
      console.log('   💡 Make sure to restart server after updating .env file');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkAdminStatus();