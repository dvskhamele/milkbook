"""
Vercel Serverless Entry Point
Cloud deployment - Supabase only, NO SQLite
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify, send_from_directory, send_file
from core import services

# Force cloud mode
os.environ['RUNTIME'] = 'cloud'
os.environ['VERCEL'] = '1'

# ============================================
# Flask App
# ============================================

def create_app():
    """Create Flask application for Vercel"""

    app = Flask(__name__,
                template_folder='../apps',
                static_folder='..',
                static_url_path='')

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'vercel-secret-key')
    app.config['DEBUG'] = False  # Never debug in production

    # Register routes
    register_routes(app)

    return app


def register_routes(app):
    """Register all routes"""

    # Main Pages - serve from apps folder
    @app.route('/')
    def index():
        return send_from_directory('../apps', 'dairy-pos-billing-software-india.html')

    @app.route('/pos')
    def pos():
        return send_from_directory('../apps', 'dairy-pos-billing-software-india.html')

    @app.route('/collection')
    def collection():
        return send_from_directory('../apps', 'collection.html')

    @app.route('/farmers')
    def farmers():
        return send_from_directory('../apps', 'farmer-management-milk-collection-centers.html')

    @app.route('/customers')
    def customers():
        return send_from_directory('../apps', 'customer-ledger-udhar-tracking-dairy.html')

    @app.route('/inventory')
    def inventory():
        return send_from_directory('../apps', 'inventory.html')

    @app.route('/reports')
    def reports():
        return send_from_directory('../apps', 'reports-dashboard.html')

    @app.route('/settings')
    def settings():
        return send_from_directory('../apps', 'settings.html')

    # Serve JS files from js folder
    @app.route('/js/<path:filename>')
    def serve_js(filename):
        return send_from_directory('../js', filename)

    # Serve CSS files from root
    @app.route('/<path:filename>')
    def serve_static(filename):
        # Check if it's an HTML file in apps
        apps_path = os.path.join('../apps', filename)
        if os.path.isfile(apps_path):
            return send_from_directory('../apps', filename)
        
        # Check if it's a JS file
        js_path = os.path.join('../js', filename)
        if os.path.isfile(js_path):
            return send_from_directory('../js', filename)
        
        # Default: try to serve from root
        return send_from_directory('..', filename)
    
    # API - Farmers
    @app.route('/api/farmers', methods=['GET'])
    def get_farmers():
        try:
            farmers = services.get_farmers()
            return jsonify({'farmers': farmers, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/farmers', methods=['POST'])
    def add_farmer():
        try:
            data = request.json
            result = services.save_farmer(data)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API - Sales
    @app.route('/api/sales', methods=['POST'])
    def add_sale():
        try:
            data = request.json
            
            # Generate UUID if not present
            if 'id' not in data or not data['id']:
                import uuid
                data['id'] = uuid.uuid4().hex
            
            result = services.save_sale(data)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/sales', methods=['GET'])
    def get_sales():
        try:
            sales = services.get_sales(limit=100)
            return jsonify({'sales': sales, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API - Customers
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        try:
            customers = services.get_customers()
            return jsonify({'customers': customers, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/customers', methods=['POST'])
    def add_customer():
        try:
            data = request.json
            result = services.save_customer(data)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API - Products
    @app.route('/api/products', methods=['GET'])
    def get_products():
        try:
            products = services.get_products()
            return jsonify({'products': products, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API - Hardware (NOT AVAILABLE on Vercel)
    @app.route('/api/hardware/weight', methods=['GET'])
    def get_weight():
        return jsonify({
            'success': False,
            'message': 'Hardware not available in cloud mode',
            'runtime': 'cloud'
        })
    
    @app.route('/api/hardware/analyzer', methods=['GET'])
    def get_analyzer():
        return jsonify({
            'success': False,
            'message': 'Hardware not available in cloud mode',
            'runtime': 'cloud'
        })
    
    # API - Sync
    @app.route('/api/sync/status', methods=['GET'])
    def sync_status():
        return jsonify({
            'success': True,
            'runtime': 'cloud',
            'sync': 'realtime',
            'message': 'Cloud mode - all data synced in real-time'
        })
    
    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'runtime': 'cloud',
            'platform': 'vercel',
            'hardware': 'disabled',
            'sync': 'realtime',
            'timestamp': datetime.now().isoformat()
        })


# Create app instance for Vercel
app = create_app()


# Vercel serverless handler
def handler(request):
    """Vercel serverless function handler"""
    return app(request.environ, lambda *args: None)
