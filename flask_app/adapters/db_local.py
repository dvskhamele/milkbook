"""
Database Adapter - Local (SQLite)
For Desktop/EXE deployment
"""

import sqlite3
import os
from typing import List, Dict, Optional, Any
from datetime import datetime

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'milkrecord.db')


def get_connection():
    """Get SQLite connection"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database schema"""
    conn = get_connection()
    c = conn.cursor()
    
    # Farmers table
    c.execute('''
        CREATE TABLE IF NOT EXISTS farmers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            animal_type TEXT,
            balance REAL DEFAULT 0,
            created_at TEXT
        )
    ''')
    
    # Milk collections table
    c.execute('''
        CREATE TABLE IF NOT EXISTS milk_collections (
            id TEXT PRIMARY KEY,
            farmer_id TEXT,
            quantity REAL,
            fat REAL,
            snf REAL,
            rate REAL,
            amount REAL,
            shift TEXT,
            collection_date TEXT,
            created_at TEXT,
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
        )
    ''')
    
    # Customers table
    c.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            balance REAL DEFAULT 0,
            created_at TEXT
        )
    ''')
    
    # Sales table
    c.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            customer_id TEXT,
            customer_name TEXT,
            items TEXT,
            total_amount REAL,
            paid_amount REAL,
            payment_mode TEXT,
            sale_date TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    ''')
    
    conn.commit()
    conn.close()


# ============================================
# Farmer Repository
# ============================================

def farmer_save(farmer: Dict) -> bool:
    """Save farmer"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO farmers 
            (id, name, phone, animal_type, balance, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            farmer['id'],
            farmer['name'],
            farmer.get('phone'),
            farmer.get('animal_type', 'cow'),
            farmer.get('balance', 0.0),
            farmer.get('created_at', datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving farmer: {e}")
        return False


def farmer_get_all() -> List[Dict]:
    """Get all farmers"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM farmers ORDER BY name')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting farmers: {e}")
        return []


def farmer_get_by_id(farmer_id: str) -> Optional[Dict]:
    """Get farmer by ID"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM farmers WHERE id = ?', (farmer_id,))
        row = c.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting farmer: {e}")
        return None


# ============================================
# Collection Repository
# ============================================

def collection_save(collection: Dict) -> bool:
    """Save milk collection"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            INSERT INTO milk_collections 
            (id, farmer_id, quantity, fat, snf, rate, amount, shift, collection_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            collection['id'],
            collection['farmer_id'],
            collection['quantity'],
            collection.get('fat'),
            collection.get('snf'),
            collection['rate'],
            collection['amount'],
            collection.get('shift', 'morning'),
            collection.get('collection_date', datetime.now().strftime('%Y-%m-%d')),
            collection.get('created_at', datetime.now().isoformat())
        ))
        
        # Update farmer balance
        c.execute('''
            UPDATE farmers SET balance = balance + ? WHERE id = ?
        ''', (collection['amount'], collection['farmer_id']))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving collection: {e}")
        return False


def collection_get_by_farmer(farmer_id: str, limit: int = 100) -> List[Dict]:
    """Get collections by farmer"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            SELECT * FROM milk_collections 
            WHERE farmer_id = ? 
            ORDER BY collection_date DESC, created_at DESC
            LIMIT ?
        ''', (farmer_id, limit))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting collections: {e}")
        return []


# ============================================
# Customer Repository
# ============================================

def customer_save(customer: Dict) -> bool:
    """Save customer"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO customers 
            (id, name, phone, email, address, balance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            customer['id'],
            customer['name'],
            customer.get('phone'),
            customer.get('email'),
            customer.get('address'),
            customer.get('balance', 0.0),
            customer.get('created_at', datetime.now().isoformat())
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving customer: {e}")
        return False


def customer_get_all() -> List[Dict]:
    """Get all customers"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM customers ORDER BY name')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting customers: {e}")
        return []


# ============================================
# Sale Repository
# ============================================

def sale_save(sale: Dict) -> bool:
    """Save sale"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            INSERT INTO sales 
            (id, customer_id, customer_name, items, total_amount, paid_amount, payment_mode, sale_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            sale['id'],
            sale.get('customer_id'),
            sale.get('customer_name', 'Walking Customer'),
            sale.get('items', '[]'),
            sale['total_amount'],
            sale.get('paid_amount', 0.0),
            sale.get('payment_mode', 'cash'),
            sale.get('sale_date', datetime.now().isoformat())
        ))
        
        # Update customer balance if credit
        if sale.get('payment_mode') == 'credit' and sale.get('customer_id'):
            balance_due = sale['total_amount'] - sale.get('paid_amount', 0.0)
            c.execute('''
                UPDATE customers SET balance = balance + ? WHERE id = ?
            ''', (balance_due, sale['customer_id']))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving sale: {e}")
        return False


def sale_get_all(limit: int = 100) -> List[Dict]:
    """Get all sales"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            SELECT * FROM sales 
            ORDER BY sale_date DESC 
            LIMIT ?
        ''', (limit,))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting sales: {e}")
        return []


def sale_get_by_id(sale_id: str) -> Optional[Dict]:
    """Get sale by ID"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM sales WHERE id = ?', (sale_id,))
        row = c.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting sale: {e}")
        return None
