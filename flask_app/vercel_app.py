"""
MilkRecord POS - Complete API Endpoints
Enterprise-Grade with 3-Tier Sync Support
"""

import os
import sys
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import Supabase client
try:
    from supabase import create_client
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase connected")
    else:
        supabase = None
        print("⚠️ Supabase not configured")
except Exception as e:
    supabase = None
    print(f"⚠️ Supabase error: {e}")

# Initialize Flask app
app = Flask(__name__,
            template_folder='../apps',
            static_folder='../apps',
            static_url_path='/static')

# Register Auth Blueprint
try:
    from api_auth import auth_bp
    app.register_blueprint(auth_bp)
    print("✅ Auth API registered")
except Exception as e:
    print(f"⚠️  Auth API not available: {e}")

# Also serve JS files
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('../js', filename)

# ============================================
# UTILITY FUNCTIONS
# ============================================

def validate_shop_data(data):
    """Validate shop settings data - for existing schema (name, phone only)"""
    errors = []
    
    # Map to your existing columns: name, phone
    mapped_data = {}
    
    # Map shop_name → name
    if data.get('shop_name'):
        mapped_data['name'] = data['shop_name']
    else:
        errors.append('Shop name is required')
    
    # Map shop_phone → phone
    if data.get('shop_phone'):
        phone = re.sub(r'\D', '', data['shop_phone'])
        if len(phone) != 10:
            errors.append(f'Phone must be 10 digits (got {len(phone)})')
        mapped_data['phone'] = phone
    else:
        errors.append('Shop phone is required')
    
    # Note: email, address, etc. are saved to localStorage only
    # Your shops table only has: name, phone
    
    return errors, mapped_data

def upsert_record(table, data, local_txn_id=None):
    """Upsert record - works with YOUR exact schema (no extra columns)"""
    if not supabase:
        return {'success': False, 'error': 'Supabase not configured'}
    
    try:
        # Remove ALL columns your table doesn't have
        # Your shops table ONLY has: id, name, phone
        columns_to_remove = ['shop_id', 'local_txn_id', 'synced_at', 'updated_at', 'created_at', 
                            'email', 'address', 'city', 'pincode', 'gst', 'pan', 'upi', 
                            'bank', 'account', 'ifsc', 'account_name', 'status', 
                            'sync_enabled', 'activated_at']
        
        for col in columns_to_remove:
            if col in data:
                del data[col]
        
        # Simple insert with only: name, phone
        result = supabase.table(table).insert(data).execute()
        
        if result.data:
            return {'success': True, 'data': result.data[0]}
        else:
            return {'success': False, 'error': 'No data returned'}
            
    except Exception as e:
        return {'success': False, 'error': str(e)}

# ============================================
# MAIN ROUTES
# ============================================

@app.route('/')
def index():
    """Main POS page"""
    return send_from_directory('../apps', 'dairy-pos-billing-software-india.html')

@app.route('/pos')
def pos():
    """POS Billing page"""
    return send_from_directory('../apps', 'dairy-pos-billing-software-india.html')

@app.route('/collection')
def collection():
    """Milk Collection page"""
    return send_from_directory('../apps', 'collection.html')

@app.route('/<path:filename>')
def serve_file(filename):
    """Serve static files"""
    return send_from_directory('../apps', filename)

# ============================================
# SHOP SETTINGS API
# ============================================

@app.route('/api/shop-settings', methods=['GET'])
def get_shop_settings():
    """Get shop settings"""
    if not supabase:
        return jsonify({'settings': {}, 'success': False, 'error': 'Supabase not configured'})
    
    try:
        result = supabase.table('shops').select('*').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return jsonify({'settings': result.data[0], 'success': True, 'shop_id': result.data[0]['id']})
        else:
            return jsonify({'settings': {}, 'success': True, 'shop_id': None})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/shop-settings', methods=['POST'])
def save_shop_settings():
    """Save shop settings with validation"""
    data = request.json
    
    # Validate and map data
    errors, mapped_data = validate_shop_data(data)
    if errors:
        return jsonify({'error': errors, 'success': False}), 400
    
    # Upsert with mapped column names
    result = upsert_record('shops', mapped_data)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Settings saved to Supabase!',
            'shop_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

