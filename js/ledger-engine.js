/**
 * MilkRecord POS - Ledger Engine
 * 
 * Append-only ledger system
 * Never trust frontend-calculated balances
 * Compute balance as SUM(credit) - SUM(debit)
 * 
 * Usage: window.ledgerEngine.addEntry(farmer_id, entry)
 */

(function() {
  'use strict';

  class LedgerEngine {
    constructor() {
      this.storageKey = 'mr_ledger_entries';
      console.log('📒 Ledger Engine initialized');
    }

    /**
     * Add ledger entry (append-only)
     * @param {string} farmer_id
     * @param {object} entry - {txn_id, type, credit, debit, reference, notes}
     * @returns {object} Created entry
     */
    async addEntry(farmer_id, entry) {
      const ledgerEntry = {
        entry_id: this.generateId(),
        farmer_id: farmer_id,
        txn_id: entry.txn_id,
        type: entry.type, // 'credit' or 'debit'
        credit: entry.credit || 0,
        debit: entry.debit || 0,
        balance_after: 0, // Will be calculated
        reference: entry.reference || '', // Reference to collection/sale
        notes: entry.notes || '',
        payment_mode: entry.payment_mode || 'cash',
        created_at: Date.now(),
        created_by: entry.operator_id || 'operator',
        device_id: this.getDeviceId(),
        sync_status: 'pending'
      };

      // Calculate balance after this entry
      const balance = await this.calculateBalance(farmer_id);
      ledgerEntry.balance_after = this.round(balance + ledgerEntry.credit - ledgerEntry.debit);

      // Save to local storage
      await this.saveEntry(ledgerEntry);

      console.log('📒 Ledger entry added:', {
        farmer_id: farmer_id,
        type: ledgerEntry.type,
        amount: ledgerEntry.credit || ledgerEntry.debit,
        balance_after: ledgerEntry.balance_after
      });

      return ledgerEntry;
    }

    /**
     * Calculate balance for farmer (SUM credit - SUM debit)
     * @param {string} farmer_id
     * @returns {number} Current balance
     */
    async calculateBalance(farmer_id) {
      const entries = await this.getEntries(farmer_id);
      
      const totalCredit = entries
        .filter(e => e.type === 'credit')
        .reduce((sum, e) => sum + e.credit, 0);
      
      const totalDebit = entries
        .filter(e => e.type === 'debit')
        .reduce((sum, e) => sum + e.debit, 0);

      return this.round(totalCredit - totalDebit);
    }

    /**
     * Get all ledger entries for farmer
     */
    async getEntries(farmer_id, limit = 100) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return [];

        const all = JSON.parse(stored);
        const farmerEntries = all.filter(e => e.farmer_id === farmer_id);
        
        // Sort by date (newest first)
        farmerEntries.sort((a, b) => b.created_at - a.created_at);
        
        return farmerEntries.slice(0, limit);
      } catch (e) {
        console.error('❌ Failed to load ledger:', e);
        return [];
      }
    }

    /**
     * Save entry to storage
     */
    async saveEntry(entry) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        const all = stored ? JSON.parse(stored) : [];
        all.push(entry);
        localStorage.setItem(this.storageKey, JSON.stringify(all));
      } catch (e) {
        console.error('❌ Failed to save ledger entry:', e);
      }
    }

    /**
     * Get recent transactions for display
     */
    async getRecentTransactions(farmer_id, limit = 20) {
      const entries = await this.getEntries(farmer_id, limit);
      
      return entries.map(e => ({
        entry_id: e.entry_id,
        date: new Date(e.created_at),
        type: e.type,
        amount: e.credit || e.debit,
        balance: e.balance_after,
        reference: e.reference,
        payment_mode: e.payment_mode,
        notes: e.notes,
        isSettled: e.payment_mode === 'cash'
      }));
    }

    /**
     * Generate unique ID
     */
    generateId() {
      return 'ledger_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
     * Round to 2 decimals
     */
    round(value) {
      return Math.round(value * 100) / 100;
    }

    /**
     * Clear ledger (for testing)
     */
    clear() {
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ Ledger cleared');
    }

    /**
     * Get ledger stats
     */
    getStats() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return { total_entries: 0, total_farmers: 0 };

        const all = JSON.parse(stored);
        const uniqueFarmers = new Set(all.map(e => e.farmer_id)).size;

        return {
          total_entries: all.length,
          total_farmers: uniqueFarmers,
          pending_sync: all.filter(e => e.sync_status === 'pending').length
        };
      } catch (e) {
        return { error: e.message };
      }
    }
  }

  // Create global instance
  window.ledgerEngine = new LedgerEngine();

  console.log('✅ Ledger Engine loaded');
})();
