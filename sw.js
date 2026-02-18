// MilkRecord Service Worker
const CACHE_NAME = 'milkrecord-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available, otherwise fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Background sync for data synchronization
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Function to sync data when online
async function syncData() {
  try {
    // Get unsynced entries from IndexedDB/localStorage
    const unsyncedEntries = await getUnsyncedEntries();
    
    for (const entry of unsyncedEntries) {
      try {
        // Attempt to sync with server
        const response = await fetch('https://your-api-endpoint.com/api/sync-entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
        
        if (response.ok) {
          // Mark as synced in local storage
          await markAsSynced(entry.id);
        }
      } catch (error) {
        console.error('Sync failed for entry:', entry.id, error);
        // Keep entry marked as unsynced for retry
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper function to get unsynced entries
async function getUnsyncedEntries() {
  // In a real implementation, you would retrieve entries from localStorage
  // that have syncStatus !== 'synced'
  const entries = JSON.parse(localStorage.getItem('milkapp_entries_v2') || '[]');
  return entries.filter(entry => entry.syncStatus !== 'synced');
}

// Helper function to mark entries as synced
async function markAsSynced(entryId) {
  // In a real implementation, you would update the entry in localStorage
  // to have syncStatus = 'synced'
  const entries = JSON.parse(localStorage.getItem('milkapp_entries_v2') || '[]');
  const updatedEntries = entries.map(entry => {
    if (entry.id === entryId) {
      return {...entry, syncStatus: 'synced'};
    }
    return entry;
  });
  
  localStorage.setItem('milkapp_entries_v2', JSON.stringify(updatedEntries));
}