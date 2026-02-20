/**
 * MilkBook Supabase Client
 * Direct Supabase connection for Vercel deployment
 */

// Initialize Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;

if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Check if configured
const IS_CONFIGURED = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Use Supabase if configured
const USE_SUPABASE = IS_CONFIGURED && localStorage.getItem('milkbook_use_supabase') === 'true';

console.log('📊 MilkBook:', USE_SUPABASE ? '✅ Supabase Connected' : '⚠️ LocalStorage Only');
if (!IS_CONFIGURED) {
  console.warn('⚠️ Supabase not configured! Edit supabase-client.js with your credentials');
}

// Database operations
const MilkBookDB = {
  farmers: {
    async getAll() {
      if (!supabase) return { farmers: [] };
      const { data, error } = await supabase.from('farmers').select('*');
      if (error) throw error;
      return { farmers: data || [] };
    },
    
    async create(farmer) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('farmers').insert([farmer]).select();
      if (error) throw error;
      return data[0];
    },
    
    async update(id, updates) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('farmers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    
    async delete(id) {
      if (!supabase) return null;
      const { error } = await supabase.from('farmers').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },
  
  entries: {
    async getAll(filters = {}) {
      if (!supabase) return { entries: [] };
      let query = supabase.from('milk_intake_entries').select('*, farmers(name, phone)');
      
      if (filters.date) query = query.eq('date', filters.date);
      if (filters.farmer_id) query = query.eq('farmer_id', filters.farmer_id);
      
      const { data, error } = await query;
      if (error) throw error;
      return { entries: data || [] };
    },
    
    async create(entry) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('milk_intake_entries').insert([entry]).select();
      if (error) throw error;
      return data[0];
    },
    
    async update(id, updates) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('milk_intake_entries').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
  },
  
  customers: {
    async getAll() {
      if (!supabase) return { customers: [] };
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return { customers: data || [] };
    },
    
    async create(customer) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('customers').insert([customer]).select();
      if (error) throw error;
      return data[0];
    },
    
    async update(id, updates) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
  },
  
  sales: {
    async getAll(filters = {}) {
      if (!supabase) return { sales: [] };
      let query = supabase.from('retail_sales').select('*');
      
      if (filters.date) query = query.eq('date', filters.date);
      
      const { data, error } = await query;
      if (error) throw error;
      return { sales: data || [] };
    },
    
    async create(sale) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('retail_sales').insert([sale]).select();
      if (error) throw error;
      return data[0];
    }
  }
};

// Auth operations
const MilkBookAuth = {
  async login(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  
  async signup(email, password, shopName) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    // Create shop and user profile
    if (data.user) {
      await supabase.from('shops').insert([{ id: data.user.id, name: shopName }]);
      await supabase.from('users').insert([{ id: data.user.id, shop_id: data.user.id, role: 'admin' }]);
    }
    
    return data;
  },
  
  async logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    localStorage.removeItem('milkbook_session');
  },
  
  isLoggedIn() {
    const session = localStorage.getItem('milkbook_session');
    if (!session) return false;
    const sessionData = JSON.parse(session);
    return sessionData.expires > Date.now();
  },
  
  getSession() {
    const session = localStorage.getItem('milkbook_session');
    if (!session) return null;
    return JSON.parse(session);
  }
};

// Export for use in browser
if (typeof window !== 'undefined') {
  window.MilkBookDB = MilkBookDB;
  window.MilkBookAuth = MilkBookAuth;
  window.USE_SUPABASE = USE_SUPABASE;
  window.IS_CONFIGURED = IS_CONFIGURED;
}
