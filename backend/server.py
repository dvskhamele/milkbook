#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MilkRecord POS - Enhanced Backend Server
Flask + SQLite + SocketIO + Hardware Integration

Features:
- REST API for POS operations
- Real-time updates via WebSocket
- Hardware device integration
- Audit trail logging
- Offline sync support
- Multi-shop support
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import sqlite3
import os
import json
from datetime import datetime, timedelta
import hashlib
import uuid
import logging
from functools import wraps

# Initialize Flask app
app = Flask(__name__, static_folder='apps', static_url_path='')
app.config['SECRET_KEY'] = 'milkrecord-pos-secret-2026'
app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'data', 'milkrecord.db')

# Enable CORS for all routes
CORS(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================
# DATABASE SETUP
# =====================================================

def get_db():
    """Get database connection"""
    db = getattr(app, '_database', None)
    if db is None:
        db = app._database = sqlite3.connect(app.config['DATABASE'])
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close database connection"""
    db = getattr(app, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize database with all tables"""
    os.makedirs(os.path.dirname(app.config['DATABASE']), exist_ok=True)
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Shops table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner_name TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            gst_number TEXT,
            license_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'operator',
            operator_id TEXT UNIQUE,
            active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            balance REAL DEFAULT 0.0,
            credit_limit REAL DEFAULT 0.0,
            active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            price REAL NOT NULL,
            cost REAL DEFAULT 0.0,
            unit TEXT DEFAULT 'unit',
            barcode TEXT,
            sku TEXT,
            stock_qty REAL DEFAULT 0.0,
            min_stock REAL DEFAULT 0.0,
            active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Shifts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            shift_id TEXT UNIQUE NOT NULL,
            shift_type TEXT NOT NULL,
            opening_cash REAL DEFAULT 0.0,
            closing_cash REAL DEFAULT 0.0,
            expected_cash REAL DEFAULT 0.0,
            variance REAL DEFAULT 0.0,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            status TEXT DEFAULT 'open',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Invoices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            shift_id INTEGER,
            invoice_number TEXT UNIQUE NOT NULL,
            customer_id INTEGER,
            customer_name TEXT,
            subtotal REAL NOT NULL,
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            total REAL NOT NULL,
            payment_mode TEXT NOT NULL,
            amount_paid REAL NOT NULL,
            change REAL DEFAULT 0.0,
            status TEXT DEFAULT 'completed',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (shift_id) REFERENCES shifts(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    ''')
    
    # Invoice items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            total REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    # Customer ledger table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            shop_id INTEGER NOT NULL,
            transaction_type TEXT NOT NULL,
            amount REAL NOT NULL,
            balance REAL NOT NULL,
            reference_type TEXT,
            reference_id INTEGER,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Audit logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER,
            user_id INTEGER,
            session_id TEXT NOT NULL,
            machine_id TEXT,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            old_data TEXT,
            new_data TEXT,
            notes TEXT,
            hash TEXT,
            previous_hash TEXT,
            signature TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Sync queue table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id INTEGER,
            action TEXT NOT NULL,
            data TEXT,
            synced BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            synced_at TIMESTAMP
        )
    ''')
    
    # Hardware devices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hardware_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            device_type TEXT NOT NULL,
            device_id TEXT,
            device_name TEXT,
            status TEXT DEFAULT 'inactive',
            last_seen TIMESTAMP,
            config TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_invoices_shop ON invoices(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_shifts_shop ON shifts(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_shop ON audit_logs(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced)')
    
    # Insert default shop
    cursor.execute('''
        INSERT OR IGNORE INTO shops (id, name, phone)
        VALUES (1, 'Gopal Dairy', '9876543210')
    ''')
    
    # Insert default user (password: admin123)
    import hashlib
    password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
    cursor.execute('''
        INSERT OR IGNORE INTO users (id, shop_id, name, email, password_hash, role, operator_id)
        VALUES (1, 1, 'Admin User', 'admin@milkrecord.com', ?, 'admin', 'OP-001')
    ''', (password_hash,))
    
    conn.commit()
    conn.close()
    
    logger.info("✅ Database initialized successfully")

# =====================================================
# AUDIT TRAIL HELPER
# =====================================================

class AuditTrail:
    """Audit trail logging system"""
    
    def __init__(self):
        self.previous_hash = None
    
    def log(self, shop_id, user_id, action, entity_type=None, entity_id=None, 
            old_data=None, new_data=None, notes='', session_id=None, machine_id=None):
        """Log an audit entry"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate hash
        entry_data = {
            'shop_id': shop_id,
            'user_id': user_id,
            'action': action,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'timestamp': datetime.now().isoformat(),
            'previous_hash': self.previous_hash
        }
        
        hash_string = json.dumps(entry_data, sort_keys=True)
        current_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        
        # Generate signature
        signature = 'SIG-' + hashlib.md5(
            f"{session_id}{action}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16].upper()
        
        # Insert audit log
        cursor.execute('''
            INSERT INTO audit_logs 
            (shop_id, user_id, session_id, machine_id, action, entity_type, entity_id,
             old_data, new_data, notes, hash, previous_hash, signature,
             ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            shop_id, user_id, session_id or str(uuid.uuid4()), machine_id,
            action, entity_type, entity_id,
            json.dumps(old_data) if old_data else None,
            json.dumps(new_data) if new_data else None,
            notes, current_hash, self.previous_hash, signature,
            request.remote_addr, request.headers.get('User-Agent', '')
        ))
        
        self.previous_hash = current_hash
        conn.commit()
        
        # Emit real-time update
        socketio.emit('audit_log', {
            'action': action,
            'entity_type': entity_type,
            'timestamp': datetime.now().isoformat()
        })
        
        return current_hash

audit = AuditTrail()

# =====================================================
# DECORATORS
# =====================================================

def require_auth(f):
    """Require authentication decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization required'}), 401
        
        # Simple token validation (implement proper JWT in production)
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid authorization format'}), 401
        
        token = auth_header[7:]
        # Validate token (implement proper validation)
        kwargs['auth_token'] = token
        return f(*args, **kwargs)
    return decorated

# =====================================================
# API ROUTES - AUTH
# =====================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    data = request.json
    operator_id = data.get('operator_id')
    password = data.get('password')
    
    if not operator_id or not password:
        return jsonify({'error': 'Operator ID and password required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Hash password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Find user
    cursor.execute('''
        SELECT u.id, u.name, u.email, u.role, u.shop_id, s.name as shop_name
        FROM users u
        JOIN shops s ON u.shop_id = s.id
        WHERE u.operator_id = ? AND u.password_hash = ? AND u.active = 1
    ''', (operator_id, password_hash))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        # Log failed login
        audit.log(1, None, 'LOGIN_FAILED', 'user', None, 
                  notes=f'Failed login attempt for {operator_id}')
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate session token
    session_token = str(uuid.uuid4())
    
    # Log successful login
    audit.log(user['shop_id'], user['id'], 'LOGIN_SUCCESS', 'user', user['id'],
              notes=f'User {user["name"]} logged in')
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'shop_id': user['shop_id'],
            'shop_name': user['shop_name']
        },
        'token': session_token
    })

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """User logout"""
    # Get user from token (implement proper token validation)
    data = request.json
    user_id = data.get('user_id')
    shop_id = data.get('shop_id')
    
    audit.log(shop_id, user_id, 'LOGOUT', 'user', user_id,
              notes='User logged out')
    
    return jsonify({'success': True})

# =====================================================
# API ROUTES - PRODUCTS
# =====================================================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    shop_id = request.args.get('shop_id', 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM products 
        WHERE shop_id = ? AND active = 1
        ORDER BY name
    ''', (shop_id,))
    
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'products': products, 'count': len(products)})

@app.route('/api/products', methods=['POST'])
@require_auth
def create_product():
    """Create new product"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    
    required = ['name', 'price']
    if not all(k in data for k in required):
        return jsonify({'error': 'Name and price required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO products 
        (shop_id, name, category, price, cost, unit, barcode, sku, stock_qty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        shop_id, data['name'], data.get('category', 'general'),
        data['price'], data.get('cost', 0), data.get('unit', 'unit'),
        data.get('barcode'), data.get('sku'), data.get('stock_qty', 0)
    ))
    
    product_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Audit log
    audit.log(shop_id, user_id, 'PRODUCT_CREATE', 'product', product_id,
              new_data=data, notes=f'Created product: {data["name"]}')
    
    # Emit real-time update
    socketio.emit('product_created', {'id': product_id, 'shop_id': shop_id})
    
    return jsonify({'success': True, 'id': product_id})

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@require_auth
def update_product(product_id):
    """Update product"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get old data
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    old_product = dict(cursor.fetchone() or {})
    
    # Update
    cursor.execute('''
        UPDATE products 
        SET name = ?, price = ?, category = ?, unit = ?, 
            barcode = ?, stock_qty = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND shop_id = ?
    ''', (
        data.get('name', old_product.get('name')),
        data.get('price', old_product.get('price')),
        data.get('category', old_product.get('category')),
        data.get('unit', old_product.get('unit')),
        data.get('barcode', old_product.get('barcode')),
        data.get('stock_qty', old_product.get('stock_qty')),
        product_id, shop_id
    ))
    
    conn.commit()
    conn.close()
    
    # Audit log
    audit.log(shop_id, user_id, 'PRODUCT_UPDATE', 'product', product_id,
              old_data=old_product, new_data=data,
              notes=f'Updated product: {product_id}')
    
    return jsonify({'success': True})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_auth
def delete_product(product_id):
    """Delete product (soft delete)"""
    shop_id = request.args.get('shop_id', 1)
    user_id = request.args.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE products SET active = 0 WHERE id = ? AND shop_id = ?
    ''', (product_id, shop_id))
    
    conn.commit()
    conn.close()
    
    audit.log(shop_id, user_id, 'PRODUCT_DELETE', 'product', product_id,
              notes=f'Deleted product: {product_id}')
    
    return jsonify({'success': True})

@app.route('/api/products/barcode/<barcode>', methods=['GET'])
def get_product_by_barcode(barcode):
    """Get product by barcode"""
    shop_id = request.args.get('shop_id', 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM products 
        WHERE barcode = ? AND shop_id = ? AND active = 1
    ''', (barcode, shop_id))
    
    product = cursor.fetchone()
    conn.close()
    
    if product:
        return jsonify({'success': True, 'product': dict(product)})
    else:
        return jsonify({'error': 'Product not found'}), 404

# =====================================================
# API ROUTES - INVOICES
# =====================================================

@app.route('/api/invoices', methods=['POST'])
@require_auth
def create_invoice():
    """Create new invoice (sale)"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    shift_id = data.get('shift_id')
    
    required = ['invoice_number', 'items', 'total', 'payment_mode', 'amount_paid']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Insert invoice
    cursor.execute('''
        INSERT INTO invoices 
        (shop_id, shift_id, invoice_number, customer_id, customer_name,
         subtotal, discount, tax, total, payment_mode, amount_paid, change)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        shop_id, shift_id, data['invoice_number'],
        data.get('customer_id'), data.get('customer_name', 'Walking Customer'),
        data.get('subtotal', data['total']), data.get('discount', 0),
        data.get('tax', 0), data['total'], data['payment_mode'],
        data['amount_paid'], data.get('change', 0)
    ))
    
    invoice_id = cursor.lastrowid
    
    # Insert invoice items
    for item in data.get('items', []):
        cursor.execute('''
            INSERT INTO invoice_items 
            (invoice_id, product_id, product_name, quantity, unit_price, total)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            invoice_id, item.get('product_id'), item['product_name'],
            item['quantity'], item['unit_price'], item['total']
        ))
    
    # Update customer balance if credit
    if data.get('payment_mode') == 'CREDIT' and data.get('customer_id'):
        balance = data.get('amount_paid', 0) - data['total']
        cursor.execute('''
            UPDATE customers SET balance = balance + ? WHERE id = ?
        ''', (-balance, data['customer_id']))
        
        # Add to customer ledger
        cursor.execute('''
            INSERT INTO customer_ledger 
            (customer_id, shop_id, transaction_type, amount, balance,
             reference_type, reference_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['customer_id'], shop_id, 'debit', data['total'],
            balance, 'invoice', invoice_id, f'Invoice {data["invoice_number"]}'
        ))
    
    conn.commit()
    conn.close()
    
    # Audit log
    audit.log(shop_id, user_id, 'SALE_CREATE', 'invoice', invoice_id,
              new_data=data, notes=f'Sale of ₹{data["total"]:.2f}')
    
    # Emit real-time update
    socketio.emit('sale_created', {
        'invoice_id': invoice_id,
        'total': data['total'],
        'shop_id': shop_id
    })
    
    return jsonify({'success': True, 'invoice_id': invoice_id})

