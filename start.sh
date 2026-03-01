#!/bin/bash
# MilkRecord POS - Start Server

cd "$(dirname "$0")/flask_app"

echo "🚀 Starting MilkRecord POS Server..."
echo ""

# Run with nohup to keep running
nohup python3 vercel_app.py > /tmp/milkrecord.log 2>&1 &

echo "✅ Server started!"
echo "📍 URL: http://localhost:5000/pos"
echo "📄 Logs: /tmp/milkrecord.log"
echo ""
echo "To stop: killall -9 python3"
