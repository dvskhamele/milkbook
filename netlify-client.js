/**
 * MilkBook Netlify Client
 * Connects frontend to Netlify serverless functions
 * Includes authentication and all backend features
 */

const API_BASE = '/.netlify/functions';

// Get current session
function getSession() {
  const session = localStorage.getItem('milkbook_session');
  if (!session) return null;
  
  const sessionData = JSON.parse(session);
  if (sessionData.expires < Date.now()) {
    localStorage.removeItem('milkbook_session');
    return null;
  }
  
  return sessionData;
}

// Get auth headers
function getAuthHeaders() {
  const session = getSession();
  if (!session) return {};
  
  return {
    'Authorization': `Bearer ${session.token}`,
  };
}

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Farmers API
const farmers = {
  // Get all farmers
  async getAll(dairyCenterId = null) {
    const params = new URLSearchParams();
    if (dairyCenterId) params.append('dairy_center_id', dairyCenterId);
    
    const query = params.toString() ? `?${params}` : '';
    return apiCall(`/farmers${query}`);
  },
  
  // Get farmer by ID
  async getById(id) {
    return apiCall(`/farmers/${id}`);
  },
  
  // Create farmer
  async create(farmerData) {
    return apiCall('/farmers', {
      method: 'POST',
      body: JSON.stringify(farmerData),
    });
  },
  
  // Update farmer
  async update(id, updates) {
    return apiCall(`/farmers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  // Delete farmer
  async delete(id) {
    return apiCall(`/farmers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Milk Entries API
const milkEntries = {
  // Get all entries
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.dairy_center_id) params.append('dairy_center_id', filters.dairy_center_id);
    if (filters.farmer_id) params.append('farmer_id', filters.farmer_id);
    if (filters.date) params.append('date', filters.date);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const query = params.toString() ? `?${params}` : '';
    return apiCall(`/milk-entries${query}`);
  },
  
  // Get entry by ID
  async getById(id) {
    return apiCall(`/milk-entries/${id}`);
  },
  
  // Create entry
  async create(entryData) {
    return apiCall('/milk-entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },
  
  // Update entry
  async update(id, updates) {
    return apiCall(`/milk-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  // Delete entry
  async delete(id) {
    return apiCall(`/milk-entries/${id}`, {
      method: 'DELETE',
    });
  },
};

// Payments API
const payments = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.dairy_center_id) params.append('dairy_center_id', filters.dairy_center_id);
    if (filters.farmer_id) params.append('farmer_id', filters.farmer_id);
    if (filters.type) params.append('type', filters.type);
    
    const query = params.toString() ? `?${params}` : '';
    return apiCall(`/payments${query}`);
  },
  
  async create(paymentData) {
    return apiCall('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  
  async update(id, updates) {
    return apiCall(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  async delete(id) {
    return apiCall(`/payments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Sales API
const sales = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.dairy_center_id) params.append('dairy_center_id', filters.dairy_center_id);
    if (filters.date) params.append('date', filters.date);
    
    const query = params.toString() ? `?${params}` : '';
    return apiCall(`/sales${query}`);
  },
  
  async create(saleData) {
    return apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },
  
  async update(id, updates) {
    return apiCall(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  async delete(id) {
    return apiCall(`/sales/${id}`, {
      method: 'DELETE',
    });
  },
};

// Export for use in browser
window.MilkBookAPI = {
  farmers,
  milkEntries,
  payments,
  sales,
  auth: {
    // PIN login
    async loginWithPin(shopId, userId, pin) {
      return apiCall('/auth-verify-pin', {
        method: 'POST',
        body: JSON.stringify({ shop_id: shopId, user_id: userId, pin }),
      });
    },
    
    // Password login (Supabase)
    async loginWithPassword(email, password) {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Get user profile
      const { data: profile } = await window.supabase
        .from('users')
        .select('shop_id, role')
        .eq('id', data.user.id)
        .single();
      
      return {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          shop_id: profile.shop_id,
          role: profile.role
        }
      };
    },
    
    // Logout
    async logout() {
      localStorage.removeItem('milkbook_session');
      if (window.supabase) {
        await window.supabase.auth.signOut();
      }
    },
    
    // Check if logged in
    isLoggedIn() {
      return getSession() !== null;
    },
    
    // Get current user
    getCurrentUser() {
      return getSession();
    },
    
    // Require auth (redirect if not logged in)
    requireAuth() {
      if (!this.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    }
  }
};

// Helper to switch between API and localStorage
const USE_API = false; // Set to true to use Netlify functions

// Fallback to localStorage if API is disabled
const localData = {
  farmers: {
    async getAll() {
      return { farmers: JSON.parse(localStorage.getItem('milkbook_farmers') || '[]') };
    },
    async create(data) {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const newFarmer = { ...data, id: 'local_' + Date.now() };
      farmers.push(newFarmer);
      localStorage.setItem('milkbook_farmers', JSON.stringify(farmers));
      return { farmer: newFarmer };
    },
    async update(id, updates) {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const index = farmers.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Farmer not found');
      farmers[index] = { ...farmers[index], ...updates };
      localStorage.setItem('milkbook_farmers', JSON.stringify(farmers));
      return { farmer: farmers[index] };
    },
    async delete(id) {
      const farmers = JSON.parse(localStorage.getItem('milkbook_farmers') || '[]');
      const filtered = farmers.filter(f => f.id !== id);
      localStorage.setItem('milkbook_farmers', JSON.stringify(filtered));
      return { message: 'Deleted' };
    },
  },
  
  milkEntries: {
    async getAll() {
      return { entries: JSON.parse(localStorage.getItem('milkbook_entries') || '[]') };
    },
    async create(data) {
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const newEntry = { ...data, id: 'local_' + Date.now() };
      entries.push(newEntry);
      localStorage.setItem('milkbook_entries', JSON.stringify(entries));
      return { entry: newEntry };
    },
    async update(id, updates) {
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Entry not found');
      entries[index] = { ...entries[index], ...updates };
      localStorage.setItem('milkbook_entries', JSON.stringify(entries));
      return { entry: entries[index] };
    },
    async delete(id) {
      const entries = JSON.parse(localStorage.getItem('milkbook_entries') || '[]');
      const filtered = entries.filter(e => e.id !== id);
      localStorage.setItem('milkbook_entries', JSON.stringify(filtered));
      return { message: 'Deleted' };
    },
  },
};

// Smart API that falls back to localStorage
const SmartAPI = {
  farmers: {
    async getAll(dairyCenterId) {
      if (USE_API) {
        try {
          return await farmers.getAll(dairyCenterId);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.farmers.getAll();
    },
    async create(data) {
      if (USE_API) {
        try {
          return await farmers.create(data);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.farmers.create(data);
    },
    async update(id, updates) {
      if (USE_API) {
        try {
          return await farmers.update(id, updates);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.farmers.update(id, updates);
    },
    async delete(id) {
      if (USE_API) {
        try {
          return await farmers.delete(id);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.farmers.delete(id);
    },
  },
  
  milkEntries: {
    async getAll(filters) {
      if (USE_API) {
        try {
          return await milkEntries.getAll(filters);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.milkEntries.getAll();
    },
    async create(data) {
      if (USE_API) {
        try {
          return await milkEntries.create(data);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.milkEntries.create(data);
    },
    async update(id, updates) {
      if (USE_API) {
        try {
          return await milkEntries.update(id, updates);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.milkEntries.update(id, updates);
    },
    async delete(id) {
      if (USE_API) {
        try {
          return await milkEntries.delete(id);
        } catch (error) {
          console.warn('API failed, falling back to localStorage');
        }
      }
      return localData.milkEntries.delete(id);
    },
  },
};

// Export smart API
window.MilkBookSmartAPI = SmartAPI;
