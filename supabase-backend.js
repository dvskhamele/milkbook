/**
 * MilkBook Supabase Backend
 * Works with Supabase database
 * Falls back to LocalStorage if Supabase fails
 */

// Supabase Configuration - REPLACE THESE WITH YOUR CREDENTIALS
const MILKBOOK_SUPABASE_URL = 'https://demo-test.supabase.co';  // Demo URL (will fail, falls back to LocalStorage)
const MILKBOOK_SUPABASE_ANON_KEY = 'demo-key';  // Demo key (will fail, falls back to LocalStorage)

// Initialize Supabase client
let milkbookSupabaseClient = null;
let useSupabase = false;

if (typeof window !== 'undefined' && window.supabase) {
  try {
    milkbookSupabaseClient = window.supabase.createClient(MILKBOOK_SUPABASE_URL, MILKBOOK_SUPABASE_ANON_KEY);
    console.log('📡 Supabase client initialized');
  } catch (error) {
    console.warn('⚠️ Supabase init failed, using LocalStorage:', error.message);
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  if (!milkbookSupabaseClient) return false;
  
  try {
    // Try to fetch from a table (will fail if credentials invalid)
    const { error } = await milkbookSupabaseClient.from('farmers').select('id').limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase connection failed:', error.message);
      console.log('💡 Falling back to LocalStorage');
      return false;
    }
    
    console.log('✅ Supabase connected successfully!');
    useSupabase = true;
    return true;
  } catch (error) {
    console.warn('⚠️ Supabase test failed:', error.message);
    return false;
  }
}

// Run connection test
testSupabaseConnection();

