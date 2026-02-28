#!/bin/bash
# MilkRecord POS - Quick Start Script

echo "🥛 MilkRecord POS - Dairy Shop Billing System"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Navigate to flask_app
cd flask_app

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Create necessary directories
mkdir -p database logs templates receipts

# Initialize database
echo "🗄️  Initializing database..."
python3 -c "from adapters import db_local; db_local.init_db(); print('✅ Database ready')"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting MilkRecord POS..."
echo ""
echo "🌐 Access at: http://localhost:5000/pos"
echo "📊 Direct POS: http://localhost:5000/apps/dairy-pos-billing-software-india.html"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start Flask app
python3 desktop/app.py
