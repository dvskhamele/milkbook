/**
 * MilkBook Backend - Demo Mode
 * Works immediately with localStorage as backend
 * No configuration needed!
 */

// Demo mode - always enabled
const DEMO_MODE = true;
const USE_SUPABASE = false;

console.log('📊 MilkBook: ✅ Demo Mode Active (LocalStorage Backend)');

// Simulated database in localStorage
const DemoDB = {
  // Initialize tables if not exist
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
    console.log('✅ Demo database initialized');
  },

  // Farmers operations
  farmers: {
    async getAll() {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      console.log('💾 Loaded farmers:', farmers.length);
      return { farmers };
    },
    
    async create(farmer) {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const newFarmer = {
        ...farmer,
        id: farmer.id || 'f_' + Date.now(),
        created_at: new Date().toISOString()
      };
      farmers.push(newFarmer);
      localStorage.setItem('milkbook_farmers', JSON.stringify(farmers));
      console.log('✅ Farmer created:', newFarmer.name);
      return newFarmer;
    },
    
    async update(id, updates) {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const index = farmers.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Farmer not found');
      
      farmers[index] = { ...farmers[index], ...updates };
      localStorage.setItem('milkbook_farmers', JSON.stringify(farmers));
      console.log('✅ Farmer updated:', farmers[index].name);
      return farmers[index];
    },
    
    async delete(id) {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const filtered = farmers.filter(f => f.id !== id);
      localStorage.setItem('milkbook_farmers', JSON.stringify(filtered));
      console.log('✅ Farmer deleted');
      return true;
    }
  },

  // Milk entries operations
  entries: {
    async getAll(filters = {}) {
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      let filtered = entries;
      
      if (filters.date) {
        filtered = entries.filter(e => e.date === filters.date);
      }
      if (filters.farmer_id) {
        filtered = entries.filter(e => e.farmer_id === filters.farmer_id);
      }
      
      console.log('💾 Loaded entries:', filtered.length);
      return { entries: filtered };
    },
    
    async create(entry) {
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const newEntry = {
        ...entry,
        id: entry.id || 'e_' + Date.now(),
        created_at: new Date().toISOString()
      };
      entries.push(newEntry);
      localStorage.setItem('milkbook_entries', JSON.stringify(entries));
      console.log('✅ Entry created:', entry.farmer_name, entry.quantity, 'L');
      return newEntry;
    },
    
    async update(id, updates) {
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Entry not found');
      
      entries[index] = { ...entries[index], ...updates };
      localStorage.setItem('milkbook_entries', JSON.stringify(entries));
      console.log('✅ Entry updated');
      return entries[index];
    }
  },

  // Customers operations (POS)
  customers: {
    async getAll() {
      const customers = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      console.log('💾 Loaded customers:', customers.length);
      return { customers };
    },
    
    async create(customer) {
      const customers = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      const newCustomer = {
        ...customer,
        id: customer.id || 'c_' + Date.now(),
        created_at: new Date().toISOString()
      };
      customers.push(newCustomer);
      localStorage.setItem('mr_pos_customers', JSON.stringify(customers));
      console.log('✅ Customer created:', newCustomer.name);
      return newCustomer;
    },
    
    async update(id, updates) {
      const customers = JSON.parse(localStorage.getItem('mr_pos_customers') || '[]');
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Customer not found');
      
      customers[index] = { ...customers[index], ...updates };
      localStorage.setItem('mr_pos_customers', JSON.stringify(customers));
      console.log('✅ Customer updated');
      return customers[index];
    }
  },

  // Sales operations (POS)
  sales: {
    async getAll(filters = {}) {
      const sales = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      let filtered = sales;
      
      if (filters.date) {
        filtered = sales.filter(s => s.date === filters.date);
      }
      
      console.log('💾 Loaded sales:', filtered.length);
      return { sales: filtered };
    },
    
    async create(sale) {
      const sales = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      const newSale = {
        ...sale,
        id: sale.id || 's_' + Date.now(),
        created_at: new Date().toISOString()
      };
      sales.push(newSale);
      localStorage.setItem('mr_sales_history', JSON.stringify(sales));
      console.log('✅ Sale created:', sale.customer_name, '₹' + sale.total_amount);
      return newSale;
    }
  }
};

// Initialize demo database
DemoDB.init();

// Export for use in browser
if (typeof window !== 'undefined') {
  window.MilkBookDB = DemoDB;
  window.USE_SUPABASE = false;
  window.IS_CONFIGURED = true; // Demo mode is always configured
  window.DEMO_MODE = true;
}
