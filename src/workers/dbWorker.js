// dbWorker.js - Web Worker for IndexedDB operations
const DB_NAME = 'milkbook_db';
const DB_VERSION = 1;
const STORE_NAME = 'collections';

let db;

// Open IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
                store.createIndex('farmerId', 'farmerId', { unique: false });
                store.createIndex('syncStatus', 'syncStatus', { unique: false });
            }
        };
    });
};

// Write batch to IndexedDB
const writeBatch = (entries) => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        entries.forEach(entry => {
            store.put(entry);
        });
        
        tx.oncomplete = () => resolve({ success: true });
        tx.onerror = () => reject(tx.error);
    });
};

// Get all entries
const getAllEntries = () => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get unsynced entries
const getUnsyncedEntries = () => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('syncStatus');
        const request = index.getAll(IDBKeyRange.only('QUARANTINED'));
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Update sync status
const updateSyncStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => {
            const entry = request.result;
            if (entry) {
                entry.syncStatus = status;
                entry.syncedAt = Date.now();
                store.put(entry);
            }
            resolve(entry);
        };
        request.onerror = () => reject(request.error);
    });
};

// Handle messages from main thread
self.onmessage = async (e) => {
    try {
        if (!db) {
            await openDB();
        }
        
        const { type, payload, id } = e.data;
        
        switch (type) {
            case 'INIT_DB':
                await openDB();
                self.postMessage({ id, success: true });
                break;
                
            case 'WRITE_BATCH':
                await writeBatch(payload);
                self.postMessage({ id, success: true });
                break;
                
            case 'GET_ALL_ENTRIES':
                const allEntries = await getAllEntries();
                self.postMessage({ id, success: true, data: allEntries });
                break;
                
            case 'GET_UNSYNCED_ENTRIES':
                const unsyncedEntries = await getUnsyncedEntries();
                self.postMessage({ id, success: true, data: unsyncedEntries });
                break;
                
            case 'UPDATE_SYNC_STATUS':
                await updateSyncStatus(payload.id, payload.status);
                self.postMessage({ id, success: true });
                break;
                
            default:
                self.postMessage({ id, success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};