/**
 * MilkRecord POS - Transaction Writer
 * 
 * Atomic transaction writer for collection entries
 * All-or-nothing approach
 * 
 * Usage: window.transactionWriter.save(entry)
 */

(function() {
  'use strict';

  class TransactionWriter {
    constructor() {
      this.entriesKey = 'mr_collection_entries';
      console.log('📝 Transaction Writer initialized');
    }

    /**
     * Save collection entry atomically
     * @param {object} entry - Complete entry object
     * @returns {object} Result with txn_id
     */
    async save(entry) {
      const txn = {
        txn_id: entry.id || this.generateId(),
        farmer_id: entry.farmer_id,
        farmer_name: entry.farmer_name || '',
        
        // Session context
        date: entry.date || this.today(),
        shift: entry.shift || this.currentShift(),
        booth: entry.booth || 'Default Booth',
        operator_id: entry.operator_id || 'operator',
        
        // Intake data
        quantity: parseFloat(entry.quantity || 0),
        fat: parseFloat(entry.fat || 0),
        snf: parseFloat(entry.snf || 0),
        density: parseFloat(entry.density || 0),
        animal_type: entry.animal_type || 'cow',
        
        // Rate calculation
        rate_per_litre: parseFloat(entry.rate_per_litre || 0),
        total_amount: parseFloat(entry.total_amount || 0),
        rate_calculation_mode: entry.rate_calculation_mode || 'auto',
        rate_override: entry.rate_override || null,
        
        // Payment
        payment_mode: entry.payment_mode || 'cash',
        payment_status: entry.payment_mode === 'cash' ? 'settled' : 'pending',
        
        // Audit
        machine_mode: entry.machine_mode || 'manual',
        rate_source: entry.rate_source || 'auto',
        device_id: this.getDeviceId(),
        created_at: Date.now(),
        sync_status: 'pending'
      };

      try {
        // Save to local storage
        await this.saveEntry(txn);

        console.log('✅ Transaction saved:', {
          txn_id: txn.txn_id,
          farmer: txn.farmer_name,
          amount: txn.total_amount,
          payment: txn.payment_mode
        });

        return {
          success: true,
          txn_id: txn.txn_id,
          data: txn
        };

      } catch (error) {
        console.error('❌ Transaction save failed:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }

    /**
     * Save entry to storage
     */
    async saveEntry(txn) {
      const stored = localStorage.getItem(this.entriesKey);
      const all = stored ? JSON.parse(stored) : [];
      all.push(txn);
      localStorage.setItem(this.entriesKey, JSON.stringify(all));
    }

    /**
     * Get today's entries
     */
    async getTodayEntries() {
      const stored = localStorage.getItem(this.entriesKey);
      if (!stored) return [];

      const all = JSON.parse(stored);
      const today = this.today();
      
      return all.filter(e => e.date === today);
    }

    /**
     * Get entries by farmer
     */
    async getFarmerEntries(farmer_id, limit = 100) {
      const stored = localStorage.getItem(this.entriesKey);
      if (!stored) return [];

      const all = JSON.parse(stored);
      const farmerEntries = all.filter(e => e.farmer_id === farmer_id);
      
      // Sort by date (newest first)
      farmerEntries.sort((a, b) => b.created_at - a.created_at);
      
      return farmerEntries.slice(0, limit);
    }

    /**
     * Get today's summary
     */
    async getTodaySummary() {
      const entries = await this.getTodayEntries();
      
      const summary = {
        total_liters: 0,
        total_amount: 0,
        total_entries: entries.length,
        cow_liters: 0,
        buffalo_liters: 0
      };

      entries.forEach(e => {
        summary.total_liters += e.quantity;
        summary.total_amount += e.total_amount;
        
        if (e.animal_type === 'cow') {
          summary.cow_liters += e.quantity;
        } else {
          summary.buffalo_liters += e.quantity;
        }
      });

      return summary;
    }

    /**
     * Generate unique ID
     */
    generateId() {
      return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current shift
     */
    currentShift() {
      const hour = new Date().getHours();
      return hour < 12 ? 'Morning' : 'Evening';
    }

    /**
     * Get today's date (YYYY-MM-DD)
     */
    today() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    /**
     * Get device ID
     */
    getDeviceId() {
      let deviceId = localStorage.getItem('mr_device_id');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('mr_device_id', deviceId);
      }
      return deviceId;
    }

    /**
     * Clear entries (for testing)
     */
    clear() {
      localStorage.removeItem(this.entriesKey);
      console.log('🗑️ Transaction entries cleared');
    }

    /**
     * Get stats
     */
    getStats() {
      try {
        const stored = localStorage.getItem(this.entriesKey);
        if (!stored) return { total_entries: 0 };

        const all = JSON.parse(stored);
const today = await this.getTodayEntries();

        return {
          total_entries: all.length,
          today_entries: today.length,
          pending_sync: all.filter(e => e.sync_status === 'pending').length
        };
      } catch (e) {
        return { error: e.message };
      }
    }
  }

  // Create global instance
  window.transactionWriter = new TransactionWriter();

  console.log('✅ Transaction Writer loaded');
})();
