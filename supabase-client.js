/**
 * Supabase Client for Browser
 * 
 * This client is used in the browser to interact with Supabase.
 * It uses the anon/public key which is safe to expose in client-side code.
 */

// Supabase configuration - Replace with your actual values
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Your anon/public key

// Simple Supabase client implementation
class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
    this.headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Auth methods
  auth = {
    signUp: async ({ email, password, options }) => {
      const response = await fetch(`${this.url}/auth/v1/signup`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          email,
          password,
          data: options?.data || {}
        })
      });
      return response.json();
    },

    signInWithPassword: async ({ email, password }) => {
      const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ email, password })
      });
      return response.json();
    },

    signOut: async () => {
      const response = await fetch(`${this.url}/auth/v1/logout`, {
        method: 'POST',
        headers: this.headers
      });
      return response.ok;
    },

    getSession: async () => {
      const session = localStorage.getItem('supabase_session');
      return session ? JSON.parse(session) : null;
    },

    setSession: (session) => {
      localStorage.setItem('supabase_session', JSON.stringify(session));
    }
  };

  // Database methods
  from(table) {
    return {
      select: (columns = '*') => {
        return {
          eq: async (column, value) => {
            const response = await fetch(
              `${this.url}/rest/v1/${table}?${column}=eq.${value}`,
              { headers: this.headers }
            );
            return { data: await response.json(), error: null };
          },
          then: async () => {
            const response = await fetch(
              `${this.url}/rest/v1/${table}?select=${columns}`,
              { headers: this.headers }
            );
            const data = await response.json();
            return { data, error: null };
          }
        };
      },

      insert: (rows) => {
        return {
          select: async () => {
            const response = await fetch(
              `${this.url}/rest/v1/${table}?select=*`,
              {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(rows)
              }
            );
            const data = await response.json();
            return { data: Array.isArray(data) ? data[0] : data, error: null };
          }
        };
      },

      update: (updates) => {
        return {
          eq: async (column, value) => {
            const response = await fetch(
              `${this.url}/rest/v1/${table}?${column}=eq.${value}`,
              {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(updates)
              }
            );
            return { data: await response.json(), error: null };
          }
        };
      },

      delete: () => {
        return {
          eq: async (column, value) => {
            const response = await fetch(
              `${this.url}/rest/v1/${table}?${column}=eq.${value}`,
              {
                method: 'DELETE',
                headers: this.headers
              }
            );
            return { data: null, error: response.ok ? null : { message: 'Delete failed' } };
          }
        };
      }
    };
  }
}

// Create and export client instance
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API helper functions for MilkBook
const api = {
  // Farmers API
  farmers: {
    getAll: async (dairyCenterId) => {
      const response = await fetch(`/api/farmers?dairy_center_id=${dairyCenterId}`);
      return response.json();
    },
    create: async (farmer) => {
      const response = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmer)
      });
      return response.json();
    },
    update: async (id, updates) => {
      const response = await fetch(`/api/farmers?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`/api/farmers?id=${id}`, {
        method: 'DELETE'
      });
      return response.json();
    }
  },

  // Milk Entries API
  milkEntries: {
    getAll: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/milk-entries?${queryString}`);
      return response.json();
    },
    create: async (entry) => {
      const response = await fetch('/api/milk-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return response.json();
    },
    update: async (id, updates) => {
      const response = await fetch(`/api/milk-entries?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`/api/milk-entries?id=${id}`, {
        method: 'DELETE'
      });
      return response.json();
    }
  },

  // Payments API
  payments: {
    getAll: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/payments?${queryString}`);
      return response.json();
    },
    create: async (payment) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });
      return response.json();
    },
    update: async (id, updates) => {
      const response = await fetch(`/api/payments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`/api/payments?id=${id}`, {
        method: 'DELETE'
      });
      return response.json();
    }
  },

  // Sales API
  sales: {
    getAll: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/sales?${queryString}`);
      return response.json();
    },
    create: async (sale) => {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      return response.json();
    },
    update: async (id, updates) => {
      const response = await fetch(`/api/sales?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`/api/sales?id=${id}`, {
        method: 'DELETE'
      });
      return response.json();
    }
  }
};

// Export for use in browser
window.supabase = supabase;
window.milkbookApi = api;
