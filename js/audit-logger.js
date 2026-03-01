/**
 * MilkRecord POS - Audit Logger
 * 
 * Append-only audit trail
 * Never editable
 * Track who did what when
 * 
 * Usage: window.auditLogger.log(action, details)
 */

(function() {
  'use strict';

  class AuditLogger {
    constructor() {
      this.storageKey = 'mr_audit_log';
      console.log('🛡️ Audit Logger initialized');
    }

    /**
     * Log audit entry (append-only)
     * @param {string} action - Type of action
     * @param {object} details - Action details
     * @returns {object} Created audit entry
     */
    async log(action, details = {}) {
      const entry = {
        audit_id: this.generateId(),
        timestamp: Date.now(),
        datetime: new Date().toISOString(),
        action: action,
        
        // Context
        operator_id: details.operator_id || this.getOperatorId(),
        device_id: this.getDeviceId(),
        session_id: this.getSessionId(),
        
        // Details
        entity_type: details.entity_type || null,
        entity_id: details.entity_id || null,
        changes: details.changes || null,
        metadata: details.metadata || {},
        
        // Integrity
        checksum: null // Will be calculated
      };

      // Calculate checksum for integrity
      entry.checksum = this.calculateChecksum(entry);

      // Save to storage
      await this.saveEntry(entry);

      // Console log (minimal)
      console.log('🛡️ Audit:', action, {
        entity: details.entity_type,
        id: details.entity_id
      });

      return entry;
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
        console.error('❌ Failed to save audit entry:', e);
      }
    }

    /**
     * Get audit trail for entity
     */
    async getTrail(entity_type, entity_id, limit = 50) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return [];

        const all = JSON.parse(stored);
        const trail = all.filter(e => 
          e.entity_type === entity_type && 
          e.entity_id === entity_id
        );

        // Sort by timestamp (newest first)
        trail.sort((a, b) => b.timestamp - a.timestamp);

        return trail.slice(0, limit);
      } catch (e) {
        console.error('❌ Failed to load audit trail:', e);
        return [];
      }
    }

    /**
     * Get recent audit logs
     */
    async getRecent(limit = 100) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return [];

        const all = JSON.parse(stored);
        all.sort((a, b) => b.timestamp - a.timestamp);
        return all.slice(0, limit);
      } catch (e) {
        return [];
      }
    }

    /**
     * Verify audit trail integrity
     */
    async verifyIntegrity() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return { valid: true };

        const all = JSON.parse(stored);
        const invalid = [];

        for (const entry of all) {
          const expectedChecksum = this.calculateChecksum(entry);
          if (entry.checksum !== expectedChecksum) {
            invalid.push(entry.audit_id);
          }
        }

        return {
          valid: invalid.length === 0,
          total: all.length,
          invalid: invalid.length,
          invalid_ids: invalid
        };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    }

    /**
     * Calculate checksum for entry
     */
    calculateChecksum(entry) {
      const data = JSON.stringify({
        audit_id: entry.audit_id,
        timestamp: entry.timestamp,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id
      });
      
      // Simple hash (not cryptographic, just for integrity)
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'hash_' + Math.abs(hash).toString(36);
    }

    /**
     * Generate unique ID
     */
    generateId() {
      return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get operator ID
     */
    getOperatorId() {
      return localStorage.getItem('mr_operator_id') || 'operator_1';
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
     * Get session ID
     */
    getSessionId() {
      let sessionId = sessionStorage.getItem('mr_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('mr_session_id', sessionId);
      }
      return sessionId;
    }

    /**
     * Clear audit log (for testing - use carefully!)
     */
    clear() {
      localStorage.removeItem(this.storageKey);
      console.log('⚠️ Audit log cleared (should only be done in testing!)');
    }

    /**
     * Get stats
     */
    getStats() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return { total_entries: 0 };

        const all = JSON.parse(stored);
        const actions = {};

        all.forEach(e => {
          actions[e.action] = (actions[e.action] || 0) + 1;
        });

        return {
          total_entries: all.length,
          actions: actions,
          integrity: this.verifyIntegrity()
        };
      } catch (e) {
        return { error: e.message };
      }
    }
  }

  // Create global instance
  window.auditLogger = new AuditLogger();

  console.log('✅ Audit Logger loaded');
})();
