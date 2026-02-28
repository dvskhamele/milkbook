"""
MilkRecord Flask Application - Production Ready
Hardware-Integrated Dairy Management System
"""

import os
import sys
import signal
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Import hardware manager
from hardware.serial_manager import (
    get_manager, 
    init_default_devices, 
    DeviceConfig, 
    DeviceType
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            template_folder='../apps',
            static_folder='../apps')

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'milkrecord-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database/milkrecord.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# Initialize database
db = SQLAlchemy(app)

# Initialize serial manager
serial_mgr = get_manager()

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
    items = db.Column(db.Text)  # JSON string of items
    total_amount = db.Column(db.Float)
    paid_amount = db.Column(db.Float)
    payment_mode = db.Column(db.String(20))  # cash, upi, credit
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    customer = db.relationship('Customer', backref='sales')

# ============================================
# Hardware Integration Routes
# ============================================

@app.route('/api/hardware/devices', methods=['GET'])
def get_devices():
    """Get registered hardware devices"""
    devices = []
    for device_id, config in serial_mgr.devices.items():
        health = serial_mgr.get_device_health(device_id)
        devices.append({
            'id': config.device_id,
            'type': config.device_type.value,
            'port': config.port,
            'status': health.get('status', 'unknown'),
            'last_seen': health.get('last_seen'),
            'packets_received': health.get('packets_received', 0)
        })
    return jsonify({'devices': devices})

@app.route('/api/hardware/ports', methods=['GET'])
def list_ports():
    """List available serial ports"""
    ports = serial_mgr.list_available_ports()
    return jsonify({'ports': ports})

@app.route('/api/hardware/scale/latest', methods=['GET'])
def get_scale_reading():
    """Get latest weighing scale reading"""
    reading = serial_mgr.get_latest_reading('scale_01')
    if reading:
        return jsonify({
            'success': True,
            'weight': reading.value,
            'unit': reading.unit,
            'is_stable': reading.is_stable,
            'timestamp': reading.timestamp.isoformat()
        })
    return jsonify({'success': False, 'message': 'No reading available'})

@app.route('/api/hardware/analyzer/latest', methods=['GET'])
def get_analyzer_reading():
    """Get latest milk analyzer reading"""
    reading = serial_mgr.get_latest_reading('analyzer_01')
    if reading:
        return jsonify({
            'success': True,
            'fat': reading.fat,
            'snf': reading.snf,
            'temperature': reading.temperature,
            'is_valid': reading.is_valid,
            'timestamp': reading.timestamp.isoformat()
        })
    return jsonify({'success': False, 'message': 'No reading available'})

@app.route('/api/hardware/scale/start', methods=['POST'])
def start_scale():
    """Start weighing scale"""
    data = request.json
    port = data.get('port', '/dev/ttyUSB0')
    
    config = DeviceConfig(
        device_id='scale_01',
        device_type=DeviceType.WEIGHING_SCALE,
        port=port,
        baudrate=9600
    )
    serial_mgr.register_device(config)
    serial_mgr.start_device('scale_01')
    
    return jsonify({'success': True, 'message': 'Scale started'})

@app.route('/api/hardware/analyzer/start', methods=['POST'])
def start_analyzer():
    """Start milk analyzer"""
    data = request.json
    port = data.get('port', '/dev/ttyUSB1')
    
    config = DeviceConfig(
        device_id='analyzer_01',
        device_type=DeviceType.MILK_ANALYZER,
        port=port,
        baudrate=9600
    )
    serial_mgr.register_device(config)
    serial_mgr.start_device('analyzer_01')
    
    return jsonify({'success': True, 'message': 'Analyzer started'})

# ============================================
# Main Application Routes
# ============================================

@app.route('/')
def index():
    """Main landing page - redirect to POS billing"""
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

@app.route('/api/farmers', methods=['GET'])
def get_farmers():
    """Get all farmers"""
    farmers = Farmer.query.all()
    return jsonify({'farmers': [f.to_dict() for f in farmers]})

@app.route('/api/farmers', methods=['POST'])
def add_farmer():
    """Add new farmer"""
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

@app.route('/api/collections', methods=['POST'])
def add_collection():
    """Add milk collection entry"""
    data = request.json
    
    # Get stable weight from scale if available
    scale_reading = serial_mgr.get_latest_reading('scale_01')
    quantity = data.get('quantity')
    
    if scale_reading and scale_reading.is_stable:
        quantity = scale_reading.value
    
    collection = MilkCollection(
        id=f"C{datetime.now().strftime('%Y%m%d%H%M%S')}",
        farmer_id=data['farmer_id'],
        quantity=quantity,
        fat=data.get('fat'),
        snf=data.get('snf'),
        rate=data.get('rate'),
        amount=data.get('amount'),
        shift=data.get('shift', 'morning')
    )
    db.session.add(collection)
    db.session.commit()
    
    return jsonify({'success': True, 'collection': collection.id})

# ============================================
# Health & Status Routes
# ============================================

@app.route('/api/health')
def health_check():
    """Application health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

@app.route('/api/status')
def system_status():
    """System status including hardware"""
    return jsonify({
        'app': 'running',
        'database': 'connected',
        'hardware': {
            'scale': serial_mgr.get_device_health('scale_01'),
            'analyzer': serial_mgr.get_device_health('analyzer_01')
        }
    })

# ============================================
# Error Handlers
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================
# Application Lifecycle
# ============================================

def cleanup():
    """Cleanup on shutdown"""
    logger.info("Shutting down...")
    serial_mgr.stop_all()
    db.session.close()
    logger.info("Cleanup complete")

def signal_handler(sig, frame):
    """Handle shutdown signals"""
    cleanup()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    # Initialize database
    with app.app_context():
        db.create_all()
        logger.info("Database initialized")
    
    # Initialize default hardware devices
    init_default_devices()
    logger.info("Hardware manager initialized")
    
    # Start Flask app
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting MilkRecord Flask app on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        cleanup()