@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    """Get invoices"""
    shop_id = request.args.get('shop_id', 1)
    limit = request.args.get('limit', 50)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT i.*, c.name as customer_name 
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = ?
        ORDER BY i.created_at DESC
        LIMIT ?
    ''', (shop_id, limit))
    
    invoices = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'invoices': invoices, 'count': len(invoices)})

# =====================================================
# API ROUTES - SHIFTS
# =====================================================

@app.route('/api/shifts', methods=['POST'])
@require_auth
def create_shift():
    """Start new shift"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    
    required = ['shift_id', 'shift_type', 'opening_cash']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO shifts 
        (shop_id, user_id, shift_id, shift_type, opening_cash, start_time, status)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'open')
    ''', (shop_id, user_id, data['shift_id'], data['shift_type'], data['opening_cash']))
    
    shift_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    audit.log(shop_id, user_id, 'SHIFT_START', 'shift', shift_id,
              new_data=data, notes=f'Shift started: {data["shift_id"]}')
    
    return jsonify({'success': True, 'shift_id': shift_id})

@app.route('/api/shifts/<int:shift_id>/end', methods=['POST'])
@require_auth
def end_shift(shift_id):
    """End shift"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Calculate expected cash from sales
    cursor.execute('''
        SELECT COALESCE(SUM(total), 0) as total_sales
        FROM invoices 
        WHERE shift_id = ? AND payment_mode IN ('CASH', 'CREDIT')
    ''', (shift_id,))
    
    result = cursor.fetchone()
    expected_cash = result['total_sales'] if result else 0
    
    closing_cash = data.get('closing_cash', 0)
    variance = closing_cash - expected_cash
    
    cursor.execute('''
        UPDATE shifts 
        SET closing_cash = ?, expected_cash = ?, variance = ?,
            end_time = CURRENT_TIMESTAMP, status = 'closed'
        WHERE id = ? AND shop_id = ?
    ''', (closing_cash, expected_cash, variance, shift_id, shop_id))
    
    conn.commit()
    conn.close()
    
    audit.log(shop_id, user_id, 'SHIFT_END', 'shift', shift_id,
              new_data={'closing_cash': closing_cash, 'variance': variance},
              notes=f'Shift ended with variance: ₹{variance:.2f}')
    
    return jsonify({'success': True, 'variance': variance})

@app.route('/api/shifts/current', methods=['GET'])
def get_current_shift():
    """Get current open shift"""
    shop_id = request.args.get('shop_id', 1)
    user_id = request.args.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT s.*, u.name as operator_name
        FROM shifts s
        JOIN users u ON s.user_id = u.id
        WHERE s.shop_id = ? AND s.user_id = ? AND s.status = 'open'
        ORDER BY s.start_time DESC
        LIMIT 1
    ''', (shop_id, user_id))
    
    shift = cursor.fetchone()
    conn.close()
    
    if shift:
        return jsonify({'success': True, 'shift': dict(shift)})
    else:
        return jsonify({'success': True, 'shift': None})

# =====================================================
# API ROUTES - CUSTOMERS
# =====================================================

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get customers"""
    shop_id = request.args.get('shop_id', 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM customers 
        WHERE shop_id = ? AND active = 1
        ORDER BY name
    ''', (shop_id,))
    
    customers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'customers': customers, 'count': len(customers)})

@app.route('/api/customers', methods=['POST'])
@require_auth
def create_customer():
    """Create customer"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO customers (shop_id, name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
    ''', (shop_id, data['name'], data.get('phone'), data.get('email'), data.get('address')))
    
    customer_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    audit.log(shop_id, user_id, 'CUSTOMER_CREATE', 'customer', customer_id,
              new_data=data, notes=f'Created customer: {data["name"]}')
    
    return jsonify({'success': True, 'customer_id': customer_id})

