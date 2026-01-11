// src/utils/dbWorker.js
// Web Worker for IndexedDB operations to prevent main thread blocking

// Create a simple in-memory store for this worker
let dbStore = {};

// Listen for messages from the main thread
self.onmessage = function(e) {
  const { id, type, data } = e.data;
  
  let result;
  let error = null;
  
  try {
    switch(type) {
      case 'init':
        // Initialize the database store
        result = 'DB Worker initialized';
        break;
        
      case 'put':
        // Add or update a record with sync state
        if (!dbStore[data.table]) {
          dbStore[data.table] = {};
        }
        
        // Add sync state metadata
        const record = {
          ...data.record,
          sync_state: 'QUARANTINED',  // Default to quarantined until synced
          created_at_local: new Date().toISOString(),
          synced_at_server: null
        };
        
        dbStore[data.table][data.record.id] = record;
        result = { success: true, id: data.record.id };
        break;
        
      case 'get':
        // Get a record
        if (dbStore[data.table] && dbStore[data.table][data.id]) {
          result = dbStore[data.table][data.id];
        } else {
          result = null;
        }
        break;
        
      case 'getAll':
        // Get all records from a table
        if (dbStore[data.table]) {
          result = Object.values(dbStore[data.table]);
        } else {
          result = [];
        }
        break;
        
      case 'updateSyncStatus':
        // Update sync status after server ACK
        if (dbStore[data.table] && dbStore[data.table][data.id]) {
          dbStore[data.table][data.id] = {
            ...dbStore[data.table][data.id],
            sync_state: 'SYNCED',
            synced_at_server: new Date().toISOString()
          };
          result = { success: true };
        } else {
          result = { success: false, error: 'Record not found' };
        }
        break;
        
      case 'getQuarantinedRecords':
        // Get all records that are not yet synced
        if (dbStore[data.table]) {
          result = Object.values(dbStore[data.table])
            .filter(record => record.sync_state === 'QUARANTINED');
        } else {
          result = [];
        }
        break;
        
      case 'getPendingCount':
        // Get count of pending records
        if (dbStore['milkEntries']) {
          result = Object.values(dbStore['milkEntries'])
            .filter(record => record.sync_state === 'QUARANTINED').length;
        } else {
          result = 0;
        }
        break;
        
      default:
        error = 'Unknown operation type';
    }
  } catch (err) {
    error = err.message;
  }
  
  // Send response back to main thread
  self.postMessage({ id, result, error });
};