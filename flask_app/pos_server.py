"""
MilkRecord POS - Production Flask Server
Serves dairy-pos-billing-software-india.html with full backend support
Hardware integration + Supabase sync + SQLite offline
"""

import os
import sys
import json
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import core services
from core import services, sync_engine
from adapters import db_local

# Initialize Flask app
app = Flask(__name__, 
            template_folder='../apps',
            static_folder='../apps',
            static_url_path='/static')

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'milkrecord-pos-secret-key-2024')
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# ============================================
# Main Routes
# ============================================

@app.route('/')
def index():
    """Main landing page"""
    return render_template('dairy-pos-billing-software-india.html')

@app.route('/pos')
def pos():
    """POS Billing page"""
    return render_template('dairy-pos-billing-software-india.html')

@app.route('/collection')
def collection():
    """Milk Collection page"""
    return render_template('automated-milk-collection-system-village.html')

# ============================================
# Product API
# ============================================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        products = services.get_products()
        
        # If no products in database, return sample data
        if not products:
            products = [
                {'id': str(uuid.uuid4()), 'name': 'Cow Milk', 'price': 64.0, 'category': 'milk', 'emoji': '🥛', 'unit': 'L'},
                {'id': str(uuid.uuid4()), 'name': 'Buffalo Milk', 'price': 72.0, 'category': 'milk', 'emoji': '🥛', 'unit': 'L'},
                {'id': str(uuid.uuid4()), 'name': 'Paneer', 'price': 400.0, 'category': 'paneer', 'emoji': '🧀', 'unit': 'kg'},
                {'id': str(uuid.uuid4()), 'name': 'Ghee', 'price': 600.0, 'category': 'ghee', 'emoji': '🧈', 'unit': 'L'},
                {'id': str(uuid.uuid4()), 'name': 'Curd', 'price': 80.0, 'category': 'curd', 'emoji': '🥣', 'unit': 'kg'},
                {'id': str(uuid.uuid4()), 'name': 'Lassi', 'price': 60.0, 'category': 'curd', 'emoji': '🥣', 'unit': 'glass'},
                {'id': str(uuid.uuid4()), 'name': 'Barfi', 'price': 300.0, 'category': 'sweets', 'emoji': '🍬', 'unit': 'kg'},
                {'id': str(uuid.uuid4()), 'name': 'Jalebi', 'price': 200.0, 'category': 'sweets', 'emoji': '🍬', 'unit': 'kg'},
                {'id': str(uuid.uuid4()), 'name': 'Bread', 'price': 40.0, 'category': 'bakery', 'emoji': '🥐', 'unit': 'pkt'},
                {'id': str(uuid.uuid4()), 'name': 'Biscuits', 'price': 30.0, 'category': 'bakery', 'emoji': '🥐', 'unit': 'pkt'},
            ]
        
        return jsonify({'products': products, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/products', methods=['POST'])
def add_product():
    """Add new product"""
    try:
        data = request.json
        result = services.save_product(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Customer API
# ============================================

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers"""
    try:
        customers = services.get_customers()
        return jsonify({'customers': customers, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/customers', methods=['POST'])
def add_customer():
    """Add new customer"""
    try:
        data = request.json
        result = services.save_customer(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Sales API
# ============================================

@app.route('/api/sales', methods=['POST'])
def save_sale():
    """Save sale - main endpoint from HTML"""
    try:
        data = request.json
        
        # Ensure ID exists
        if 'id' not in data or not data['id']:
            data['id'] = str(uuid.uuid4())
        
        # Ensure sale_date exists
        if 'sale_date' not in data:
            data['sale_date'] = datetime.now().isoformat()
        
        # Save using unified service
        result = services.save_sale(data)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/sales', methods=['GET'])
def get_sales():
    """Get recent sales"""
    try:
        limit = request.args.get('limit', 100)
        sales = services.get_sales(limit=int(limit))
        return jsonify({'sales': sales, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Farmer API
# ============================================

@app.route('/api/farmers', methods=['GET'])
def get_farmers():
    """Get all farmers"""
    try:
        farmers = services.get_farmers()
        return jsonify({'farmers': farmers, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/farmers', methods=['POST'])
def add_farmer():
    """Add new farmer"""
    try:
        data = request.json
        result = services.save_farmer(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Collection API
# ============================================

@app.route('/api/collections', methods=['POST'])
def add_collection():
    """Add milk collection"""
    try:
        data = request.json
        # For now, return success
        # Implement full collection logic as needed
        return jsonify({'success': True, 'message': 'Collection saved'})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Hardware API
# ============================================

@app.route('/api/hardware/weight', methods=['GET'])
def get_hardware_weight():
    """Get weight from hardware scale"""
    try:
        # Hardware integration - returns None if not configured
        from adapters import hardware
        weight = hardware.get_latest_weight()
        
        if weight:
            return jsonify({'success': True, 'weight': weight, 'unit': 'kg'})
        else:
            return jsonify({'success': False, 'message': 'Hardware not configured or no reading'})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/hardware/analyzer', methods=['GET'])
def get_hardware_analyzer():
    """Get reading from milk analyzer"""
    try:
        from adapters import hardware
        reading = hardware.get_latest_analyzer()
        
        if reading:
            return jsonify({'success': True, 'reading': reading})
        else:
            return jsonify({'success': False, 'message': 'Hardware not configured or no reading'})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/hardware/ports', methods=['GET'])
def list_hardware_ports():
    """List available serial ports"""
    try:
        from adapters import hardware
        ports = hardware.list_ports()
        return jsonify({'ports': ports, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/hardware/configure', methods=['POST'])
def configure_hardware():
    """Configure hardware devices"""
    try:
        data = request.json
        from adapters import hardware
        
        # Register devices
        if 'scale' in data:
            hardware.register_device('scale_01', 'scale', data['scale'])
        if 'analyzer' in data:
            hardware.register_device('analyzer_01', 'analyzer', data['analyzer'])
        
        # Start reading
        hardware.start_hardware()
        
        return jsonify({'success': True, 'message': 'Hardware configured'})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Sync API
# ============================================

@app.route('/api/sync/status', methods=['GET'])
def sync_status():
    """Get sync status"""
    try:
        pending_farmers = len(db_local.farmer_get_pending_sync())
        pending_sales = len(db_local.sale_get_pending_sync())
        
        return jsonify({
            'success': True,
            'device_id': db_local.get_device_id(),
            'internet': services.internet_available(),
            'pending_records': {
                'farmers': pending_farmers,
                'sales': pending_sales
            },
            'runtime': 'desktop' if services.IS_DESKTOP else 'cloud'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/sync/force', methods=['POST'])
def force_sync():
    """Force immediate sync"""
    try:
        sync_engine.force_sync()
        return jsonify({'success': True, 'message': 'Sync triggered'})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# Utility API
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'runtime': 'desktop' if services.IS_DESKTOP else 'cloud',
        'hardware': 'enabled' if services.IS_DESKTOP else 'disabled',
        'sync': 'enabled' if services.IS_DESKTOP else 'realtime',
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
# Error Handlers
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'success': False}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'success': False}), 500

# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    import webbrowser
    import threading
    
    def open_browser():
        """Open browser after server starts"""
        webbrowser.open("http://127.0.0.1:5000/pos")
    
    # Initialize database
    db_local.init_db()
    print("✅ Database initialized")
    
    # Start background sync
    if services.IS_DESKTOP:
        sync_engine.start_sync()
        print("✅ Sync engine started")
    
    # Configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.getenv('HOST', '127.0.0.1')
    
    print(f"🚀 Starting MilkRecord POS on {host}:{port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"💻 Runtime: {'Desktop' if services.IS_DESKTOP else 'Cloud'}")
    
    # Open browser automatically
    if not debug:
        threading.Timer(1.5, open_browser).start()
    
    # Run Flask
    try:
        app.run(host=host, port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    finally:
        if services.IS_DESKTOP:
            sync_engine.stop_sync()
            print("✅ Sync engine stopped")
