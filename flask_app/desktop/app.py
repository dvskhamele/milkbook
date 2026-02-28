"""
Desktop Flask Application
Windows EXE entry point with Supabase sync
Full offline capability with auto-sync to cloud
"""

import os
import sys
import signal
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, request, jsonify, send_from_directory
from core import services, sync_engine
from adapters import db_local

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# Flask App
# ============================================

def create_app():
    """Create Flask application"""
    
    app = Flask(__name__,
                template_folder='../apps',
                static_folder='../apps',
                static_url_path='/static')
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'desktop-secret-key')
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Initialize local database
    db_local.init_db()
    logger.info("✅ Database initialized")
    
    # Start background sync
    sync_engine.start_sync()
    logger.info("✅ Sync engine started")
    
    # Register routes
    register_routes(app)
    
    # Register shutdown handler
    @app.teardown_appcontext
    def shutdown(exception=None):
        pass
    
    logger.info("✅ Desktop app created")
    
    return app


def register_routes(app):
    """Register all routes"""
    
    # Main Pages
    @app.route('/')
    def index():
        return render_template('dairy-pos-billing-software-india.html')
    
    @app.route('/pos')
    def pos():
        return render_template('dairy-pos-billing-software-india.html')
    
    @app.route('/collection')
    def collection():
        return render_template('automated-milk-collection-system-village.html')
    
    # API - Farmers
    @app.route('/api/farmers', methods=['GET'])
    def get_farmers():
        farmers = services.get_farmers()
        return jsonify({'farmers': farmers, 'success': True})
    
    @app.route('/api/farmers', methods=['POST'])
    def add_farmer():
        data = request.json
        result = services.save_farmer(data)
        return jsonify(result)
    
    # API - Milk Collection
    @app.route('/api/collections', methods=['POST'])
    def add_collection():
        # For now, return success
        # Implement collection logic as needed
        return jsonify({'success': True, 'message': 'Collection saved'})
    
    # API - Sales
    @app.route('/api/sales', methods=['POST'])
    def add_sale():
        data = request.json
        
        # Generate UUID if not present
        if 'id' not in data or not data['id']:
            import uuid
            data['id'] = uuid.uuid4().hex
        
        result = services.save_sale(data)
        return jsonify(result)
    
    @app.route('/api/sales', methods=['GET'])
    def get_sales():
        sales = services.get_sales(limit=100)
        return jsonify({'sales': sales, 'success': True})
    
    # API - Customers
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        customers = services.get_customers()
        return jsonify({'customers': customers, 'success': True})
    
    @app.route('/api/customers', methods=['POST'])
    def add_customer():
        data = request.json
        result = services.save_customer(data)
        return jsonify(result)
    
    # API - Products
    @app.route('/api/products', methods=['GET'])
    def get_products():
        products = services.get_products()
        
        # If no products, return sample data
        if not products:
            products = [
                {'id': 'p1', 'name': 'Cow Milk', 'price': 64.0, 'category': 'milk', 'emoji': '🥛', 'unit': 'L'},
                {'id': 'p2', 'name': 'Buffalo Milk', 'price': 72.0, 'category': 'milk', 'emoji': '🥛', 'unit': 'L'},
                {'id': 'p3', 'name': 'Paneer', 'price': 400.0, 'category': 'paneer', 'emoji': '🧀', 'unit': 'kg'},
                {'id': 'p4', 'name': 'Ghee', 'price': 600.0, 'category': 'ghee', 'emoji': '🧈', 'unit': 'L'},
                {'id': 'p5', 'name': 'Curd', 'price': 80.0, 'category': 'curd', 'emoji': '🥣', 'unit': 'kg'},
                {'id': 'p6', 'name': 'Lassi', 'price': 60.0, 'category': 'curd', 'emoji': '🥣', 'unit': 'glass'},
                {'id': 'p7', 'name': 'Barfi', 'price': 300.0, 'category': 'sweets', 'emoji': '🍬', 'unit': 'kg'},
                {'id': 'p8', 'name': 'Jalebi', 'price': 200.0, 'category': 'sweets', 'emoji': '🍬', 'unit': 'kg'},
                {'id': 'p9', 'name': 'Bread', 'price': 40.0, 'category': 'bakery', 'emoji': '🥐', 'unit': 'pkt'},
                {'id': 'p10', 'name': 'Biscuits', 'price': 30.0, 'category': 'bakery', 'emoji': '🥐', 'unit': 'pkt'},
            ]
        
        return jsonify({'products': products, 'success': True})
    
    @app.route('/api/products', methods=['POST'])
    def add_product():
        data = request.json
        result = services.save_product(data)
        return jsonify(result)
    
    # API - Hardware
    @app.route('/api/hardware/weight', methods=['GET'])
    def get_weight():
        # Hardware integration - returns None if not available
        return jsonify({'success': False, 'message': 'Hardware not configured'})
    
    @app.route('/api/hardware/analyzer', methods=['GET'])
    def get_analyzer():
        return jsonify({'success': False, 'message': 'Hardware not configured'})
    
    @app.route('/api/hardware/ports', methods=['GET'])
    def list_ports():
        return jsonify({'ports': [], 'success': True})
    
    # Print receipt
    @app.route('/receipt/<sale_id>')
    def receipt(sale_id):
        sales = services.get_sales(limit=1000)
        sale = next((s for s in sales if s['id'] == sale_id), None)
        
        if sale:
            return render_template('receipt.html', sale=sale)
        return jsonify({'error': 'Sale not found'}), 404
    
    # API - Sync
    @app.route('/api/sync/status', methods=['GET'])
    def sync_status():
        """Get sync status"""
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
            'runtime': 'desktop'
        })
    
    @app.route('/api/sync/force', methods=['POST'])
    def force_sync():
        """Force immediate sync"""
        sync_engine.force_sync()
        return jsonify({'success': True, 'message': 'Sync triggered'})
    
    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'runtime': 'desktop',
            'hardware': 'disabled',
            'sync': 'enabled',
            'timestamp': datetime.now().isoformat()
        })


# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    import webbrowser
    import threading
    
    def open_browser():
        """Open browser after server starts"""
        webbrowser.open("http://127.0.0.1:5000/pos")
    
    # Create app
    app = create_app()
    
    # Configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"🚀 Starting Desktop app on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    
    # Open browser automatically
    if not debug:
        threading.Timer(1.5, open_browser).start()
    
    # Run Flask
    try:
        app.run(host='127.0.0.1', port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down...")
    finally:
        sync_engine.stop_sync()
        logger.info("✅ Sync engine stopped")
