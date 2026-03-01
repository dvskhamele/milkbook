/**
 * MilkRecord POS - 3-Tier Sync Engine
 * Enterprise-grade sync with priority levels
 * 
 * LEVEL 0: Trial Mode (Offline Only)
 * LEVEL 1: Identity Activation (Critical Sync)
 * LEVEL 2: Transaction Sync (Background Async)
 * 
 * Usage: window.syncEngine.queue('save_invoice', data, 'high')
 */

(function() {
  'use strict';

  // Sync Priority Levels
  const PRIORITY = {
    CRITICAL: 0,  // Shop registration, device registration, auth
    HIGH: 1,      // Invoices, ledger, payments
    NORMAL: 2,    // Products, customers
    LOW: 3        // Audit logs, analytics
  };

  // Sync Status
  const STATUS = {
    PENDING: 'pending',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    FAILED: 'failed'
  };

  class SyncEngine {
    constructor() {
      this.isSyncing = false;
      this.syncInterval = null;
      this.apiBase = '/api';
      this.maxRetries = 5;
      this.batchSize = 20;
      this.syncIntervalMs = 30000; // 30 seconds
      this.initialized = false;
      
      // Trial mode flag
      this.isTrialMode = true;
      this.shopId = null;
      this.deviceId = null;
      
      // Retry delays (exponential backoff)
      this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // ms
      
      console.log('🔄 3-Tier Sync Engine loaded');
    }

    /**
     * Initialize sync engine
     */
    async init() {
      if (this.initialized) return;

      // Wait for storage
      if (window.storage) {
        await window.storage.init();
      }

      // Load trial/activation state
      await this.loadState();

      // Start periodic sync ONLY if not in trial mode
      if (!this.isTrialMode) {
        this.startPeriodicSync();
      }

      // Listen for online/offline
      window.addEventListener('online', () => {
        console.log('✅ Network online');
        if (!this.isTrialMode) {
          this.trigger();
        }
      });

      window.addEventListener('offline', () => {
        console.log('⚠️ Network offline - sync paused');
      });

      this.initialized = true;
      this.logState();
      console.log('✅ Sync engine initialized');
    }

    /**
     * Load trial/activation state from localStorage
     */
    async loadState() {
      const shopId = localStorage.getItem('MilkRecord_shop_id');
      const deviceId = localStorage.getItem('MilkRecord_device_id');
      
      this.shopId = shopId;
      this.deviceId = deviceId || this.generateDeviceId();
      
      // Trial mode = no shop_id yet
      this.isTrialMode = !shopId;
      
      if (this.isTrialMode) {
        console.log('🔵 LEVEL 0: Trial Mode (Offline Only)');
        console.log('⚠️ Sync disabled - no shop registration yet');
      } else {
        console.log('🟢 LEVEL 1/2: Activated Mode');
        console.log('✅ Shop ID:', this.shopId);
        console.log('✅ Device ID:', this.deviceId);
      }
      
      return { isTrialMode: this.isTrialMode, shopId: this.shopId };
    }

    /**
     * Generate unique device ID
     */
    generateDeviceId() {
      const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('MilkRecord_device_id', deviceId);
      console.log('🆔 Generated device ID:', deviceId);
      return deviceId;
    }

    /**
     * Start periodic sync
     */
    startPeriodicSync() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      this.syncInterval = setInterval(() => {
        if (navigator.onLine && !this.isSyncing && !this.isTrialMode) {
          this.trigger();
        }
      }, this.syncIntervalMs);

      console.log(`🕐 Periodic sync started (every ${this.syncIntervalMs/1000}s)`);
    }

    /**
     * Stop periodic sync
     */
    stop() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
        console.log('⏹️ Periodic sync stopped');
      }
    }

    /**
     * Queue item for sync with priority
     * @param {string} operation - save_product, save_customer, save_invoice, etc.
     * @param {object} data - Data to sync
     * @param {string} priority - critical, high, normal, low
     */
    async queue(operation, data, priority = 'normal') {
      console.log('📝 Sync Queue Request:', {
        operation,
        priority,
        isTrialMode: this.isTrialMode,
        hasShopId: !!this.shopId
      });

      // LEVEL 0: Trial Mode - NO SYNC AT ALL
      if (this.isTrialMode) {
        console.log('🔵 Trial Mode: Data saved locally only (no sync)');
        console.log('💡 Tip: Register shop to enable cloud sync');
        return { success: true, type: 'local_only', reason: 'trial_mode' };
      }

      // Add shop_id and device_id to all data
      const enrichedData = {
        ...data,
        shop_id: this.shopId,
        device_id: this.deviceId,
        local_txn_id: data.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced_at: null
      };

      // Add to sync queue with priority
      const queueItem = await window.storage.addToSyncQueue(operation, enrichedData, priority);
      
      console.log('📝 Queued for sync:', {
        id: queueItem.id,
        operation,
        priority,
        local_txn_id: enrichedData.local_txn_id
      });

      // Trigger immediate sync for critical/high priority
      if (priority === 'critical' || priority === 'high') {
        console.log('⚡ High priority - triggering immediate sync');
        this.trigger();
      }

      return { 
        success: true, 
        type: 'queued', 
        queueId: queueItem.id,
        priority 
      };
    }

    /**
     * Activate shop (LEVEL 0 → LEVEL 1/2 transition)
     */
    async activateShop(shopData) {
      console.log('🟢 LEVEL 1: Activating Shop...');
      console.log('📊 Shop Data:', shopData);

      try {
        // STEP 1: Save locally first (always)
        const localShop = {
          id: 'shop_1',
          ...shopData,
          shop_status: 'activated',
          sync_enabled: true,
          activated_at: new Date().toISOString()
        };

        await window.storage.set('shop_settings', localShop);
        console.log('✅ Shop saved locally');

        // STEP 2: Sync to Supabase IMMEDIATELY (critical)
        console.log('🚀 Syncing shop to Supabase (critical)...');
        
        const response = await fetch(`${this.apiBase}/shop-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localShop)
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Shop activation failed');
        }

        // STEP 3: Store shop_id
        this.shopId = result.shop_id || localShop.id;
        localStorage.setItem('MilkRecord_shop_id', this.shopId);
        this.isTrialMode = false;

        console.log('✅ Shop activated!');
        console.log('🆔 Shop ID:', this.shopId);
        console.log('🔄 Enabling sync engine...');

        // STEP 4: Start sync engine
        this.startPeriodicSync();

        // STEP 5: Sync all pending local data
        console.log('📤 Syncing pending local data...');
        await this.syncPendingData();

        // STEP 6: Log state
        this.logState();

        return { 
          success: true, 
          shopId: this.shopId,
          message: 'Shop activated successfully'
        };

      } catch (error) {
        console.error('❌ Shop activation failed:', error);
        return { 
          success: false, 
          error: error.message,
          message: 'Shop saved locally, will sync when online'
        };
      }
    }

    /**
     * Sync all pending local data (used after activation)
     */
    async syncPendingData() {
      const pending = await window.storage.getPendingSync(100);
      
      if (pending.length === 0) {
        console.log('✅ No pending data to sync');
        return;
      }

      console.log(`📤 Syncing ${pending.length} pending items...`);

      let success = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          await this.syncItem(item);
          success++;
        } catch (error) {
          failed++;
          console.error('❌ Sync failed:', item.entity_type, error.message);
        }
      }

      console.log(`✅ Pending sync complete: ${success} synced, ${failed} failed`);
    }

    /**
     * Trigger sync manually
     */
    async trigger() {
      if (this.isSyncing) {
        console.log('🔄 Sync already in progress...');
        return;
      }

      if (!navigator.onLine) {
        console.log('⚠️ No internet - sync queued');
        return;
      }

      if (this.isTrialMode) {
        console.log('🔵 Trial mode - sync disabled');
        return;
      }

      if (!window.storage) {
        console.error('❌ Storage not available');
        return;
      }

      this.isSyncing = true;

      try {
        // Get pending items ordered by priority
        const pending = await this.getPendingByPriority(this.batchSize);

        if (pending.length === 0) {
          console.log('✅ Sync queue empty');
          return;
        }

        console.log(`🔄 Syncing ${pending.length} items (priority order)...`);

        let successCount = 0;
        let failCount = 0;

        for (const item of pending) {
          try {
            await this.syncItem(item);
            successCount++;
          } catch (error) {
            console.error('❌ Sync failed:', item.entity_type, item.entity_id, error.message);
            failCount++;
            
            // Retry logic with exponential backoff
            if (item.retry_count < this.maxRetries) {
              const delay = this.retryDelays[item.retry_count] || 30000;
              console.log(`🔄 Will retry in ${delay/1000}s (${item.retry_count + 1}/${this.maxRetries})`);
            } else {
              console.error('❌ Max retries reached for:', item.entity_id);
            }
          }

          // Small delay between requests
          await this.sleep(100);
        }

        console.log(`✅ Sync batch complete: ${successCount} synced, ${failCount} failed`);

        // Log stats
        const stats = await window.storage.getStats();
        console.log('📊 Storage stats:', stats);

      } catch (error) {
        console.error('❌ Sync engine error:', error);
      } finally {
        this.isSyncing = false;
      }
    }

    /**
     * Get pending items ordered by priority
     */
    async getPendingByPriority(limit = 20) {
      const all = await window.storage.getAll('sync_queue');
      
      return all
        .filter(item => item.status === 'pending')
        .sort((a, b) => {
          // Sort by priority (critical=0, high=1, normal=2, low=3)
          const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Then by created_at (oldest first)
          return new Date(a.created_at) - new Date(b.created_at);
        })
        .slice(0, limit);
    }

    /**
     * Sync single item to API
     */
    async syncItem(item) {
      const endpoints = {
        'save_product': '/api/products',
        'save_customer': '/api/customers',
        'save_sale': '/api/sales',
        'save_invoice': '/api/invoices',
        'save_shop_settings': '/api/shop-settings',
        'save_device': '/api/devices'
      };

      const endpoint = endpoints[item.operation];
      if (!endpoint) {
        throw new Error('Unknown operation: ' + item.operation);
      }

      let payload;
      try {
        payload = JSON.parse(item.payload_json);
      } catch (error) {
        console.error('❌ Invalid payload JSON:', error);
        await window.storage.markSyncFailed(item.id, 'Invalid payload JSON');
        return;
      }

      // Ensure shop_id and device_id
      payload.shop_id = payload.shop_id || this.shopId;
      payload.device_id = payload.device_id || this.deviceId;
      payload.synced_at = new Date().toISOString();

      console.log('📤 Syncing:', item.operation, payload.local_txn_id);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      await window.storage.markSynced(item.id);
      console.log('✅ Synced:', item.operation, item.entity_id, result);
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get sync status
     */
    async getStatus() {
      const stats = await window.storage.getStats();
      
      return {
        isTrialMode: this.isTrialMode,
        shopId: this.shopId,
        deviceId: this.deviceId,
        isSyncing: this.isSyncing,
        initialized: this.initialized,
        online: navigator.onLine,
        pending: stats.pendingSync,
        totalQueue: stats.syncQueue,
        lastSync: null
      };
    }

    /**
     * Log current state
     */
    logState() {
      console.log('📊 Sync Engine State:', {
        isTrialMode: this.isTrialMode,
        shopId: this.shopId,
        deviceId: this.deviceId,
        online: navigator.onLine,
        isSyncing: this.isSyncing
      });
    }
  }

  // Create global instance
  window.syncEngine = new SyncEngine();

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.safeExecute(() => window.syncEngine.init());
    });
  } else {
    window.safeExecute(() => window.syncEngine.init());
  }

  console.log('✅ 3-Tier Sync Engine loaded');
})();
