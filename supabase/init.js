// supabase/init.js
// Supabase initialization and core functions

// Import Supabase config
// Supabase project configuration - REPLACE WITH YOUR ACTUAL PROJECT DETAILS
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize Supabase connection
async function initSupabase() {
    try {
        // Test connection
        const { data, error } = await supabaseClient
            .from('test_table')
            .select('*')
            .limit(1);

        if (error && error.code !== '42P01') { // 42P01 means table doesn't exist
            console.error('Supabase connection failed:', error);
            return false;
        }

        console.log('Supabase connected successfully');
        return true;
    } catch (error) {
        console.error('Supabase initialization error:', error);
        return false;
    }
}

// Sync local data to Supabase
async function syncLocalDataToSupabase(localState) {
    try {
        let syncResults = { 
            farmers: { synced: 0, failed: 0 }, 
            milkEntries: { synced: 0, failed: 0 }, 
            payments: { synced: 0, failed: 0 },
            sales: { synced: 0, failed: 0 },
            inventory: { synced: 0, failed: 0 }
        };
        
        // Sync farmers
        if (localState.farmers && Array.isArray(localState.farmers)) {
            for (const farmer of localState.farmers) {
                if (farmer.syncState === 'QUARANTINED') {
                    const { data, error } = await supabase
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
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Farmer sync error:', error);
                        syncResults.farmers.failed++;
                    } else {
                        syncResults.farmers.synced++;
                        
                        // Update local farmer record
                        const idx = localState.farmers.findIndex(f => f.id === farmer.id);
                        if (idx !== -1) {
                            localState.farmers[idx].syncState = 'SYNCED';
                            localState.farmers[idx].syncedAtServer = new Date().toISOString();
                        }
                    }
                }
            }
        }
        
        // Sync milk entries
        if (localState.milkEntries && Array.isArray(localState.milkEntries)) {
            for (const entry of localState.milkEntries) {
                if (entry.syncState === 'QUARANTINED') {
                    const { data, error } = await supabase
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
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Milk entry sync error:', error);
                        syncResults.milkEntries.failed++;
                    } else {
                        syncResults.milkEntries.synced++;
                        
                        // Update local entry record
                        const idx = localState.milkEntries.findIndex(e => e.id === entry.id);
                        if (idx !== -1) {
                            localState.milkEntries[idx].syncState = 'SYNCED';
                            localState.milkEntries[idx].syncedAtServer = new Date().toISOString();
                        }
                    }
                }
            }
        }
        
        // Sync payments
        if (localState.payments && Array.isArray(localState.payments)) {
            for (const payment of localState.payments) {
                if (payment.syncState === 'QUARANTINED') {
                    const { data, error } = await supabase
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
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Payment sync error:', error);
                        syncResults.payments.failed++;
                    } else {
                        syncResults.payments.synced++;
                        
                        // Update local payment record
                        const idx = localState.payments.findIndex(p => p.id === payment.id);
                        if (idx !== -1) {
                            localState.payments[idx].syncState = 'SYNCED';
                            localState.payments[idx].syncedAtServer = new Date().toISOString();
                        }
                    }
                }
            }
        }
        
        // Sync sales
        if (localState.sales && Array.isArray(localState.sales)) {
            for (const sale of localState.sales) {
                if (sale.syncState === 'QUARANTINED') {
                    const { data, error } = await supabase
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
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Sale sync error:', error);
                        syncResults.sales.failed++;
                    } else {
                        syncResults.sales.synced++;
                        
                        // Update local sale record
                        const idx = localState.sales.findIndex(s => s.id === sale.id);
                        if (idx !== -1) {
                            localState.sales[idx].syncState = 'SYNCED';
                            localState.sales[idx].syncedAtServer = new Date().toISOString();
                        }
                    }
                }
            }
        }
        
        // Sync inventory
        if (localState.inventory && Array.isArray(localState.inventory)) {
            for (const item of localState.inventory) {
                if (item.syncState === 'QUARANTINED') {
                    const { data, error } = await supabase
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
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Inventory sync error:', error);
                        syncResults.inventory.failed++;
                    } else {
                        syncResults.inventory.synced++;
                        
                        // Update local inventory record
                        const idx = localState.inventory.findIndex(i => i.id === item.id);
                        if (idx !== -1) {
                            localState.inventory[idx].syncState = 'SYNCED';
                            localState.inventory[idx].syncedAtServer = new Date().toISOString();
                        }
                    }
                }
            }
        }
        
        // Update settings with sync information
        localState.settings.lastServerSync = new Date().toISOString();
        localState.settings.pendingRecords = 0; // Reset pending after successful sync
        
        // Save updated state back to localStorage
        localStorage.setItem('milkbook_data', JSON.stringify(localState));
        
        console.log('Sync completed:', syncResults);
        return { success: true, results: syncResults };
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, error: error.message };
    }
}

// Download data from Supabase to local storage
async function downloadDataFromSupabase() {
    try {
        // Get current user ID from session
        const session = sessionStorage.getItem('milkbook_session');
        if (!session) {
            throw new Error('No active session');
        }
        
        const user = JSON.parse(session);
        const userId = user.id;
        
        // Download farmers
        const { data: farmers, error: farmersError } = await supabase
            .from('farmers')
            .select('*')
            .eq('active', true);
        
        if (farmersError && farmersError.code !== '42P01') throw farmersError;
        
        // Download milk entries
        const { data: milkEntries, error: milkEntriesError } = await supabase
            .from('milk_entries')
            .select('*')
            .order('date', { ascending: false })
            .limit(1000);
        
        if (milkEntriesError && milkEntriesError.code !== '42P01') throw milkEntriesError;
        
        // Download payments
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .order('date', { ascending: false });
        
        if (paymentsError && paymentsError.code !== '42P01') throw paymentsError;
        
        // Download sales
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });
        
        if (salesError && salesError.code !== '42P01') throw salesError;
        
        // Download inventory
        const { data: inventory, error: inventoryError } = await supabase
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

// Check sync status
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

// Set up periodic sync when online
function setupPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(async () => {
        if (navigator.onLine) {
            const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
            await syncLocalDataToSupabase(localState);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize Supabase when online
if (navigator.onLine) {
    initSupabase().then(isConnected => {
        if (isConnected) {
            setupPeriodicSync();
            
            // Sync any pending records on startup
            const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
            syncLocalDataToSupabase(localState);
        }
    });
}

// Handle online/offline events
window.addEventListener('online', async () => {
    console.log('Online: Attempting to sync...');
    const localState = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
    await syncLocalDataToSupabase(localState);
});

window.addEventListener('offline', () => {
    console.log('Offline: Sync paused');
});