"""
MilkRecord Vercel Flask App
Production deployment with Supabase backend
"""

import os
import sys
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import core services
from core import services

# Import Supabase client directly
try:
    from supabase import create_client
    import os
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if supabase_url and supabase_key:
        supabase_client = create_client(supabase_url, supabase_key)
        print("✅ Supabase connected")
    else:
        supabase_client = None
        print("⚠️ Supabase not configured (check .env)")
except Exception as e:
    supabase_client = None
    print(f"⚠️ Supabase error: {e}")

def get_client():
    """Get Supabase client"""
    return supabase_client

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
# Shop Settings API
# ============================================

@app.route('/api/shop-settings', methods=['GET'])
def get_shop_settings():
    """Get shop settings"""
    try:
        client = get_client()
        result = client.table('shop_settings').select('*').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return jsonify({'settings': result.data[0], 'success': True})
        else:
            return jsonify({'settings': {}, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/shop-settings', methods=['POST'])
def save_shop_settings():
    """Save shop settings with validation"""
    try:
        data = request.json
        import re
        
        # Validation errors list
        errors = []
        
        # Required fields
        if not data.get('shop_name'):
            errors.append('Shop name is required')
        
        # Phone validation (10 digits)
        if data.get('shop_phone'):
            phone = re.sub(r'\D', '', data['shop_phone'])  # Remove non-digits
            if len(phone) != 10:
                errors.append(f'Phone must be 10 digits (got {len(phone)})')
            data['shop_phone'] = phone  # Clean phone
        
        # Email validation
        if data.get('shop_email'):
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', data['shop_email']):
                errors.append('Invalid email format')
        
        # Pincode validation (6 digits)
        if data.get('shop_pincode'):
            pincode = re.sub(r'\D', '', data['shop_pincode'])
            if len(pincode) != 6:
                errors.append(f'Pincode must be 6 digits (got {len(pincode)})')
            data['shop_pincode'] = pincode
        
        # GST validation (15 chars)
        if data.get('shop_gst'):
            if len(data['shop_gst']) != 15:
                errors.append(f'GST must be 15 characters (got {len(data["shop_gst"])})')
        
        # PAN validation (10 chars)
        if data.get('shop_pan'):
            if len(data['shop_pan']) != 10:
                errors.append(f'PAN must be 10 characters (got {len(data["shop_pan"])})')
        
        # IFSC validation (11 chars)
        if data.get('shop_ifsc'):
            if len(data['shop_ifsc']) != 11:
                errors.append(f'IFSC must be 11 characters (got {len(data["shop_ifsc"])})')
        
        # UPI validation (contains @)
        if data.get('shop_upi'):
            if '@' not in data['shop_upi']:
                errors.append('UPI must contain @ symbol')
        
        # Return validation errors
        if errors:
            return jsonify({
                'error': 'Validation failed',
                'errors': errors,
                'success': False
            }), 400
        
        # All validations passed - save to Supabase
        client = get_client()
        
        if not client:
            return jsonify({
                'error': 'Supabase not configured',
                'success': False
            }), 500
        
        # Check if settings exist
        existing = client.table('shop_settings').select('id').limit(1).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing
            result = client.table('shop_settings').update(data).eq('id', existing.data[0]['id']).execute()
            message = 'Settings updated in Supabase!'
        else:
            # Insert new
            result = client.table('shop_settings').insert(data).execute()
            message = 'Settings saved to Supabase!'
        
        return jsonify({
            'success': True,
            'message': message,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

# ============================================
# Vercel Handler
# ============================================

def handler(request):
    """Vercel serverless handler"""
    return app(request.environ, lambda *args: None)

# ============================================
# Run Locally
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
    
    # Open browser after 2 seconds
    threading.Timer(2.0, open_browser).start()
    
    # Run Flask
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)
