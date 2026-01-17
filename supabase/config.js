// supabase/config.js
// Supabase configuration

// Supabase project configuration - REPLACE WITH YOUR ACTUAL PROJECT DETAILS
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to sync local data to Supabase
async function syncLocalDataToSupabase(localState) {
    try {
        // Sync farmers
        if (localState.farmers && localState.farmers.length > 0) {
            for (const farmer of localState.farmers) {
                if (farmer.syncState === 'QUARANTINED') {
                    const { data, error } = await supabaseClient
                        .from('farmers')
                        .insert([{
                            id: farmer.id,
                            name: farmer.name,
                            mobile: farmer.mobile,
                            address: farmer.address,
                            advance: farmer.advance || 0,
                            active: farmer.active !== false,
                            created_at_local: farmer.createdAtLocal || new Date().toISOString(),
                            synced_at_server: new Date().toISOString(),
                            sync_state: 'SYNCED'
                        }]);
                    
                    if (error) {
                        console.error('Farmer sync error:', error);
                        continue; // Continue with next record
                    }
                    
                    // Update local state to reflect sync
                    const idx = localState.farmers.findIndex(f => f.id === farmer.id);
                    if (idx !== -1) {
                        localState.farmers[idx].syncState = 'SYNCED';
                        localState.farmers[idx].syncedAtServer = new Date().toISOString();
                    }
                }
            }
        }
        
        // Sync milk entries
        if (localState.milkEntries && localState.milkEntries.length > 0) {
            for (const entry of localState.milkEntries) {
                if (entry.syncState === 'QUARANTINED') {
                    const { data, error } = await supabaseClient
                        .from('milk_entries')
                        .insert([{
                            id: entry.id,
                            farmer_id: entry.farmerId,
                            date: entry.date,
                            shift: entry.shift,
                            type: entry.type,
                            qty: entry.qty,
                            fat: entry.fat,
                            snf: entry.snf,
                            rate: entry.rate,
                            amount: entry.amount,
                            sync_state: 'SYNCED',
                            created_at_local: entry.createdAtLocal || new Date().toISOString(),
                            synced_at_server: new Date().toISOString()
                        }]);
                    
                    if (error) {
                        console.error('Milk entry sync error:', error);
                        continue; // Continue with next record
                    }
                    
                    // Update local state
                    const idx = localState.milkEntries.findIndex(e => e.id === entry.id);
                    if (idx !== -1) {
                        localState.milkEntries[idx].syncState = 'SYNCED';
                        localState.milkEntries[idx].syncedAtServer = new Date().toISOString();
                    }
                }
            }
        }
        
        // Sync payments
        if (localState.payments && localState.payments.length > 0) {
            for (const payment of localState.payments) {
                if (payment.syncState === 'QUARANTINED') {
                    const { data, error } = await supabaseClient
                        .from('payments')
                        .insert([{
                            id: payment.id,
                            farmer_id: payment.farmerId,
                            amount: payment.amount,
                            date: payment.date,
                            mode: payment.mode,
                            type: payment.type,
                            notes: payment.notes,
                            status: payment.status || 'Completed',
                            sync_state: 'SYNCED',
                            created_at_local: payment.createdAtLocal || new Date().toISOString(),
                            synced_at_server: new Date().toISOString()
                        }]);
                    
                    if (error) {
                        console.error('Payment sync error:', error);
                        continue; // Continue with next record
                    }
                    
                    // Update local state
                    const idx = localState.payments.findIndex(p => p.id === payment.id);
                    if (idx !== -1) {
                        localState.payments[idx].syncState = 'SYNCED';
                        localState.payments[idx].syncedAtServer = new Date().toISOString();
                    }
                }
            }
        }
        
        // Sync sales
        if (localState.sales && localState.sales.length > 0) {
            for (const sale of localState.sales) {
                if (sale.syncState === 'QUARANTINED') {
                    const { data, error } = await supabaseClient
                        .from('sales')
                        .insert([{
                            id: sale.id,
                            customer: sale.customer,
                            product_type: sale.productType,
                            date: sale.date,
                            qty: sale.qty,
                            rate: sale.rate,
                            amount: sale.amount,
                            sync_state: 'SYNCED',
                            created_at_local: sale.createdAtLocal || new Date().toISOString(),
                            synced_at_server: new Date().toISOString()
                        }]);
                    
                    if (error) {
                        console.error('Sale sync error:', error);
                        continue; // Continue with next record
                    }
                    
                    // Update local state
                    const idx = localState.sales.findIndex(s => s.id === sale.id);
                    if (idx !== -1) {
                        localState.sales[idx].syncState = 'SYNCED';
                        localState.sales[idx].syncedAtServer = new Date().toISOString();
                    }
                }
            }
        }
        
        // Sync inventory
        if (localState.inventory && localState.inventory.length > 0) {
            for (const item of localState.inventory) {
                if (item.syncState === 'QUARANTINED') {
                    const { data, error } = await supabaseClient
                        .from('inventory')
                        .insert([{
                            id: item.id,
                            item_name: item.item,
                            action: item.action,
                            supplier: item.supplier,
                            qty: item.qty,
                            rate: item.rate,
                            amount: item.amount,
                            date: item.date,
                            sync_state: 'SYNCED',
                            created_at_local: item.createdAtLocal || new Date().toISOString(),
                            synced_at_server: new Date().toISOString()
                        }]);
                    
                    if (error) {
                        console.error('Inventory sync error:', error);
                        continue; // Continue with next record
                    }
                    
                    // Update local state
                    const idx = localState.inventory.findIndex(i => i.id === item.id);
                    if (idx !== -1) {
                        localState.inventory[idx].syncState = 'SYNCED';
                        localState.inventory[idx].syncedAtServer = new Date().toISOString();
                    }
                }
            }
        }
        
        // Update settings to reflect sync completion
        localState.settings.lastServerSync = new Date().toISOString();
        localState.settings.pendingRecords = 0; // Reset pending count after sync
        
        // Save updated state back to localStorage
        localStorage.setItem('milkbook_data', JSON.stringify(localState));
        
        return { success: true, message: 'Data synced successfully' };
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, message: error.message };
    }
}

