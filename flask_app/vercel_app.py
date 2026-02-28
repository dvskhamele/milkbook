"""
MilkRecord Vercel Flask App
Production deployment with Supabase backend
"""

import os
import sys
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import core services
from core import services

# Initialize Flask app
app = Flask(__name__, 
            template_folder='../apps',
            static_folder='../apps',
            static_url_path='/static')

# Force cloud mode for Vercel
os.environ['RUNTIME'] = 'cloud'
os.environ['VERCEL'] = '1'

# ============================================
# Main Routes
# ============================================

@app.route('/')
def index():
    """Main POS page"""
    return send_from_directory('../apps', 'dairy-pos-billing-software-india.html')

@app.route('/pos')
def pos():
    """POS Billing"""
    return send_from_directory('../apps', 'dairy-pos-billing-software-india.html')

@app.route('/collection')
def collection():
    """Milk Collection"""
    return send_from_directory('../apps', 'collection.html')

@app.route('/<path:filename>')
def serve_file(filename):
    """Serve any static file from apps folder"""
    return send_from_directory('../apps', filename)

# ============================================
# Product API
# ============================================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        products = services.get_products()
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
    """Save sale"""
    try:
        data = request.json
        if 'id' not in data:
            import uuid
            data['id'] = str(uuid.uuid4())
        if 'sale_date' not in data:
            data['sale_date'] = datetime.now().isoformat()
        
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
# Farmers API
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
# Utility API
# ============================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'runtime': 'cloud',
        'platform': 'vercel',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/user', methods=['GET'])
def get_user():
    """Get current user"""
    return jsonify({
        'success': True,
        'user': {
            'name': 'POS User',
            'shop': 'Gopal Dairy',
            'shift': 'morning'
        }
    })

# ============================================
# Vercel Handler
# ============================================

def handler(request):
    """Vercel serverless handler"""
    return app(request.environ, lambda *args: None)