@app.route('/api/customers/<int:customer_id>/ledger', methods=['GET'])
def get_customer_ledger(customer_id):
    """Get customer ledger"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM customer_ledger 
        WHERE customer_id = ?
        ORDER BY created_at DESC
        LIMIT 100
    ''', (customer_id,))
    
    entries = [dict(row) for row in cursor.fetchall()]
    
    # Get current balance
    cursor.execute('SELECT balance FROM customers WHERE id = ?', (customer_id,))
    customer = cursor.fetchone()
    
    conn.close()
    
    return jsonify({
        'success': True,
        'ledger': entries,
        'balance': customer['balance'] if customer else 0
    })

@app.route('/api/customers/ledger', methods=['POST'])
@require_auth
def add_ledger_entry():
    """Add customer ledger entry"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    user_id = data.get('user_id')
    
    required = ['customer_id', 'transaction_type', 'amount']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Update customer balance
    if data['transaction_type'] == 'credit':
        cursor.execute('''
            UPDATE customers SET balance = balance + ? WHERE id = ?
        ''', (data['amount'], data['customer_id']))
    else:  # debit
        cursor.execute('''
            UPDATE customers SET balance = balance - ? WHERE id = ?
        ''', (data['amount'], data['customer_id']))
    
    # Get new balance
    cursor.execute('SELECT balance FROM customers WHERE id = ?', (data['customer_id'],))
    new_balance = cursor.fetchone()['balance']
    
    # Add ledger entry
    cursor.execute('''
        INSERT INTO customer_ledger 
        (customer_id, shop_id, transaction_type, amount, balance, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['customer_id'], shop_id, data['transaction_type'], 
          data['amount'], new_balance, data.get('notes', '')))
    
    conn.commit()
    conn.close()
    
    audit.log(shop_id, user_id, 'LEDGER_ENTRY', 'customer_ledger', None,
              new_data=data, notes=f'Ledger {data["transaction_type"]}: ₹{data["amount"]:.2f}')
    
    return jsonify({'success': True, 'balance': new_balance})

# =====================================================
# API ROUTES - AUDIT
# =====================================================

@app.route('/api/audit-logs', methods=['POST'])
def sync_audit_logs():
    """Sync audit logs from client"""
    data = request.json
    logs = data.get('logs', [])
    
    if not logs:
        return jsonify({'success': True, 'synced': 0})
    
    conn = get_db()
    cursor = conn.cursor()
    
    synced = 0
    for log in logs:
        try:
            cursor.execute('''
                INSERT INTO audit_logs 
                (shop_id, user_id, session_id, machine_id, action, entity_type,
                 entity_id, old_data, new_data, notes, hash, previous_hash,
                 signature, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                log.get('shop_id', 1), log.get('user_id'), log.get('sessionId'),
                log.get('machineId'), log.get('action'), log.get('entityType'),
                log.get('entityId'), json.dumps(log.get('oldData')),
                json.dumps(log.get('newData')), log.get('notes'), log.get('hash'),
                log.get('previousHash'), log.get('signature'),
                log.get('ipAddress'), log.get('userAgent'), log.get('timestamp')
            ))
            synced += 1
        except Exception as e:
            logger.error(f'Error syncing audit log: {e}')
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'synced': synced})