// Function to download data from Supabase
async function downloadDataFromSupabase() {
    try {
        // Get current user ID from session
        const session = sessionStorage.getItem('milkbook_session');
        if (!session) {
            throw new Error('No active session');
        }
        
        // Download farmers
        const { data: farmers, error: farmersError } = await supabaseClient
            .from('farmers')
            .select('*')
            .eq('active', true);
        
        if (farmersError && farmersError.code !== '42P01') throw farmersError; // 42P01 = table doesn't exist
        
        // Download milk entries
        const { data: milkEntries, error: milkEntriesError } = await supabaseClient
            .from('milk_entries')
            .select('*')
            .order('date', { ascending: false })
            .limit(1000);
        
        if (milkEntriesError && milkEntriesError.code !== '42P01') throw milkEntriesError;
        
        // Download payments
        const { data: payments, error: paymentsError } = await supabaseClient
            .from('payments')
            .select('*')
            .order('date', { ascending: false });
        
        if (paymentsError && paymentsError.code !== '42P01') throw paymentsError;
        
        // Download sales
        const { data: sales, error: salesError } = await supabaseClient
            .from('sales')
            .select('*')
            .order('date', { ascending: false });
        
        if (salesError && salesError.code !== '42P01') throw salesError;
        
        // Download inventory
        const { data: inventory, error: inventoryError } = await supabaseClient
            .from('inventory')
            .select('*')
            .order('date', { ascending: false });
        
        if (inventoryError && inventoryError.code !== '42P01') throw inventoryError;
        
        // Construct updated state
        const updatedState = {
            ...JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE)),
            farmers: farmers || [],
            milkEntries: milkEntries || [],
            payments: payments || [],
            sales: sales || [],
            inventory: inventory || []
        };
        
        // Save to localStorage
        localStorage.setItem('milkbook_data', JSON.stringify(updatedState));
        
        console.log('Data downloaded from Supabase successfully');
        return { success: true, message: 'Data synchronized from server' };
    } catch (error) {
        console.error('Download failed:', error);
        return { success: false, message: error.message };
    }
}

// Function to check sync status
function getSyncStatus(localState) {
    const allItems = [
        ...(localState.farmers || []),
        ...(localState.milkEntries || []),
        ...(localState.payments || []),
        ...(localState.sales || []),
        ...(localState.inventory || [])
    ];
    
    const quarantinedCount = allItems.filter(item => item.syncState === 'QUARANTINED').length;
    
    return {
        pendingRecords: quarantinedCount,
        lastSync: localState.settings.lastServerSync || 'Never',
        isConnected: navigator.onLine
    };
}

// Function to set up periodic sync when online
function setupPeriodicSync() {
    // Sync every 10 minutes when online
    setInterval(async () => {
        if (navigator.onLine) {
            const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
            await syncLocalDataToSupabase(localState);
        }
    }, 10 * 60 * 1000); // 10 minutes
}

// Function to manually trigger sync
async function manualSync() {
    if (!navigator.onLine) {
        alert('No internet connection. Data remains in local storage until connection is restored.');
        return { success: false, message: 'No internet connection' };
    }

    const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
    const result = await syncLocalDataToSupabase(localState);

    if (result.success) {
        alert('Data synced successfully to server');
    } else {
        alert('Sync failed: ' + result.message);
    }

    return result;
}

// Initialize auto-sync when online
if (navigator.onLine) {
    setupPeriodicSync();
    
    // Try to sync on startup if online
    const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
    syncLocalDataToSupabase(localState);
}

// Listen for online/offline events
window.addEventListener('online', () => {
    setupPeriodicSync();
    // Immediately try to sync when coming online
    const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
    syncLocalDataToSupabase(localState);
});

window.addEventListener('offline', () => {
    console.log('Offline mode: Sync paused');
});

// Export functions for use in other modules
window.syncLocalDataToSupabase = syncLocalDataToSupabase;
window.downloadDataFromSupabase = downloadDataFromSupabase;
window.getSyncStatus = getSyncStatus;