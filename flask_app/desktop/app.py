"""
Desktop Flask Application
Windows EXE entry point
Full offline capability with hardware support
"""

import os
import sys
import signal
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, request, jsonify, send_from_directory
from core.services import RateCalculator, ValidationService, IDGenerator
from adapters import db_local, hardware

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
    
    # Initialize database
    db_local.init_db()
    logger.info("Database initialized")
    
    # Register routes
    register_routes(app)
    
    # Register hardware callbacks
    register_hardware_callbacks(app)
    
    logger.info("Desktop app created")
    
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
        farmers = db_local.farmer_get_all()
        return jsonify({'farmers': farmers, 'success': True})
    
    @app.route('/api/farmers', methods=['POST'])
    def add_farmer():
        data = request.json
        farmer = {
            'id': IDGenerator.generate_farmer_id(),
            'name': data['name'],
            'phone': data.get('phone'),
            'animal_type': data.get('animal_type', 'cow'),
            'balance': 0.0,
            'created_at': datetime.now().isoformat()
        }
        success = db_local.farmer_save(farmer)
        return jsonify({'success': success, 'farmer': farmer})
    
    # API - Milk Collection
    @app.route('/api/collections', methods=['POST'])
    def add_collection():
        data = request.json
        
        # Get weight from hardware if available
        quantity = data.get('quantity')
        hardware_weight = hardware.get_latest_weight()
        if hardware_weight:
            quantity = hardware_weight
        
        # Calculate rate
        rate = RateCalculator.calculate_rate(
            data.get('fat', 0.0),
            data.get('snf', 0.0),
            data.get('base_rate', 30.0)
        )
        
        collection = {
            'id': IDGenerator.generate_collection_id(),
            'farmer_id': data['farmer_id'],
            'quantity': quantity,
            'fat': data.get('fat'),
            'snf': data.get('snf'),
            'rate': rate,
            'amount': RateCalculator.calculate_amount(quantity, rate),
            'shift': data.get('shift', 'morning'),
            'collection_date': data.get('collection_date', datetime.now().strftime('%Y-%m-%d')),
            'created_at': datetime.now().isoformat()
        }
        
        success = db_local.collection_save(collection)
        return jsonify({'success': success, 'collection': collection})
    
    # API - Sales
    @app.route('/api/sales', methods=['POST'])
    def add_sale():
        data = request.json
        
        sale = {
            'id': IDGenerator.generate_sale_id(),
            'customer_id': data.get('customer_id'),
            'customer_name': data.get('customer_name', 'Walking Customer'),
            'items': data.get('items', '[]'),
            'total_amount': data.get('total_amount', 0.0),
            'paid_amount': data.get('paid_amount', 0.0),
            'payment_mode': data.get('payment_mode', 'cash'),
            'sale_date': datetime.now().isoformat()
        }
        
        success = db_local.sale_save(sale)
        return jsonify({'success': success, 'sale_id': sale['id']})
    
    @app.route('/api/sales', methods=['GET'])
    def get_sales():
        sales = db_local.sale_get_all(limit=100)
        return jsonify({'sales': sales, 'success': True})
    
    # API - Products
    @app.route('/api/products', methods=['GET'])
    def get_products():
        # For now, return sample products
        # In production, this would query a products table
        sample_products = [
            {'id': 'p1', 'name': 'Cow Milk', 'price': 64.0, 'category': 'milk', 'emoji': '🥛'},
            {'id': 'p2', 'name': 'Buffalo Milk', 'price': 72.0, 'category': 'milk', 'emoji': '🥛'},
            {'id': 'p3', 'name': 'Paneer', 'price': 400.0, 'category': 'paneer', 'emoji': '🧀'},
            {'id': 'p4', 'name': 'Ghee', 'price': 600.0, 'category': 'ghee', 'emoji': '🧈'},
            {'id': 'p5', 'name': 'Curd', 'price': 80.0, 'category': 'curd', 'emoji': '🥣'},
            {'id': 'p6', 'name': 'Lassi', 'price': 60.0, 'category': 'curd', 'emoji': '🥣'},
            {'id': 'p7', 'name': 'Barfi', 'price': 300.0, 'category': 'sweets', 'emoji': '🍬'},
            {'id': 'p8', 'name': 'Jalebi', 'price': 200.0, 'category': 'sweets', 'emoji': '🍬'},
            {'id': 'p9', 'name': 'Bread', 'price': 40.0, 'category': 'bakery', 'emoji': '🥐'},
            {'id': 'p10', 'name': 'Biscuits', 'price': 30.0, 'category': 'bakery', 'emoji': '🥐'},
        ]
        return jsonify({'products': sample_products, 'success': True})
    
    # API - Customers
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        customers = db_local.customer_get_all()
        return jsonify({'customers': customers, 'success': True})
    
    @app.route('/api/customers', methods=['POST'])
    def add_customer():
        data = request.json
        customer = {
            'id': IDGenerator.generate_customer_id(),
            'name': data['name'],
            'phone': data.get('phone'),
            'email': data.get('email'),
            'address': data.get('address'),
            'balance': 0.0,
            'created_at': datetime.now().isoformat()
        }
        success = db_local.customer_save(customer)
        return jsonify({'success': success, 'customer': customer})
    
    # API - Hardware
    @app.route('/api/hardware/weight', methods=['GET'])
    def get_weight():
        weight = hardware.get_latest_weight()
        if weight:
            return jsonify({'success': True, 'weight': weight})
        return jsonify({'success': False, 'message': 'No reading available'})
    
    @app.route('/api/hardware/analyzer', methods=['GET'])
    def get_analyzer():
        reading = hardware.get_latest_analyzer()
        if reading:
            return jsonify({'success': True, 'reading': reading})
        return jsonify({'success': False, 'message': 'No reading available'})
    
    @app.route('/api/hardware/ports', methods=['GET'])
    def list_ports():
        ports = hardware.list_ports()
        return jsonify({'ports': ports, 'success': True})
    
    # Print receipt
    @app.route('/receipt/<sale_id>')
    def receipt(sale_id):
        sale = db_local.sale_get_by_id(sale_id)
        if sale:
            return render_template('receipt.html', sale=sale)
        return jsonify({'error': 'Sale not found'}), 404
    
    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'runtime': 'desktop',
            'hardware': 'enabled' if hardware.IS_DESKTOP else 'disabled',
            'timestamp': datetime.now().isoformat()
        })


def register_hardware_callbacks(app):
    """Register hardware callbacks"""
    
    def on_weight_reading(reading):
        """Callback for weight readings"""
        logger.debug(f"Weight: {reading.get('weight')} kg")
    
    def on_analyzer_reading(reading):
        """Callback for analyzer readings"""
        logger.debug(f"Analyzer: FAT={reading.get('fat')}, SNF={reading.get('snf')}")
    
    hardware.register_callback('scale_01', on_weight_reading)
    hardware.register_callback('analyzer_01', on_analyzer_reading)


# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    import webbrowser
    import threading
    
    def open_browser():
        """Open browser after server starts"""
        webbrowser.open("http://127.0.0.1:5000")
    
    # Start hardware
    hardware.start_hardware()
    
    # Create app
    app = create_app()
    
    # Configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Desktop app on port {port}")
    
    # Open browser automatically
    if not debug:
        threading.Timer(1.5, open_browser).start()
    
    # Run Flask
    try:
        app.run(host='127.0.0.1', port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        hardware.stop_hardware()
        logger.info("Hardware stopped")