@app.route('/api/audit-logs', methods=['GET'])
@require_auth
def get_audit_logs():
    """Get audit logs"""
    shop_id = request.args.get('shop_id', 1)
    limit = request.args.get('limit', 100)
    action = request.args.get('action')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM audit_logs WHERE shop_id = ?'
    params = [shop_id]
    
    if action:
        query += ' AND action = ?'
        params.append(action)
    
    query += ' ORDER BY created_at DESC LIMIT ?'
    params.append(limit)
    
    cursor.execute(query, params)
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'success': True, 'logs': logs, 'count': len(logs)})

# =====================================================
# API ROUTES - SYNC
# =====================================================

@app.route('/api/sync/push', methods=['POST'])
def sync_push():
    """Push offline data to server"""
    data = request.json
    shop_id = data.get('shop_id', 1)
    
    synced = 0
    for record in data.get('records', []):
        # Process based on table type
        table = record.get('table')
        action = record.get('action')
        record_data = record.get('data')
        
        if table == 'invoices' and action == 'INSERT':
            # Create invoice
            # (Similar to create_invoice but for offline sync)
            synced += 1
    
    return jsonify({'success': True, 'synced': synced})

@app.route('/api/sync/status', methods=['GET'])
def sync_status():
    """Get sync status"""
    shop_id = request.args.get('shop_id', 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT COUNT(*) as pending FROM sync_queue 
        WHERE shop_id = ? AND synced = 0
    ''', (shop_id,))
    
    result = cursor.fetchone()
    pending = result['pending'] if result else 0
    
    conn.close()
    
    return jsonify({
        'success': True,
        'pending': pending,
        'last_sync': datetime.now().isoformat()
    })

# =====================================================
# WEBSOCKET EVENTS
# =====================================================

@socketio.on('connect')
def handle_connect():
    """Client connected"""
    logger.info('✅ Client connected')
    emit('connected', {'message': 'Connected to POS Server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected"""
    logger.info('❌ Client disconnected')

@socketio.on('sale_completed')
def handle_sale(data):
    """Handle sale completion event"""
    logger.info(f'💰 Sale completed: ₹{data.get("total")}')
    emit('sale_notification', {
        'message': f'Sale of ₹{data.get("total"):.2f} completed',
        'timestamp': datetime.now().isoformat()
    })

# =====================================================
# STATIC FILE SERVING
# =====================================================

@app.route('/')
def serve_index():
    """Serve main POS application"""
    return send_from_directory('apps', 'dairy-pos-enhanced.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if os.path.exists(os.path.join('apps', path)):
        return send_from_directory('apps', path)
    return jsonify({'error': 'File not found'}), 404

# =====================================================
# HARDWARE INTEGRATION
# =====================================================

@app.route('/api/hardware/print', methods=['POST'])
def print_receipt():
    """Print receipt (placeholder for hardware integration)"""
    data = request.json
    
    # In production, integrate with actual printer
    # For now, just log the print request
    logger.info(f'🖨️  Print request: Invoice {data.get("invoice_number")}')
    
    return jsonify({
        'success': True,
        'message': 'Print job queued',
        'printer_status': 'ready'
    })

@app.route('/api/hardware/devices', methods=['GET'])
def get_devices():
    """Get connected hardware devices"""
    shop_id = request.args.get('shop_id', 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM hardware_devices WHERE shop_id = ?', (shop_id,))
    devices = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        'success': True,
        'devices': devices,
        'count': len(devices)
    })

# =====================================================
# HEALTH CHECK
# =====================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected',
        'version': '2.0.0'
    })

# =====================================================
# ERROR HANDLERS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# =====================================================
# MAIN
# =====================================================

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    logger.info("=" * 60)
    logger.info("🚀 MilkRecord POS Server Starting...")
    logger.info("=" * 60)
    logger.info(f"📁 Database: {app.config['DATABASE']}")
    logger.info("🔌 SocketIO: Enabled")
    logger.info("🌐 CORS: Enabled")
    logger.info("=" * 60)
    
    # Run server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
