"""
Vercel Serverless Entry Point
Cloud deployment - NO hardware support
Uses PostgreSQL database
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from core.services import RateCalculator, IDGenerator

# Use cloud database adapter
from adapters import db_cloud

# ============================================
# Flask App
# ============================================

def create_app():
    """Create Flask application for Vercel"""
    
    app = Flask(__name__,
                template_folder='../apps',
                static_folder='../apps',
                static_url_path='/static')
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'vercel-secret-key')
    app.config['DEBUG'] = False  # Never debug in production
    
    # Initialize database
    try:
        db_cloud.init_db()
    except Exception as e:
        print(f"Database init failed: {e}")
    
    # Register routes
    register_routes(app)
    
    return app


def register_routes(app):
    """Register all routes"""
    
    # Main Pages
    @app.route('/')
    def index():
        return send_file('../apps/dairy-pos-billing-software-india.html')
    
    # API - Farmers
    @app.route('/api/farmers', methods=['GET'])
    def get_farmers():
        try:
            farmers = db_cloud.farmer_get_all()
            return jsonify({'farmers': farmers, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/farmers', methods=['POST'])
    def add_farmer():
        try:
            data = request.json
            farmer = {
                'id': IDGenerator.generate_farmer_id(),
                'name': data['name'],
                'phone': data.get('phone'),
                'animal_type': data.get('animal_type', 'cow'),
                'balance': 0.0,
                'created_at': datetime.now().isoformat()
            }
            success = db_cloud.farmer_save(farmer)
            return jsonify({'success': success, 'farmer': farmer})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API - Sales
    @app.route('/api/sales', methods=['POST'])
    def add_sale():
        try:
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
            success = db_cloud.sale_save(sale)
            return jsonify({'success': success, 'sale_id': sale['id']})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/sales', methods=['GET'])
    def get_sales():
        try:
            sales = db_cloud.sale_get_all(limit=100)
            return jsonify({'sales': sales, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API - Customers
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        try:
            customers = db_cloud.customer_get_all()
            return jsonify({'customers': customers, 'success': True})
        except Exception as e:
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/customers', methods=['POST'])
    def add_customer():
        try:
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
            success = db_cloud.customer_save(customer)
            return jsonify({'success': success, 'customer': customer})
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
    
    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'runtime': 'cloud',
            'hardware': 'disabled',
            'platform': 'vercel',
            'timestamp': datetime.now().isoformat()
        })


# Create app instance for Vercel
app = create_app()


# Vercel serverless handler
def handler(request):
    """Vercel serverless function handler"""
    return app(request.environ, lambda *args: None)
