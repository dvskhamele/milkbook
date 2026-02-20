/**
 * MilkBook Backend - Simple & Works Immediately
 * No configuration needed - uses LocalStorage
 * Can add Supabase later if needed
 */

console.log('💾 MilkBook Backend: LocalStorage Mode Active');

// Simple database using LocalStorage
const MilkBookDB = {
  // Initialize storage
  init() {
    if (!localStorage.getItem('milkbook_farmers')) {
      localStorage.setItem('milkbook_farmers', JSON.stringify([]));
    }
    if (!localStorage.getItem('milkbook_entries')) {
      localStorage.setItem('milkbook_entries', JSON.stringify([]));
    }
    if (!localStorage.getItem('mr_pos_customers')) {
      localStorage.setItem('mr_pos_customers', JSON.stringify([]));
    }
    if (!localStorage.getItem('mr_sales_history')) {
      localStorage.setItem('mr_sales_history', JSON.stringify([]));
    }
    console.log('✅ Database initialized');
  },

  // Farmers
  farmers: {
    async getAll() {
      const data = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      console.log('📋 Loaded', data.length, 'farmers');
      return { farmers: data };
    },
    
    async create(farmer) {
      const data = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const newFarmer = {
        ...farmer,
        id: farmer.id || 'f_' + Date.now(),
        created_at: new Date().toISOString()
      };
      data.push(newFarmer);
      localStorage.setItem('milkbook_farmers', JSON.stringify(data));
      console.log('✅ Farmer created:', newFarmer.name);
      return newFarmer;
    },
    
    async update(id, updates) {
      const data = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const index = data.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Farmer not found');
      data[index] = { ...data[index], ...updates };
      localStorage.setItem('milkbook_farmers', JSON.stringify(data));
      console.log('✅ Farmer updated');
      return data[index];
    },
    
    async delete(id) {
      const data = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const filtered = data.filter(f => f.id !== id);
      localStorage.setItem('milkbook_farmers', JSON.stringify(filtered));
      console.log('✅ Farmer deleted');
      return true;
    }
  },

  // Milk Entries
  entries: {
    async getAll(filters = {}) {
      let data = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      
      if (filters.date) {
        data = data.filter(e => e.date === filters.date);
      }
      if (filters.farmer_id) {
        data = data.filter(e => e.farmer_id === filters.farmer_id);
      }
      
      console.log('📋 Loaded', data.length, 'entries');
      return { entries: data };
    },
    
    async create(entry) {
      const data = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const newEntry = {
        ...entry,
        id: entry.id || 'e_' + Date.now(),
        created_at: new Date().toISOString()
      };
      data.push(newEntry);
      localStorage.setItem('milkbook_entries', JSON.stringify(data));
      console.log('✅ Entry created:', entry.farmerName, entry.quantity, 'L');
      return newEntry;
    },
    
    async update(id, updates) {
      const data = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const index = data.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Entry not found');
      data[index] = { ...data[index], ...updates };
      localStorage.setItem('milkbook_entries', JSON.stringify(data));
      console.log('✅ Entry updated');
      return data[index];
    }
  },

  // POS Customers
  customers: {
    async getAll() {
      const data = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      console.log('📋 Loaded', data.length, 'customers');
      return { customers: data };
    },
    
    async create(customer) {
      const data = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      const newCustomer = {
        ...customer,
        id: customer.id || 'c_' + Date.now(),
        created_at: new Date().toISOString()
      };
      data.push(newCustomer);
      localStorage.setItem('mr_pos_customers', JSON.stringify(data));
      console.log('✅ Customer created:', newCustomer.name);
      return newCustomer;
    },
    
    async update(id, updates) {
      const data = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      const index = data.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Customer not found');
      data[index] = { ...data[index], ...updates };
      localStorage.setItem('mr_pos_customers', JSON.stringify(data));
      console.log('✅ Customer updated');
      return data[index];
    }
  },

  // POS Sales
  sales: {
    async getAll(filters = {}) {
      let data = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      
      if (filters.date) {
        data = data.filter(s => s.date === filters.date);
      }
      
      console.log('📋 Loaded', data.length, 'sales');
      return { sales: data };
    },
    
    async create(sale) {
      const data = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      const newSale = {
        ...sale,
        id: sale.id || 's_' + Date.now(),
        created_at: new Date().toISOString()
      };
      data.push(newSale);
      localStorage.setItem('mr_sales_history', JSON.stringify(data));
      console.log('✅ Sale created:', sale.customerName, '₹' + sale.totalAmount);
      return newSale;
    }
  },
  
  // Status
  getStatus() {
    return {
      useSupabase: false,
      supabaseAvailable: false,
      message: '💾 Using LocalStorage'
    };
  }
};

// Initialize
MilkBookDB.init();

// Export
if (typeof window !== 'undefined') {
  window.MilkBookDB = MilkBookDB;
  window.USE_SUPABASE = false;
  window.IS_CONFIGURED = true;
  window.DEMO_MODE = true;
  console.log('✅ Backend ready - Start using the app!');
}
