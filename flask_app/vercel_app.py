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

# ============================================
# UTILITY FUNCTIONS
# ============================================

def validate_shop_data(data):
    """Validate shop settings data"""
    errors = []
    
    if not data.get('shop_name'):
        errors.append('Shop name is required')
    
    if data.get('shop_phone'):
        phone = re.sub(r'\D', '', data['shop_phone'])
        if len(phone) != 10:
            errors.append(f'Phone must be 10 digits (got {len(phone)})')
        data['shop_phone'] = phone
    
    if data.get('shop_email') and not re.match(r'^[^@]+@[^@]+\.[^@]+$', data['shop_email']):
        errors.append('Invalid email format')
    
    if data.get('shop_pincode') and len(re.sub(r'\D', '', data['shop_pincode'])) != 6:
        errors.append('Pincode must be 6 digits')
    
    if data.get('shop_gst') and len(data['shop_gst']) != 15:
        errors.append(f'GST must be 15 characters (got {len(data["shop_gst"])})')
    
    if data.get('shop_pan') and len(data['shop_pan']) != 10:
        errors.append(f'PAN must be 10 characters (got {len(data["shop_pan"])})')
    
    if data.get('shop_ifsc') and len(data['shop_ifsc']) != 11:
        errors.append(f'IFSC must be 11 characters (got {len(data["shop_ifsc"])})')
    
    if data.get('shop_upi') and '@' not in data['shop_upi']:
        errors.append('UPI must contain @ symbol')
    
    return errors

def upsert_record(table, data, local_txn_id=None):
    """Upsert record with conflict resolution"""
    if not supabase:
        return {'success': False, 'error': 'Supabase not configured'}
    
    try:
        # Add synced_at timestamp
        data['synced_at'] = datetime.now().isoformat()
        
        if local_txn_id:
            # UPSERT with conflict resolution
            result = supabase.table(table).upsert(data, on_conflict='local_txn_id').execute()
        else:
            # Regular insert
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
    
    # Validate
    errors = validate_shop_data(data)
    if errors:
        return jsonify({'error': errors, 'success': False}), 400
    
    # Upsert
    result = upsert_record('shops', data)
    
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
    """Save customer with UPSERT"""
    data = request.json
    
    local_txn_id = data.get('local_txn_id') or data.get('id')
    result = upsert_record('customers', data, local_txn_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Customer synced',
            'customer_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

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
    """Save sale/invoice with UPSERT"""
    data = request.json
    
    local_txn_id = data.get('local_txn_id') or data.get('id')
    result = upsert_record('sales', data, local_txn_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Invoice synced',
            'sale_id': result['data'].get('id')
        })
    else:
        return jsonify(result), 500

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
    
    def open_browser():
        webbrowser.open('http://localhost:5000/pos')
    
    print("🚀 Starting MilkRecord POS...")
    print("📍 Local URL: http://localhost:5000/pos")
    print("📍 API Health: http://localhost:5000/api/health")
    print("")
    
    threading.Timer(2.0, open_browser).start()
    
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)