// Database operations with automatic fallback
const MilkBookDB = {
  farmers: {
    async getAll() {
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('farmers').select('*');
          if (error) throw error;
          console.log('✅ Loaded farmers from Supabase:', data?.length || 0);
          return { farmers: data || [] };
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      console.log('💾 Loaded farmers from LocalStorage:', farmers.length);
      return { farmers };
    },
    
    async create(farmer) {
      const newFarmer = {
        ...farmer,
        id: farmer.id || 'f_' + Date.now(),
        created_at: new Date().toISOString()
      };
      
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('farmers').insert([newFarmer]).select();
          if (error) throw error;
          console.log('✅ Farmer saved to Supabase:', newFarmer.name);
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      farmers.push(newFarmer);
      localStorage.setItem('milkbook_farmers', JSON.stringify(farmers));
      console.log('💾 Farmer saved to LocalStorage:', newFarmer.name);
      return newFarmer;
    },
    
    async update(id, updates) {
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('farmers').update(updates).eq('id', id).select();
          if (error) throw error;
          console.log('✅ Farmer updated in Supabase');
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const index = farmers.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Farmer not found');
      
      farmers[index] = { ...farmers[index], ...updates };
      localStorage.setItem('milkbook_farmers', JSON.stringify(farmers));
      console.log('💾 Farmer updated in LocalStorage');
      return farmers[index];
    },
    
    async delete(id) {
      if (useSupabase && supabase) {
        try {
          const { error } = await milkbookSupabaseClient.from('farmers').delete().eq('id', id);
          if (error) throw error;
          console.log('✅ Farmer deleted from Supabase');
          return true;
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const filtered = farmers.filter(f => f.id !== id);
      localStorage.setItem('milkbook_farmers', JSON.stringify(filtered));
      console.log('💾 Farmer deleted from LocalStorage');
      return true;
    }
  },

  entries: {
    async getAll(filters = {}) {
      if (useSupabase && supabase) {
        try {
          let query = milkbookSupabaseClient.from('milk_intake_entries').select('*, farmers(name, phone)');
          
          if (filters.date) query = query.eq('date', filters.date);
          if (filters.farmer_id) query = query.eq('farmer_id', filters.farmer_id);
          
          const { data, error } = await query;
          if (error) throw error;
          console.log('✅ Loaded entries from Supabase:', data?.length || 0);
          return { entries: data || [] };
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      console.log('💾 Loaded entries from LocalStorage:', entries.length);
      return { entries };
    },
    
    async create(entry) {
      const newEntry = {
        ...entry,
        id: entry.id || 'e_' + Date.now(),
        created_at: new Date().toISOString()
      };
      
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('milk_intake_entries').insert([newEntry]).select();
          if (error) throw error;
          console.log('✅ Entry saved to Supabase');
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      entries.push(newEntry);
      localStorage.setItem('milkbook_entries', JSON.stringify(entries));
      console.log('💾 Entry saved to LocalStorage');
      return newEntry;
    },
    
    async update(id, updates) {
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('milk_intake_entries').update(updates).eq('id', id).select();
          if (error) throw error;
          console.log('✅ Entry updated in Supabase');
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Entry not found');
      
      entries[index] = { ...entries[index], ...updates };
      localStorage.setItem('milkbook_entries', JSON.stringify(entries));
      console.log('💾 Entry updated in LocalStorage');
      return entries[index];
    }
  },

  customers: {
    async getAll() {
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('customers').select('*');
          if (error) throw error;
          console.log('✅ Loaded customers from Supabase:', data?.length || 0);
          return { customers: data || [] };
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const customers = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      console.log('💾 Loaded customers from LocalStorage:', customers.length);
      return { customers };
    },
    
    async create(customer) {
      const newCustomer = {
        ...customer,
        id: customer.id || 'c_' + Date.now(),
        created_at: new Date().toISOString()
      };
      
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('customers').insert([newCustomer]).select();
          if (error) throw error;
          console.log('✅ Customer saved to Supabase');
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const customers = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      customers.push(newCustomer);
      localStorage.setItem('mr_pos_customers', JSON.stringify(customers));
      console.log('💾 Customer saved to LocalStorage');
      return newCustomer;
    },
    
    async update(id, updates) {
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('customers').update(updates).eq('id', id).select();
          if (error) throw error;
          console.log('✅ Customer updated in Supabase');
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const customers = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Customer not found');
      
      customers[index] = { ...customers[index], ...updates };
      localStorage.setItem('mr_pos_customers', JSON.stringify(customers));
      console.log('💾 Customer updated in LocalStorage');
      return customers[index];
    }
  },

  sales: {
    async getAll(filters = {}) {
      if (useSupabase && supabase) {
        try {
          let query = milkbookSupabaseClient.from('retail_sales').select('*');
          
          if (filters.date) query = query.eq('date', filters.date);
          
          const { data, error } = await query;
          if (error) throw error;
          console.log('✅ Loaded sales from Supabase:', data?.length || 0);
          return { sales: data || [] };
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const sales = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      console.log('💾 Loaded sales from LocalStorage:', sales.length);
      return { sales };
    },
    
    async create(sale) {
      const newSale = {
        ...sale,
        id: sale.id || 's_' + Date.now(),
        created_at: new Date().toISOString()
      };
      
      if (useSupabase && supabase) {
        try {
          const { data, error } = await milkbookSupabaseClient.from('retail_sales').insert([newSale]).select();
          if (error) throw error;
          console.log('✅ Sale saved to Supabase');
          return data[0];
        } catch (error) {
          console.warn('⚠️ Supabase failed, using LocalStorage:', error.message);
          useSupabase = false;
        }
      }
      
      // Fallback to LocalStorage
      const sales = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      sales.push(newSale);
      localStorage.setItem('mr_sales_history', JSON.stringify(sales));
      console.log('💾 Sale saved to LocalStorage');
      return newSale;
    }
  },
  
  // Check connection status
  getStatus() {
    return {
      useSupabase: useSupabase,
      supabaseAvailable: !!supabase,
      message: useSupabase ? '✅ Using Supabase' : '💾 Using LocalStorage'
    };
  }
};

// Export for use in browser
if (typeof window !== 'undefined') {
  window.MilkBookDB = MilkBookDB;
  window.USE_SUPABASE = useSupabase;
  window.IS_CONFIGURED = true;
  window.DEMO_MODE = !useSupabase;
  
  // Log status
  setTimeout(() => {
    const status = MilkBookDB.getStatus();
    console.log('📊 MilkBook Backend:', status.message);
    if (!useSupabase) {
      console.log('💡 To use Supabase, add your credentials in supabase-client.js');
    }
  }, 100);
}
