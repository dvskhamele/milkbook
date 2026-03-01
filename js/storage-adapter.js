/**
 * MilkRecord POS - Hybrid Storage Adapter
 * IndexedDB (Browser) + localStorage (Fallback)
 * Enterprise-grade data persistence
 * 
 * Usage: window.storage.get('products', id)
 *        window.storage.set('products', data)
 *        window.storage.getAll('products')
 */

(function() {
  'use strict';

  class StorageAdapter {
    constructor() {
      this.dbName = 'MilkRecordPOS';
      this.dbVersion = 1;
      this.db = null;
      this.isIndexedDB = typeof indexedDB !== 'undefined';
      this.initialized = false;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
      if (this.initialized) return this.db;

      if (!this.isIndexedDB) {
        console.log('📦 Using localStorage fallback (IndexedDB not available)');
        this.initialized = true;
        return null;
      }

      return new Promise((resolve, reject) => {
        try {
          const request = indexedDB.open(this.dbName, this.dbVersion);

          request.onerror = () => {
            console.error('❌ IndexedDB open error:', request.error);
            this.isIndexedDB = false; // Fallback to localStorage
            resolve(null);
          };

          request.onsuccess = (event) => {
            this.db = event.target.result;
            this.initialized = true;
            console.log('✅ IndexedDB initialized');
            resolve(this.db);
          };

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('🔧 Upgrading IndexedDB schema...');

            // Products store
            if (!db.objectStoreNames.contains('products')) {
              const productStore = db.createObjectStore('products', { keyPath: 'id' });
              productStore.createIndex('name', 'name', { unique: false });
              productStore.createIndex('category', 'category', { unique: false });
              productStore.createIndex('created_at', 'created_at', { unique: false });
            }

            // Customers store
            if (!db.objectStoreNames.contains('customers')) {
              const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
              customerStore.createIndex('name', 'name', { unique: false });
              customerStore.createIndex('phone', 'phone', { unique: false });
              customerStore.createIndex('created_at', 'created_at', { unique: false });
            }

            // Sales store
            if (!db.objectStoreNames.contains('sales')) {
              const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
              saleStore.createIndex('customer_name', 'customer_name', { unique: false });
              saleStore.createIndex('sale_date', 'sale_date', { unique: false });
              saleStore.createIndex('created_at', 'created_at', { unique: false });
            }

            // Sync queue store
            if (!db.objectStoreNames.contains('sync_queue')) {
              const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
              queueStore.createIndex('status', 'status', { unique: false });
              queueStore.createIndex('entity_type', 'entity_type', { unique: false });
              queueStore.createIndex('created_at', 'created_at', { unique: false });
              queueStore.createIndex('retry_count', 'retry_count', { unique: false });
            }

            // Shop settings store
            if (!db.objectStoreNames.contains('shop_settings')) {
              db.createObjectStore('shop_settings', { keyPath: 'id' });
            }

            console.log('✅ IndexedDB schema upgraded');
          };
        } catch (error) {
          console.error('❌ IndexedDB init error:', error);
          this.isIndexedDB = false;
          resolve(null);
        }
      });
    }

    /**
     * Get single item by key
     */
    async get(storeName, key) {
      await this.init();

      if (!this.isIndexedDB || !this.db) {
        // localStorage fallback
        const data = localStorage.getItem(`mr_${storeName}_${key}`);
        return data ? JSON.parse(data) : null;
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => {
            console.error('❌ Get error:', request.error);
            resolve(null);
          };
        } catch (error) {
          console.error('❌ Get error:', error);
          resolve(null);
        }
      });
    }

    /**
     * Save single item
     */
    async set(storeName, data) {
      await this.init();

      if (!data || !data.id) {
        console.error('❌ Set error: data must have id field');
        return null;
      }

      if (!this.isIndexedDB || !this.db) {
        // localStorage fallback
        localStorage.setItem(`mr_${storeName}_${data.id}`, JSON.stringify(data));
        return data.id;
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(data);

          request.onsuccess = () => {
            console.log('💾 Saved to IndexedDB:', storeName, data.id);
            resolve(data.id);
          };
          request.onerror = () => {
            console.error('❌ Set error:', request.error);
            resolve(null);
          };
        } catch (error) {
          console.error('❌ Set error:', error);
          resolve(null);
        }
      });
    }

    /**
     * Get all items from store
     */
    async getAll(storeName) {
      await this.init();

      if (!this.isIndexedDB || !this.db) {
        // localStorage fallback
        const all = [];
        const prefix = `mr_${storeName}_`;
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                all.push(JSON.parse(data));
              }
            } catch (error) {
              console.error('❌ Parse error:', error);
            }
          }
        }
        
        return all;
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onsuccess = () => {
            const result = request.result || [];
            resolve(result);
          };
          request.onerror = () => {
            console.error('❌ GetAll error:', request.error);
            resolve([]);
          };
        } catch (error) {
          console.error('❌ GetAll error:', error);
          resolve([]);
        }
      });
    }

    /**
     * Delete item
     */
    async delete(storeName, key) {
      await this.init();

      if (!this.isIndexedDB || !this.db) {
        // localStorage fallback
        localStorage.removeItem(`mr_${storeName}_${key}`);
        return true;
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.error('❌ Delete error:', request.error);
            resolve(false);
          };
        } catch (error) {
          console.error('❌ Delete error:', error);
          resolve(false);
        }
      });
    }

    /**
     * Add to sync queue with priority
     */
    async addToSyncQueue(operation, data, priority = 'normal') {
      const queueItem = {
        entity_type: operation.replace('save_', ''),
        entity_id: data.id || data.local_txn_id || `temp_${Date.now()}`,
        operation: operation,
        priority: priority || 'normal', // critical, high, normal, low
        payload_json: JSON.stringify(data),
        status: 'pending',
        retry_count: 0,
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.set('sync_queue', queueItem);
      console.log('📝 Sync Queue:', {
        id: queueItem.id,
        operation,
        priority,
        entity_id: queueItem.entity_id
      });
      
      return queueItem;
    }

    /**
     * Get pending sync items
     */
    async getPendingSync(limit = 20) {
      const all = await this.getAll('sync_queue');
      return all
        .filter(item => item.status === 'pending')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(0, limit);
    }

    /**
     * Mark sync item as synced
     */
    async markSynced(id) {
      const item = await this.get('sync_queue', id);
      if (item) {
        item.status = 'synced';
        item.updated_at = new Date().toISOString();
        await this.set('sync_queue', item);
        console.log('✅ Marked as synced:', id);
      }
    }

    /**
     * Mark sync item as failed
     */
    async markSyncFailed(id, error) {
      const item = await this.get('sync_queue', id);
      if (item) {
        item.status = 'failed';
        item.error = error;
        item.retry_count = (item.retry_count || 0) + 1;
        item.updated_at = new Date().toISOString();
        await this.set('sync_queue', item);
        console.error('❌ Marked as failed:', id, error);
      }
    }

    /**
     * Clear sync queue (for maintenance)
     */
    async clearSyncQueue() {
      const all = await this.getAll('sync_queue');
      for (const item of all) {
        await this.delete('sync_queue', item.id);
      }
      console.log('🗑️ Sync queue cleared');
    }

    /**
     * Get storage stats
     */
    async getStats() {
      const stats = {
        type: this.isIndexedDB ? 'IndexedDB' : 'localStorage',
        initialized: this.initialized,
        products: 0,
        customers: 0,
        sales: 0,
        syncQueue: 0,
        pendingSync: 0
      };

      const products = await this.getAll('products');
      stats.products = products.length;

      const customers = await this.getAll('customers');
      stats.customers = customers.length;

      const sales = await this.getAll('sales');
      stats.sales = sales.length;

      const syncQueue = await this.getAll('sync_queue');
      stats.syncQueue = syncQueue.length;
      stats.pendingSync = syncQueue.filter(item => item.status === 'pending').length;

      return stats;
    }

    /**
     * Migrate from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
      if (!this.isIndexedDB) {
        console.log('⚠️ Cannot migrate - IndexedDB not available');
        return;
      }

      console.log('🔄 Starting migration from localStorage...');

      const stores = ['products', 'customers', 'sales', 'shop_settings'];
      let migrated = 0;

      for (const storeName of stores) {
        const prefix = `mr_${storeName}_`;
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keys.push(key);
          }
        }

        for (const key of keys) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              await this.set(storeName, parsed);
              migrated++;
            }
          } catch (error) {
            console.error('❌ Migration error:', storeName, key, error);
          }
        }
      }

      console.log(`✅ Migration complete: ${migrated} items migrated`);
    }
  }

  // Create global instance
  window.storage = new StorageAdapter();

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.storage.init();
    });
  } else {
    window.storage.init();
  }

  console.log('✅ Storage Adapter loaded');
})();
