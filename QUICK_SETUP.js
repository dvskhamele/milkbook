// MilkBook - Quick Setup Instructions

// 1. OPEN BROWSER CONSOLE (F12) ON YOUR DEPLOYED APP
// 2. PASTE THESE COMMANDS ONE BY ONE:

// Step 1: Check if Supabase is configured
console.log('Supabase Configured:', window.IS_CONFIGURED);
console.log('Using Supabase:', window.USE_SUPABASE);

// Step 2: If NOT configured, you need to edit supabase-client.js
// Go to: https://github.com/dvskhamele/milkbook/blob/main/supabase-client.js
// Replace lines 7-8 with your actual Supabase credentials:
// const SUPABASE_URL = 'https://your-project-id.supabase.co';
// const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Step 3: Enable Supabase mode (after configuring credentials)
localStorage.setItem('milkbook_use_supabase', 'true');
location.reload();

// Step 4: Verify it's working
console.log('After reload - Using Supabase:', window.USE_SUPABASE);

// Step 5: Test database connection
(async () => {
  try {
    const result = await window.MilkBookDB.farmers.getAll();
    console.log('✅ Database connection working! Farmers:', result.farmers.length);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure you:');
    console.log('   1. Set Supabase credentials in supabase-client.js');
    console.log('   2. Created database tables (see VERCEL_DEPLOYMENT.md)');
    console.log('   3. Enabled Supabase mode with localStorage.setItem("milkbook_use_supabase", "true")');
  }
})();

// Step 6: Test saving a farmer
(async () => {
  if (!window.USE_SUPABASE) {
    console.log('⚠️ Supabase mode not enabled. Run: localStorage.setItem("milkbook_use_supabase", "true"); location.reload();');
    return;
  }
  
  try {
    const testFarmer = {
      shop_id: 'test-shop-id', // Replace with your actual shop_id
      name: 'Test Farmer',
      phone: '9876543210',
      balance: 0
    };
    
    const saved = await window.MilkBookDB.farmers.create(testFarmer);
    console.log('✅ Farmer saved to Supabase!', saved);
  } catch (error) {
    console.error('❌ Failed to save farmer:', error.message);
  }
})();

// ALTERNATIVE: Use LocalStorage only (no Supabase)
// If you don't want to set up Supabase right now, data will still save to LocalStorage
// Just don't enable Supabase mode
console.log('💡 LocalStorage is always available for offline use');
console.log('💡 To check LocalStorage data:');
console.log('   Farmers:', JSON.parse(localStorage.getItem('milkbook_farmers') || '[]').length);
console.log('   Entries:', JSON.parse(localStorage.getItem('milkbook_entries') || '[]').length);
