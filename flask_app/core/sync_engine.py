"""
Sync Engine - Background Synchronization for Desktop
Automatically syncs pending records to Supabase when internet is available
Runs in background thread, non-blocking
"""

import os
import sys
import time
import threading
import requests
from datetime import datetime
from typing import List, Dict

# Import adapters
from adapters import db_local, db_supabase


class SyncEngine:
    """
    Background sync engine for desktop
    Syncs pending records to Supabase every 10 seconds
    """
    
    def __init__(self):
        self.running = False
        self.thread = None
        self.sync_interval = 10  # seconds
        self.device_id = None
    
    def start(self):
        """Start background sync thread"""
        if self.running:
            print("⚠️ Sync engine already running")
            return
        
        self.running = True
        self.device_id = db_local.get_device_id()
        
        self.thread = threading.Thread(target=self._sync_loop, daemon=True)
        self.thread.start()
        
        print(f"✅ Sync engine started (interval: {self.sync_interval}s)")
    
    def stop(self):
        """Stop background sync thread"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("🛑 Sync engine stopped")
    
    def _sync_loop(self):
        """Main sync loop"""
        while self.running:
            try:
                # Check internet
                if self._internet_available():
                    print("🌐 Internet available, syncing...")
                    
                    # Sync farmers
                    self._sync_table('farmers')
                    
                    # Sync customers
                    self._sync_table('customers')
                    
                    # Sync sales
                    self._sync_table('sales')
                    
                    # Sync products
                    self._sync_table('products')
                    
                    print("✅ Sync complete")
                else:
                    print("⚠️ No internet, skipping sync")
                
            except Exception as e:
                print(f"❌ Sync error: {e}")
            
            # Wait for next sync
            time.sleep(self.sync_interval)
    
    def _internet_available(self) -> bool:
        """Check if internet is available"""
        try:
            requests.get("https://google.com", timeout=3)
            return True
        except:
            return False
    
    def _sync_table(self, table_name: str):
        """Sync pending records from a table"""
        try:
            # Get pending records
            if table_name == 'farmers':
                pending = db_local.farmer_get_pending_sync()
                save_func = db_local.farmer_mark_synced
                supabase_save = db_supabase.farmer_save
            elif table_name == 'customers':
                pending = db_local.customer_get_all()  # All customers for now
                pending = [p for p in pending if p.get('sync_status') == 'pending']
                save_func = lambda x: True  # No mark synced for customers yet
                supabase_save = db_supabase.customer_save
            elif table_name == 'sales':
                pending = db_local.sale_get_pending_sync()
                save_func = db_local.sale_mark_synced
                supabase_save = db_supabase.sale_save
            elif table_name == 'products':
                pending = db_local.product_get_all()
                pending = [p for p in pending if p.get('sync_status') == 'pending']
                save_func = lambda x: True
                supabase_save = db_supabase.product_save
            else:
                return
            
            if not pending:
                return
            
            print(f"📤 Syncing {len(pending)} {table_name}...")
            
            for record in pending:
                try:
                    # Check for conflicts
                    conflict = db_supabase.check_conflict(
                        table_name,
                        record['id'],
                        record.get('version', 1)
                    )
                    
                    if conflict['has_conflict']:
                        print(f"⚠️ Conflict detected for {table_name}/{record['id']}")
                        db_local.log_sync(
                            self.device_id,
                            table_name,
                            record['id'],
                            'SYNC',
                            'conflict',
                            f"Remote version {conflict['remote_version']} > local version {record.get('version', 1)}"
                        )
                        continue
                    
                    # Prepare data for Supabase (remove sync fields)
                    supabase_data = {k: v for k, v in record.items() if k not in ['sync_status', 'device_id']}
                    supabase_data['sync_status'] = 'synced'
                    
                    # Save to Supabase
                    if supabase_save(supabase_data):
                        # Mark as synced locally
                        save_func(record['id'])
                        
                        db_local.log_sync(
                            self.device_id,
                            table_name,
                            record['id'],
                            'SYNC',
                            'success',
                            None
                        )
                        print(f"✅ Synced {table_name}/{record['id']}")
                    else:
                        raise Exception("Supabase save failed")
                
                except Exception as e:
                    print(f"❌ Failed to sync {table_name}/{record['id']}: {e}")
                    db_local.log_sync(
                        self.device_id,
                        table_name,
                        record['id'],
                        'SYNC',
                        'failed',
                        str(e)
                    )
        
        except Exception as e:
            print(f"❌ Error syncing {table_name}: {e}")


# Global sync engine instance
sync_engine = SyncEngine()


def start_sync():
    """Start background sync"""
    sync_engine.start()


def stop_sync():
    """Stop background sync"""
    sync_engine.stop()


def force_sync():
    """Force immediate sync"""
    if sync_engine._internet_available():
        print("🔄 Force syncing...")
        sync_engine._sync_table('farmers')
        sync_engine._sync_table('customers')
        sync_engine._sync_table('sales')
        sync_engine._sync_table('products')
        print("✅ Force sync complete")
    else:
        print("⚠️ No internet for force sync")
