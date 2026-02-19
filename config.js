/**
 * MilkBook Configuration
 * Load environment variables and configure Supabase
 */

// Supabase configuration
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  anonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
};

// Initialize Supabase client
let supabase = null;

if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

// Export configuration
window.MilkBookConfig = {
  supabaseUrl: SUPABASE_CONFIG.url,
  supabaseAnonKey: SUPABASE_CONFIG.anonKey,
  supabaseServiceKey: SUPABASE_CONFIG.serviceKey,
  
  // Get Supabase client
  getSupabase() {
    return supabase;
  },
  
  // Check if configured
  isConfigured() {
    return SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' && 
           SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY';
  },
  
  // Test database connection
  async testConnection() {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }
    
    try {
      // Test by fetching shops
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .limit(1);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Auto-initialize on page load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.MilkBookConfig.isConfigured()) {
      console.warn('⚠️ Supabase not configured. Please set environment variables.');
    } else {
      console.log('✅ Supabase connected:', SUPABASE_CONFIG.url);
    }
  });
}
