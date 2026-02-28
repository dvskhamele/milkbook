"""
Database Adapter - Cloud (PostgreSQL via Vercel)
For Vercel serverless deployment
Uses environment variable DATABASE_URL
"""

import os
from typing import List, Dict, Optional, Any
from datetime import datetime

# Try to import psycopg2, fallback to None for development
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False
    print("Warning: psycopg2 not installed. Cloud database disabled.")


def get_connection():
    """Get PostgreSQL connection"""
    if not HAS_PSYCOPG2:
        raise RuntimeError("psycopg2 not installed")
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable not set")
    
    conn = psycopg2.connect(database_url)
    return conn


def init_db():
    """Initialize database schema"""
    if not HAS_PSYCOPG2:
        return
    
    try:
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
                collection_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Sales table
        c.execute('''
            CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                customer_id TEXT,
                customer_name TEXT,
                items JSONB,
                total_amount REAL,
                paid_amount REAL,
                payment_mode TEXT,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        ''')
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error initializing database: {e}")


# ============================================
# Farmer Repository
# ============================================

def farmer_save(farmer: Dict) -> bool:
    """Save farmer"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            INSERT INTO farmers 
            (id, name, phone, animal_type, balance, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                animal_type = EXCLUDED.animal_type,
                balance = EXCLUDED.balance
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
        c = conn.cursor(cursor_factory=RealDictCursor)
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
        c = conn.cursor(cursor_factory=RealDictCursor)
        c.execute('SELECT * FROM farmers WHERE id = %s', (farmer_id,))
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
        
        # Insert collection
        c.execute('''
            INSERT INTO milk_collections 
            (id, farmer_id, quantity, fat, snf, rate, amount, shift, collection_date, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
            UPDATE farmers SET balance = balance + %s WHERE id = %s
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
        c = conn.cursor(cursor_factory=RealDictCursor)
        c.execute('''
            SELECT * FROM milk_collections 
            WHERE farmer_id = %s 
            ORDER BY collection_date DESC, created_at DESC
            LIMIT %s
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
            INSERT INTO customers 
            (id, name, phone, email, address, balance, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                address = EXCLUDED.address,
                balance = EXCLUDED.balance
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
        c = conn.cursor(cursor_factory=RealDictCursor)
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
        
        # Insert sale
        c.execute('''
            INSERT INTO sales 
            (id, customer_id, customer_name, items, total_amount, paid_amount, payment_mode, sale_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
                UPDATE customers SET balance = balance + %s WHERE id = %s
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
        c = conn.cursor(cursor_factory=RealDictCursor)
        c.execute('''
            SELECT * FROM sales 
            ORDER BY sale_date DESC 
            LIMIT %s
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
        c = conn.cursor(cursor_factory=RealDictCursor)
        c.execute('SELECT * FROM sales WHERE id = %s', (sale_id,))
        row = c.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting sale: {e}")
        return None