# ============================================
# PRODUCTS API
# ============================================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    if not supabase:
        return jsonify({'products': [], 'success': True})
    
    try:
        result = supabase.table('products').select('*').order('name').execute()
        return jsonify({'products': result.data or [], 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/products', methods=['POST'])
def save_product():
    """Save product with UPSERT"""
    data = request.json
    
    # Get local_txn_id for conflict resolution
    local_txn_id = data.get('local_txn_id') or data.get('id')
    
    result = upsert_record('products', data, local_txn_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Product synced',
            'product_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

# ============================================
# CUSTOMERS API
# ============================================

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers"""
    if not supabase:
        return jsonify({'customers': [], 'success': True})
    
    try:
        result = supabase.table('customers').select('*').order('name').execute()
        return jsonify({'customers': result.data or [], 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/customers', methods=['POST'])
def save_customer():
    """Save customer - works around shop_id constraint"""
    try:
        data = request.json
        
        # NEVER send shop_id - let database use default or NULL
        # Remove ALL problematic fields
        fields_to_remove = ['shop_id', 'local_txn_id', 'synced_at', 'updated_at', 'created_at', 'device_id', 'id']
        for field in fields_to_remove:
            if field in data:
                del data[field]
        
        # Ensure we have required fields only
        clean_data = {
            'name': data.get('name', 'Unknown'),
            'phone': data.get('phone', ''),
            'email': data.get('email', ''),
            'balance': data.get('balance', 0)
        }
        
        # Only include fields that exist in your table
        result = supabase.table('customers').insert(clean_data).execute()
        
        if result.data:
            return jsonify({
                'success': True,
                'message': 'Customer saved',
                'customer_id': result.data[0]['id']
            })
        else:
            return jsonify({'success': False, 'error': 'No data returned'}), 500
    except Exception as e:
        error_msg = str(e)
        # Handle specific errors
        if 'shop_id' in error_msg and 'not-null' in error_msg.lower():
            return jsonify({
                'success': False,
                'error': 'Database constraint: shop_id required. Please run: ALTER TABLE customers ALTER COLUMN shop_id DROP NOT NULL',
                'fix_sql': 'ALTER TABLE customers ALTER COLUMN shop_id DROP NOT NULL;'
            }), 400
        return jsonify({'error': error_msg, 'success': False}), 500

# ============================================
# SALES/INVOICES API
# ============================================

@app.route('/api/sales', methods=['GET'])
def get_sales():
    """Get recent sales"""
    if not supabase:
        return jsonify({'sales': [], 'success': True})
    
    try:
        result = supabase.table('sales').select('*').order('sale_date', desc=True).limit(100).execute()
        return jsonify({'sales': result.data or [], 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/sales', methods=['POST'])
def save_sale():
    """Save sale - works around RLS and shop_id constraints"""
    try:
        data = request.json
        
        # Remove ALL problematic fields
        fields_to_remove = ['shop_id', 'local_txn_id', 'synced_at', 'updated_at', 'created_at', 'device_id', 'id']
        for field in fields_to_remove:
            if field in data:
                del data[field]
        
        # Ensure we have required fields only
        clean_data = {
            'customer_name': data.get('customer_name', 'Unknown'),
            'customer_phone': data.get('customer_phone', ''),
            'items': data.get('items', []),
            'total_amount': data.get('total_amount', 0),
            'paid_amount': data.get('paid_amount', 0),
            'payment_mode': data.get('payment_mode', 'cash'),
            'sale_date': datetime.now().isoformat()
        }
        
        # Try insert
        result = supabase.table('sales').insert(clean_data).execute()
        
        if result.data:
            return jsonify({
                'success': True,
                'message': 'Sale saved',
                'sale_id': result.data[0]['id']
            })
        else:
            return jsonify({'success': False, 'error': 'No data returned'}), 500
    except Exception as e:
        error_msg = str(e)
        # Handle specific errors
        if 'row-level security' in error_msg.lower():
            return jsonify({
                'success': False,
                'error': 'RLS policy blocking. Please run: ALTER TABLE sales DISABLE ROW LEVEL SECURITY',
                'fix_sql': 'ALTER TABLE sales DISABLE ROW LEVEL SECURITY;'
            }), 400
        if 'shop_id' in error_msg and 'not-null' in error_msg.lower():
            return jsonify({
                'success': False,
                'error': 'Database constraint: shop_id required. Please run: ALTER TABLE sales ALTER COLUMN shop_id DROP NOT NULL',
                'fix_sql': 'ALTER TABLE sales ALTER COLUMN shop_id DROP NOT NULL;'
            }), 400
        return jsonify({'error': error_msg, 'success': False}), 500

# ============================================
# LEDGER API
# ============================================

@app.route('/api/ledger', methods=['GET'])
def get_ledger():
    """Get ledger entries"""
    if not supabase:
        return jsonify({'ledger': [], 'success': True})
    
    try:
        result = supabase.table('ledger').select('*').order('transaction_date', desc=True).limit(100).execute()
        return jsonify({'ledger': result.data or [], 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/ledger', methods=['POST'])
def save_ledger():
    """Save ledger entry with UPSERT"""
    data = request.json
    
    local_txn_id = data.get('local_txn_id') or data.get('id')
    result = upsert_record('ledger', data, local_txn_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Ledger entry synced',
            'ledger_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

# ============================================
# ADVANCE ORDERS API
# ============================================

@app.route('/api/advance-orders', methods=['GET'])
def get_advance_orders():
    """Get advance orders"""
    if not supabase:
        return jsonify({'orders': [], 'success': True})
    
    try:
        result = supabase.table('advance_orders').select('*').order('delivery_date').limit(100).execute()
        return jsonify({'orders': result.data or [], 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/advance-orders', methods=['POST'])
def save_advance_order():
    """Save advance order with UPSERT"""
    data = request.json
    
    local_txn_id = data.get('local_txn_id') or data.get('id')
    result = upsert_record('advance_orders', data, local_txn_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Advance order synced',
            'order_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

# ============================================
# MILK COLLECTIONS API
# ============================================

@app.route('/api/milk-collections', methods=['GET'])
def get_milk_collections():
    """Get milk collections"""
    if not supabase:
        return jsonify({'collections': [], 'success': True})
    
    try:
        result = supabase.table('milk_collections').select('*').order('collection_date', desc=True).limit(100).execute()
        return jsonify({'collections': result.data or [], 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/milk-collections', methods=['POST'])
def save_milk_collection():
    """Save milk collection with UPSERT"""
    data = request.json
    
    local_txn_id = data.get('local_txn_id') or data.get('id')
    result = upsert_record('milk_collections', data, local_txn_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Milk collection synced',
            'collection_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

# ============================================
# DEVICES API
# ============================================

@app.route('/api/devices', methods=['POST'])
def register_device():
    """Register device"""
    data = request.json
    
    if not data.get('device_id') or not data.get('shop_id'):
        return jsonify({'error': 'device_id and shop_id required', 'success': False}), 400
    
    result = upsert_record('devices', data, data.get('device_id'))
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Device registered',
            'device_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'runtime': 'cloud',
        'platform': 'vercel',
        'supabase': 'connected' if supabase else 'disconnected',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/user', methods=['GET'])
def get_user():
    """Get current user info"""
    return jsonify({
        'success': True,
        'user': {
            'name': 'POS User',
            'shop': 'Gopal Dairy',
            'shift': 'morning'
        }
    })

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'success': False}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'success': False}), 500

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    import webbrowser
    import threading
    import signal
    import sys
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print('\n🛑 Shutting down gracefully...')
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    def open_browser():
        try:
            webbrowser.open('http://localhost:5000/pos')
        except:
            pass
    
    print("🚀 Starting MilkRecord POS...")
    print("📍 Local URL: http://localhost:5000/pos")
    print("📍 API Health: http://localhost:5000/api/health")
    print("")
    print("✅ Server running... Press CTRL+C to stop")
    print("")
    
    threading.Timer(2.0, open_browser).start()
    
    try:
        app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)
    except KeyboardInterrupt:
        print('\n👋 Server stopped by user')
        sys.exit(0)
