"""
MilkRecord Flask Application - Vercel + Windows EXE Compatible
Production-ready dairy management system
"""

import os
import sys
import signal
import logging
from datetime import datetime
from functools import wraps

# Flask imports
from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory, make_response

# Database
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not required in production

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/milkrecord.log') if os.path.exists('logs') else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# Flask App Initialization
# ============================================

def create_app():
    """Application factory for Vercel compatibility"""
    
    app = Flask(__name__,
                template_folder='../apps',
                static_folder='../apps',
                static_url_path='/static')
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'milkrecord-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database/milkrecord.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Initialize database
    db.init_app(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
        logger.info("Database initialized")
    
    # Register routes
    register_routes(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    logger.info("Flask app created successfully")
    
    return app

# Initialize database
db = SQLAlchemy()

# ============================================
# Database Models
# ============================================

class Farmer(db.Model):
    """Farmer database model"""
    __tablename__ = 'farmers'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    animal_type = db.Column(db.String(20))  # cow, buffalo, both
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'animal_type': self.animal_type,
            'balance': self.balance
        }

class MilkCollection(db.Model):
    """Milk collection entry"""
    __tablename__ = 'milk_collections'
    
    id = db.Column(db.String(50), primary_key=True)
    farmer_id = db.Column(db.String(50), db.ForeignKey('farmers.id'))
    quantity = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float)
    snf = db.Column(db.Float)
    rate = db.Column(db.Float)
    amount = db.Column(db.Float)
    shift = db.Column(db.String(10))  # morning, evening
    collection_date = db.Column(db.Date, default=datetime.utcnow().date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    farmer = db.relationship('Farmer', backref='collections')

class Customer(db.Model):
    """Customer database model"""
    __tablename__ = 'customers'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Sale(db.Model):
    """Product sale entry"""
    __tablename__ = 'sales'
    
    id = db.Column(db.String(50), primary_key=True)
    customer_id = db.Column(db.String(50), db.ForeignKey('customers.id'))
    customer_name = db.Column(db.String(100))  # Denormalized for quick access
    items = db.Column(db.Text)  # JSON string of items
    total_amount = db.Column(db.Float)
    paid_amount = db.Column(db.Float)
    payment_mode = db.Column(db.String(20))  # cash, upi, credit
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    customer = db.relationship('Customer', backref='sales')

# ============================================
# Routes
# ============================================

def register_routes(app):
    """Register all routes"""
    
    # Main Pages
    @app.route('/')
    def index():
        """Main landing page"""
        return render_template('dairy-pos-billing-software-india.html')
    
    @app.route('/pos')
    def pos_billing():
        """POS Billing page"""
        return render_template('dairy-pos-billing-software-india.html')
    
    @app.route('/collection')
    def milk_collection():
        """Milk Collection page"""
        return render_template('automated-milk-collection-system-village.html')
    
    @app.route('/farmers')
    def farmers():
        """Farmer management"""
        return render_template('farmer-management-milk-collection-centers.html')
    
    @app.route('/customers')
    def customers():
        """Customer management"""
        return render_template('customer-ledger-udhar-tracking-dairy.html')
    
    # API Routes - Farmers
    @app.route('/api/farmers', methods=['GET'])
    def get_farmers():
        """Get all farmers"""
        try:
            farmers = Farmer.query.all()
            return jsonify({'farmers': [f.to_dict() for f in farmers], 'success': True})
        except Exception as e:
            logger.error(f"Error getting farmers: {e}")
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/farmers', methods=['POST'])
    def add_farmer():
        """Add new farmer"""
        try:
            data = request.json
            farmer = Farmer(
                id=f"F{datetime.now().strftime('%Y%m%d%H%M%S')}",
                name=data['name'],
                phone=data.get('phone'),
                animal_type=data.get('animal_type', 'cow')
            )
            db.session.add(farmer)
            db.session.commit()
            return jsonify({'success': True, 'farmer': farmer.to_dict()})
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error adding farmer: {e}")
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API Routes - Sales
    @app.route('/api/sales', methods=['POST'])
    def add_sale():
        """Add new sale"""
        try:
            data = request.json
            sale = Sale(
                id=f"S{datetime.now().strftime('%Y%m%d%H%M%S')}",
                customer_id=data.get('customer_id'),
                customer_name=data.get('customer_name', 'Walking Customer'),
                items=data.get('items', '[]'),
                total_amount=data.get('total_amount', 0.0),
                paid_amount=data.get('paid_amount', 0.0),
                payment_mode=data.get('payment_mode', 'cash')
            )
            db.session.add(sale)
            db.session.commit()
            
            # Update customer balance if credit
            if data.get('payment_mode') == 'credit' and data.get('customer_id'):
                customer = Customer.query.get(data['customer_id'])
                if customer:
                    customer.balance += (data.get('total_amount', 0.0) - data.get('paid_amount', 0.0))
                    db.session.commit()
            
            return jsonify({'success': True, 'sale_id': sale.id})
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error adding sale: {e}")
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/sales', methods=['GET'])
    def get_sales():
        """Get sales with optional filters"""
        try:
            query = Sale.query.order_by(Sale.sale_date.desc())
            
            # Optional filters
            customer_id = request.args.get('customer_id')
            if customer_id:
                query = query.filter_by(customer_id=customer_id)
            
            date_from = request.args.get('date_from')
            if date_from:
                query = query.filter(Sale.sale_date >= datetime.fromisoformat(date_from))
            
            sales = query.limit(100).all()
            
            return jsonify({
                'sales': [{
                    'id': s.id,
                    'customer_name': s.customer_name,
                    'total_amount': s.total_amount,
                    'paid_amount': s.paid_amount,
                    'payment_mode': s.payment_mode,
                    'sale_date': s.sale_date.isoformat()
                } for s in sales],
                'success': True
            })
        except Exception as e:
            logger.error(f"Error getting sales: {e}")
            return jsonify({'error': str(e), 'success': False}), 500
    
    # API Routes - Customers
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        """Get all customers"""
        try:
            customers = Customer.query.all()
            return jsonify({
                'customers': [{
                    'id': c.id,
                    'name': c.name,
                    'phone': c.phone,
                    'balance': c.balance
                } for c in customers],
                'success': True
            })
        except Exception as e:
            logger.error(f"Error getting customers: {e}")
            return jsonify({'error': str(e), 'success': False}), 500
    
    @app.route('/api/customers', methods=['POST'])
    def add_customer():
        """Add new customer"""
        try:
            data = request.json
            customer = Customer(
                id=f"C{datetime.now().strftime('%Y%m%d%H%M%S')}",
                name=data['name'],
                phone=data.get('phone'),
                email=data.get('email'),
                address=data.get('address')
            )
            db.session.add(customer)
            db.session.commit()
            return jsonify({'success': True, 'customer': {
                'id': customer.id,
                'name': customer.name,
                'phone': customer.phone
            }})
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error adding customer: {e}")
            return jsonify({'error': str(e), 'success': False}), 500
    
    # Print Routes
    @app.route('/receipt/<sale_id>')
    def receipt(sale_id):
        """Print receipt for sale"""
        try:
            sale = Sale.query.get_or_404(sale_id)
            return render_template('receipt.html', sale=sale)
        except Exception as e:
            logger.error(f"Error generating receipt: {e}")
            return jsonify({'error': str(e)}), 500
    
    # Health & Status
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0'
        })
    
    @app.route('/api/status')
    def system_status():
        """System status"""
        try:
            # Check database
            db.session.execute(text('SELECT 1'))
            db_status = 'connected'
        except:
            db_status = 'disconnected'
        
        return jsonify({
            'app': 'running',
            'database': db_status,
            'timestamp': datetime.now().isoformat()
        })

# ============================================
# Error Handlers
# ============================================

def register_error_handlers(app):
    """Register error handlers"""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'success': False}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'success': False}), 500

# ============================================
# Vercel Serverless Entry Point
# ============================================

# For Vercel deployment
app = create_app()

# ============================================
# Windows EXE Entry Point
# ============================================

if __name__ == '__main__':
    # Windows EXE specific setup
    import webbrowser
    import threading
    
    def open_browser():
        """Open browser after server starts"""
        webbrowser.open("http://127.0.0.1:5000")
    
    # Get configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.getenv('HOST', '127.0.0.1')
    
    logger.info(f"Starting MilkRecord on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    
    # Open browser automatically (Windows EXE)
    if not debug:
        threading.Timer(1.5, open_browser).start()
    
    # Run Flask app
    try:
        app.run(host=host, port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        db.session.close()
        logger.info("Database connection closed")
