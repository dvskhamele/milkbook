/**
 * MilkRecord POS - Simple Reliable Sync Engine
 * 
 * 4-Layer Architecture:
 * 1. Local Primary Write
 * 2. Sync Queue Engine
 * 3. Background Worker (15s interval)
 * 4. Reconciliation on Reconnect
 * 
 * Usage: window.syncEngine.queue('save_sale', data, 'high')
 */

(function() {
  'use strict';

  const SYNC_INTERVAL = 15000; // 15 seconds
  const BATCH_SIZE = 10;
  const MAX_RETRIES = 5;
  const API_BASE = '/api';

  class SimpleSyncEngine {
    constructor() {
      this.queue = [];
      this.isSyncing = false;
      this.shopId = null;
      this.initialized = false;
      this.syncInterval = null;
      this.connectionHealthy = false;
      
      console.log('🔄 Simple Sync Engine loaded');
    }

    /**
     * Initialize sync engine
     */
    async init() {
      if (this.initialized) return;

      // Load shop ID
      this.shopId = localStorage.getItem('MilkRecord_shop_id');
      
      // Load pending queue from localStorage
      await this.loadQueue();

      // Start background worker
      this.startWorker();

      // Listen for online/offline
      window.addEventListener('online', () => this.onOnline());
      window.addEventListener('offline', () => this.onOffline());

      // Start heartbeat ping
      this.startHeartbeat();

      this.initialized = true;
      this.log('✅ Sync engine initialized', {
        shopId: this.shopId,
        queueLength: this.queue.length,
        online: navigator.onLine
      });
    }

    /**
     * Load pending queue from localStorage
     */
    async loadQueue() {
      try {
        const stored = localStorage.getItem('mr_sync_queue');
        if (stored) {
          this.queue = JSON.parse(stored);
          this.log('📝 Loaded pending queue:', this.queue.length, 'items');
        }
      } catch (e) {
        console.error('❌ Failed to load sync queue:', e);
        this.queue = [];
      }
    }

    /**
     * Save queue to localStorage
     */
    saveQueue() {
      try {
        localStorage.setItem('mr_sync_queue', JSON.stringify(this.queue));
      } catch (e) {
        console.error('❌ Failed to save sync queue:', e);
      }
    }

    /**
     * Queue item for sync
     * @param {string} entity - sale, product, customer, etc.
     * @param {object} data - Data to sync
     * @param {string} priority - 'high' or 'normal'
     */
    async queue(entity, data, priority = 'normal') {
      const item = {
        id: data.local_txn_id || data.id || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entity: entity,
        payload: data,
        status: 'pending',
        priority: priority,
        retry_count: 0,
        created_at: Date.now(),
        last_attempt: null
      };

      // Add to queue
      this.queue.push(item);
      this.saveQueue();

      this.log('📝 Queued for sync:', {
        id: item.id,
        entity: entity,
        priority: priority
      });

      // High priority = immediate attempt
      if (priority === 'high' && navigator.onLine) {
        this.log('⚡ High priority - triggering immediate sync');
        this.trigger();
      }

      return { success: true, type: 'queued', id: item.id };
    }

    /**
     * Start background worker
     */
    startWorker() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      this.syncInterval = setInterval(() => {
        if (navigator.onLine && this.connectionHealthy && this.shopId) {
          this.trigger();
        }
      }, SYNC_INTERVAL);

      this.log(`🕐 Background worker started (every ${SYNC_INTERVAL/1000}s)`);
    }

    /**
     * Trigger sync manually
     */
    async trigger() {
      if (this.isSyncing) {
        return;
      }

      if (!navigator.onLine) {
        this.log('⚠️ Offline - sync paused');
        return;
      }

      if (!this.shopId) {
        this.log('🔵 Trial mode - no shop_id yet');
        return;
      }

      this.isSyncing = true;

      try {
        // Get pending items (high priority first)
        const pending = this.queue
          .filter(item => item.status === 'pending')
          .sort((a, b) => {
            // High priority first
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            // Then oldest first
            return a.created_at - b.created_at;
          })
          .slice(0, BATCH_SIZE);

        if (pending.length === 0) {
          return;
        }

        this.log('🔄 Sync Worker Started');
        this.log(`📤 Sending ${pending.length} items`);

        let successCount = 0;
        let failCount = 0;

        for (const item of pending) {
          try {
            await this.syncItem(item);
            successCount++;
          } catch (error) {
            failCount++;
            this.log(`❌ Failed ${item.entity} ${item.id} (retry ${item.retry_count + 1})`);
          }
        }

        this.log(`✅ Sync complete: ${successCount} synced, ${failCount} failed`);
        this.saveQueue();

      } catch (error) {
        console.error('❌ Sync error:', error);
      } finally {
        this.isSyncing = false;
      }
    }

    /**
     * Sync single item to API
     */
    async syncItem(item) {
      const endpoints = {
        'save_sale': '/api/sales',
        'save_product': '/api/products',
        'save_customer': '/api/customers',
        'save_shop_settings': '/api/shop-settings',
        'save_milk_collection': '/api/milk-collections',
        'save_farmer': '/api/farmers',
        'save_ledger': '/api/ledger',
        'save_advance_order': '/api/advance-orders'
      };

      const endpoint = endpoints[item.entity];
      if (!endpoint) {
        throw new Error('Unknown entity: ' + item.entity);
      }

      // Add shop_id to payload
      const payload = {
        ...item.payload,
        shop_id: this.shopId,
        synced_at: new Date().toISOString()
      };

      // Make API call with timeout
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      // Mark as synced
      item.status = 'synced';
      item.synced_at = Date.now();
      this.log(`✅ Synced ${item.entity} ${item.id}`);

      // Remove old synced items (keep queue small)
      if (this.queue.length > 100) {
        this.queue = this.queue.filter(i => i.status === 'pending');
      }
    }

    /**
     * Handle online event
     */
    onOnline() {
      this.log('✅ Network online');
      this.connectionHealthy = true;
      this.trigger(); // Immediate sync
    }

    /**
     * Handle offline event
     */
    onOffline() {
      this.log('⚠️ Network offline');
      this.connectionHealthy = false;
    }

    /**
     * Start heartbeat ping
     */
    startHeartbeat() {
      setInterval(async () => {
        if (!navigator.onLine) {
          this.connectionHealthy = false;
          return;
        }

        try {
          // Simple HEAD request to check connection
          const response = await fetch(`${API_BASE}/health`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });

          this.connectionHealthy = response.ok;
        } catch (e) {
          this.connectionHealthy = false;
        }
      }, 30000); // Every 30 seconds
    }

    /**
     * Activate shop (transition from trial to full sync)
     */
    async activateShop(shopData) {
      this.log('🟢 Activating shop...');

      try {
        // Save to API
        const response = await fetch(`${API_BASE}/shop-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shopData)
        });

        const result = await response.json();

        if (result.success) {
          this.shopId = result.shop_id || shopData.id;
          localStorage.setItem('MilkRecord_shop_id', this.shopId);
          
          this.log('✅ Shop activated!', { shopId: this.shopId });
          
          // Sync all pending data
          await this.trigger();
          
          return { success: true, shopId: this.shopId };
        } else {
          throw new Error(result.error || 'Activation failed');
        }
      } catch (error) {
        this.log('❌ Shop activation failed:', error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Get sync status
     */
    getStatus() {
      return {
        initialized: this.initialized,
        shopId: this.shopId,
        online: navigator.onLine,
        connectionHealthy: this.connectionHealthy,
        pendingCount: this.queue.filter(i => i.status === 'pending').length,
        totalCount: this.queue.length,
        isSyncing: this.isSyncing
      };
    }

    /**
     * Simple logger
     */
    log(...args) {
      console.log('🔄', ...args);
    }
  }

  // Create global instance
  window.syncEngine = new SimpleSyncEngine();

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.syncEngine.init());
  } else {
    window.syncEngine.init();
  }

})();
