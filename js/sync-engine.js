/**
 * MilkRecord POS - Background Sync Engine
 * Enterprise-grade sync with retry logic
 * Works offline, syncs when online
 * 
 * Usage: window.syncEngine.trigger()
 */

(function() {
  'use strict';

  class SyncEngine {
    constructor() {
      this.isSyncing = false;
      this.syncInterval = null;
      this.apiBase = '/api';
      this.maxRetries = 5;
      this.batchSize = 20;
      this.syncIntervalMs = 30000; // 30 seconds
      this.initialized = false;
      this.retryDelay = 5000; // 5 seconds between retries
    }

    /**
     * Initialize sync engine
     */
    async init() {
      if (this.initialized) return;

      // Wait for storage to be ready
      if (window.storage) {
        await window.storage.init();
      }

      // Start periodic sync
      this.startPeriodicSync();

      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('✅ Network online - triggering sync');
        this.trigger();
      });

      window.addEventListener('offline', () => {
        console.log('⚠️ Network offline - sync paused');
      });

      // Listen for visibility change (sync when user returns)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) {
          console.log('👁️ Page visible - triggering sync');
          this.trigger();
        }
      });

      this.initialized = true;
      console.log('✅ Sync engine initialized');
    }

    /**
     * Start periodic sync
     */
    startPeriodicSync() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      this.syncInterval = setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
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

      if (!window.storage) {
        console.error('❌ Storage not available');
        return;
      }

      this.isSyncing = true;

      try {
        const pending = await window.storage.getPendingSync(this.batchSize);

        if (pending.length === 0) {
          console.log('✅ Sync queue empty');
          return;
        }

        console.log(`🔄 Syncing ${pending.length} items...`);

        let successCount = 0;
        let failCount = 0;

        for (const item of pending) {
          try {
            await this.syncItem(item);
            successCount++;
          } catch (error) {
            console.error('❌ Sync failed:', item.entity_type, item.entity_id, error.message);
            failCount++;
            
            // Retry logic
            if (item.retry_count < this.maxRetries) {
              console.log(`🔄 Will retry (${item.retry_count + 1}/${this.maxRetries})`);
            } else {
              console.error('❌ Max retries reached for:', item.entity_id);
            }
          }

          // Small delay between requests to avoid overwhelming server
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
     * Sync single item to API
     */
    async syncItem(item) {
      const endpoints = {
        'product': '/api/products',
        'customer': '/api/customers',
        'sale': '/api/sales',
        'shop_settings': '/api/shop-settings'
      };

      const endpoint = endpoints[item.entity_type];
      if (!endpoint) {
        throw new Error('Unknown entity type: ' + item.entity_type);
      }

      let payload;
      try {
        payload = JSON.parse(item.payload_json);
      } catch (error) {
        console.error('❌ Invalid payload JSON:', error);
        await window.storage.markSyncFailed(item.id, 'Invalid payload JSON');
        return;
      }

      // Add timestamp for conflict resolution
      payload.synced_at = new Date().toISOString();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        // Timeout after 10 seconds
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
      console.log('✅ Synced:', item.entity_type, item.entity_id);
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
        isSyncing: this.isSyncing,
        initialized: this.initialized,
        online: navigator.onLine,
        pending: stats.pendingSync,
        totalQueue: stats.syncQueue,
        lastSync: null // TODO: Track last sync time
      };
    }

    /**
     * Force sync all pending (ignore batch size)
     */
    async forceSync() {
      console.log('⚡ Force syncing all pending items...');
      
      const allPending = await window.storage.getPendingSync(1000);
      
      if (allPending.length === 0) {
        console.log('✅ No pending items');
        return;
      }

      console.log(`⚡ Syncing ${allPending.length} items...`);
      
      let success = 0;
      let failed = 0;

      for (const item of allPending) {
        try {
          await this.syncItem(item);
          success++;
        } catch (error) {
          failed++;
          console.error('❌ Force sync failed:', item.entity_id, error.message);
        }
      }

      console.log(`✅ Force sync complete: ${success} synced, ${failed} failed`);
    }

    /**
     * Clear failed items (maintenance)
     */
    async clearFailed() {
      const all = await window.storage.getAll('sync_queue');
      const failed = all.filter(item => item.status === 'failed');
      
      for (const item of failed) {
        await window.storage.delete('sync_queue', item.id);
      }

      console.log(`🗑️ Cleared ${failed.length} failed items`);
      return failed.length;
    }

    /**
     * Retry failed items
     */
    async retryFailed() {
      const all = await window.storage.getAll('sync_queue');
      const failed = all.filter(item => 
        item.status === 'failed' && 
        item.retry_count < this.maxRetries
      );

      console.log(`🔄 Retrying ${failed.length} failed items...`);

      for (const item of failed) {
        item.status = 'pending';
        item.retry_count = (item.retry_count || 0) + 1;
        await window.storage.set('sync_queue', item);
      }

      // Trigger sync
      await this.trigger();
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

  console.log('✅ Sync Engine loaded');
})();
