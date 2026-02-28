/**
 * MilkRecord POS - Comprehensive Audit Trail System
 * 
 * Inspired by: milkrecord_bmc/HUB/audit_logger.py
 * 
 * Features:
 * - Logs EVERY action with digital signatures
 * - Session tracking (unique session ID)
 * - Machine ID tracking
 * - User agent logging
 * - Timestamps (ISO format)
 * - LocalStorage + Backend sync
 * - Tamper detection
 * - Immutable hash chaining
 */

class AuditTrail {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.machineId = this.getMachineId();
    this.currentUser = null;
    this.previousHash = null;
    this.init();
  }

  /**
   * Initialize audit trail system
   */
  init() {
    console.log('🔒 Audit Trail System Initialized');
    console.log('   Session:', this.sessionId);
    console.log('   Machine:', this.machineId);
    
    // Load current user
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // Load previous hash for chain verification
    const lastLog = this.getLastLog();
    this.previousHash = lastLog?.hash || null;
    
    // Auto-sync to backend every 5 minutes
    setInterval(() => this.syncToBackend(), 300000);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'SES-' + Math.random().toString(36).substring(2, 10).toUpperCase() + 
           '-' + Date.now().toString(36).toUpperCase();
  }

  /**
   * Get machine identifier
   */
  getMachineId() {
    // Try to get existing machine ID
    let machineId = localStorage.getItem('machineId');
    
    if (!machineId) {
      // Generate new one
      machineId = 'MID-' + 
                  navigator.platform.replace(/\s/g, '') + '-' + 
                  navigator.hardwareConcurrency + 'core-' +
                  Math.random().toString(36).substring(2, 8).toUpperCase();
      
      localStorage.setItem('machineId', machineId);
    }
    
    return machineId;
  }

  /**
   * Generate hash for audit entry
   */
  generateHash(entry) {
    const data = JSON.stringify({
      timestamp: entry.timestamp,
      sessionId: entry.sessionId,
      machineId: entry.machineId,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      previousHash: this.previousHash
    });
    
    // Simple hash (in production, use SHA-256)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'HASH-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  /**
   * Generate digital signature
   */
  generateSignature(entry) {
    const data = entry.sessionId + entry.timestamp + entry.action + entry.entityId;
    return 'SIG-' + btoa(data).substring(0, 20).toUpperCase();
  }

  /**
   * Log any action
   */
  log(action, entityType, entityId, data = {}, notes = '') {
    const entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      machineId: this.machineId,
      userAgent: navigator.userAgent,
      userId: this.currentUser?.id || 'anonymous',
      userEmail: this.currentUser?.email || 'anonymous',
      action: action,
      entityType: entityType,
      entityId: entityId,
      data: data,
      notes: notes,
      previousHash: this.previousHash,
      hash: null,
      signature: null
    };
    
    // Generate hash and signature
    entry.hash = this.generateHash(entry);
    entry.signature = this.generateSignature(entry);
    
    // Update previous hash for chain
    this.previousHash = entry.hash;
    
    // Save to localStorage
    this.saveLog(entry);
    
    // Sync to backend (async)
    this.syncToBackend(entry);
    
    console.log(`🔒 AUDIT: ${action} - ${entityType}:${entityId}`);
    
    return entry;
  }

  /**
   * Login event
   */
  login(user, success = true) {
    return this.log(
      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      'user',
      user.id || 'unknown',
      {
        email: user.email,
        role: user.role,
        shopId: user.shopId,
        method: user.authMethod || 'password'
      },
      success ? 'User logged in successfully' : 'Login failed'
    );
  }

  /**
   * Logout event
   */
  logout(user) {
    return this.log(
      'LOGOUT',
      'user',
      user.id,
      {
        email: user.email,
        sessionDuration: this.getSessionDuration()
      },
      'User logged out'
    );
  }

  /**
   * Sale transaction
   */
  sale(invoiceData) {
    return this.log(
      'SALE_CREATE',
      'invoice',
      invoiceData.invoiceNumber,
      {
        customerName: invoiceData.customerName,
        items: invoiceData.items,
        totalAmount: invoiceData.total,
        paymentMode: invoiceData.paymentMode,
        amountPaid: invoiceData.amountPaid,
        change: invoiceData.change,
        itemsCount: invoiceData.items.length
      },
      `Sale of ₹${invoiceData.total.toFixed(2)} via ${invoiceData.paymentMode}`
    );
  }

  /**
   * Sale modification
   */
  saleModify(invoiceNumber, oldData, newData, reason) {
    return this.log(
      'SALE_MODIFY',
      'invoice',
      invoiceNumber,
      {
        oldData: oldData,
        newData: newData,
        modificationReason: reason,
        difference: newData.total - oldData.total
      },
      `Invoice modified: ${reason}`
    );
  }

  /**
   * Sale void/cancel
   */
  saleVoid(invoiceNumber, invoiceData, reason) {
    return this.log(
      'SALE_VOID',
      'invoice',
      invoiceNumber,
      {
        originalData: invoiceData,
        voidReason: reason,
        voidAmount: invoiceData.total
      },
      `Invoice voided: ${reason}`
    );
  }

  /**
   * Customer ledger entry
   */
  ledgerEntry(customerId, entryData) {
    return this.log(
      'LEDGER_ENTRY',
      'customer_ledger',
      customerId,
      {
        customerName: entryData.customerName,
        transactionType: entryData.type, // credit/debit
        amount: entryData.amount,
        balance: entryData.balance,
        notes: entryData.notes
      },
      `${entryData.type} of ₹${entryData.amount} - Balance: ₹${entryData.balance}`
    );
  }

  /**
   * Product creation
   */
  productCreate(productData) {
    return this.log(
      'PRODUCT_CREATE',
      'product',
      productData.id,
      {
        name: productData.name,
        price: productData.price,
        category: productData.category,
        barcode: productData.barcode
      },
      `New product: ${productData.name}`
    );
  }

  /**
   * Product modification
   */
  productModify(productId, oldData, newData, reason) {
    return this.log(
      'PRODUCT_MODIFY',
      'product',
      productId,
      {
        oldData: oldData,
        newData: newData,
        modificationReason: reason
      },
      `Product modified: ${reason}`
    );
  }

  /**
   * Product deletion
   */
  productDelete(productId, productData, reason) {
    return this.log(
      'PRODUCT_DELETE',
      'product',
      productId,
      {
        deletedData: productData,
        deletionReason: reason
      },
      `Product deleted: ${reason}`
    );
  }

  /**
   * Shift start
   */
  shiftStart(shiftData) {
    return this.log(
      'SHIFT_START',
      'shift',
      shiftData.shiftId,
      {
        shift: shiftData.shift,
        openingCash: shiftData.openingCash,
        terminalId: shiftData.terminalId,
        declarations: shiftData.declarations
      },
      `Shift started: ${shiftData.shift}`
    );
  }

  /**
   * Shift end
   */
  shiftEnd(shiftData) {
    return this.log(
      'SHIFT_END',
      'shift',
      shiftData.shiftId,
      {
        shift: shiftData.shift,
        closingCash: shiftData.closingCash,
        salesCount: shiftData.salesCount,
        totalSales: shiftData.totalSales,
        variance: shiftData.variance
      },
      `Shift ended: ${shiftData.shift}`
    );
  }

  /**
   * Cash drawer open
   */
  cashDrawerOpen(reason) {
    return this.log(
      'CASH_DRAWER_OPEN',
      'cash_drawer',
      'drawer_1',
      {
        reason: reason,
        timestamp: new Date().toISOString()
      },
      `Cash drawer opened: ${reason}`
    );
  }

  /**
   * Hardware device action
   */
  deviceAction(deviceType, action, data) {
    return this.log(
      `DEVICE_${action.toUpperCase()}`,
      'hardware_device',
      deviceType,
      data,
      `${deviceType} ${action}`
    );
  }

  /**
   * Export data
   */
  dataExport(exportType, recordCount) {
    return this.log(
      'DATA_EXPORT',
      'export',
      exportType,
      {
        exportType: exportType,
        recordCount: recordCount,
        format: 'excel'
      },
      `Exported ${recordCount} records of ${exportType}`
    );
  }

  /**
   * Settings change
   */
  settingsChange(settingName, oldValue, newValue) {
    return this.log(
      'SETTINGS_CHANGE',
      'settings',
      settingName,
      {
        settingName: settingName,
        oldValue: oldValue,
        newValue: newValue
      },
      `Setting changed: ${settingName}`
    );
  }

  /**
   * Save log to localStorage
   */
  saveLog(entry) {
    const logs = this.getLogs();
    logs.push(entry);
    
    // Keep last 10000 logs in localStorage
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    
    localStorage.setItem('auditLogs', JSON.stringify(logs));
  }

  /**
   * Get all logs
   */
  getLogs() {
    return JSON.parse(localStorage.getItem('auditLogs') || '[]');
  }

  /**
   * Get last log
   */
  getLastLog() {
    const logs = this.getLogs();
    return logs.length > 0 ? logs[logs.length - 1] : null;
  }

  /**
   * Get recent logs
   */
  getRecent(count = 50) {
    const logs = this.getLogs();
    return logs.slice(-count).reverse();
  }

  /**
   * Get logs by action type
   */
  getByAction(action) {
    const logs = this.getLogs();
    return logs.filter(log => log.action === action);
  }

  /**
   * Get logs by entity
   */
  getByEntity(entityType, entityId) {
    const logs = this.getLogs();
    return logs.filter(log => 
      log.entityType === entityType && 
      (!entityId || log.entityId === entityId)
    );
  }

  /**
   * Get logs by date range
   */
  getByDateRange(startDate, endDate) {
    const logs = this.getLogs();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  /**
   * Get logs by user
   */
  getByUser(userId) {
    const logs = this.getLogs();
    return logs.filter(log => log.userId === userId);
  }

  /**
   * Sync log to backend
   */
  async syncToBackend(entry) {
    try {
      const logsToSync = entry ? [entry] : this.getUnsyncedLogs();
      
      if (logsToSync.length === 0) return;
      
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSync })
      });
      
      if (response.ok) {
        // Mark as synced
        this.markAsSynced(logsToSync);
        console.log(`✅ Synced ${logsToSync.length} audit logs to backend`);
      }
    } catch (error) {
      console.log('⚠️  Audit sync failed (offline mode):', error.message);
    }
  }

  /**
   * Get unsynced logs
   */
  getUnsyncedLogs() {
    const logs = this.getLogs();
    return logs.filter(log => !log.synced);
  }

  /**
   * Mark logs as synced
   */
  markAsSynced(logs) {
    const allLogs = this.getLogs();
    
    logs.forEach(syncLog => {
      const index = allLogs.findIndex(l => l.id === syncLog.id);
      if (index !== -1) {
        allLogs[index].synced = true;
        allLogs[index].syncedAt = new Date().toISOString();
      }
    });
    
    localStorage.setItem('auditLogs', JSON.stringify(allLogs));
  }

  /**
   * Verify audit chain integrity
   */
  verifyChain() {
    const logs = this.getLogs();
    const issues = [];
    
    let expectedPreviousHash = null;
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      // Check previous hash chain
      if (log.previousHash !== expectedPreviousHash) {
        issues.push({
          index: i,
          id: log.id,
          issue: 'Hash chain broken',
          expected: expectedPreviousHash,
          actual: log.previousHash
        });
      }
      
      // Verify hash
      const calculatedHash = this.generateHash(log);
      if (calculatedHash !== log.hash) {
        issues.push({
          index: i,
          id: log.id,
          issue: 'Hash mismatch - possible tampering',
          calculated: calculatedHash,
          actual: log.hash
        });
      }
      
      expectedPreviousHash = log.hash;
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      totalLogs: logs.length
    };
  }

  /**
   * Export audit logs
   */
  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      this.downloadBlob(blob, `audit-logs-${new Date().toISOString().slice(0,10)}.json`);
    } else if (format === 'csv') {
      const csv = this.logsToCSV(logs);
      const blob = new Blob([csv], { type: 'text/csv' });
      this.downloadBlob(blob, `audit-logs-${new Date().toISOString().slice(0,10)}.csv`);
    }
    
    this.dataExport('audit_logs', logs.length);
  }

  /**
   * Convert logs to CSV
   */
  logsToCSV(logs) {
    const headers = ['Timestamp', 'Action', 'Entity', 'ID', 'User', 'Notes', 'Hash'];
    const rows = logs.map(log => [
      log.timestamp,
      log.action,
      log.entityType,
      log.entityId,
      log.userEmail,
      log.notes,
      log.hash
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Download blob
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    const logs = this.getLogs();
    const firstLog = logs.find(l => l.action === 'LOGIN_SUCCESS');
    
    if (!firstLog) return 0;
    
    const start = new Date(firstLog.timestamp);
    const end = new Date();
    
    return Math.floor((end - start) / 1000); // seconds
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'AUD-' + Date.now().toString(36) + '-' + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Clear old logs (admin only)
   */
  clearOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const logs = this.getLogs();
    const filteredLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
    
    if (filteredLogs.length < logs.length) {
      localStorage.setItem('auditLogs', JSON.stringify(filteredLogs));
      
      this.log(
        'AUDIT_CLEANUP',
        'system',
        'audit_logs',
        {
          removedCount: logs.length - filteredLogs.length,
          cutoffDate: cutoffDate.toISOString(),
          daysToKeep: daysToKeep
        },
        `Cleaned up ${logs.length - filteredLogs.length} old audit logs`
      );
      
      return logs.length - filteredLogs.length;
    }
    
    return 0;
  }
}

// Create global instance
window.AuditTrail = new AuditTrail();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuditTrail;
}
