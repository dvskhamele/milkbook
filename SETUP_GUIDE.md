# 🚀 MilkRecord POS - Complete Setup Guide

## End-to-End Implementation with Python Backend

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Hardware Setup](#hardware-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### **Required:**
- Python 3.8 or higher
- Node.js 16+ (optional, for development)
- Modern browser (Chrome/Edge recommended)
- USB ports for hardware devices

### **Optional Hardware:**
- USB Barcode Scanner
- Thermal Receipt Printer (ESC/POS compatible)
- Digital Weighing Scale (USB/Serial)
- Cash Drawer (printer-connected)

---

## Quick Start

### **1. Install Python Dependencies**

```bash
cd /Users/test/startups/milkrecord_pos/backend
pip3 install -r requirements.txt
```

### **2. Start Backend Server**

```bash
cd /Users/test/startups/milkrecord_pos/backend
python3 server.py
```

You should see:
```
✅ Database initialized successfully
🚀 MilkRecord POS Server Starting...
📁 Database: /path/to/milkrecord.db
🔌 SocketIO: Enabled
🌐 CORS: Enabled
```

### **3. Open POS in Browser**

```
Open: http://localhost:5000
Or: apps/dairy-pos-enhanced.html
```

### **4. Login**

**Default Credentials:**
- Operator ID: `OP-001`
- Password: `admin123`

**⚠️ Change password after first login!**

---

## Backend Setup

### **Directory Structure**

```
milkrecord_pos/
├── backend/
│   ├── server.py              # Main Flask server
│   ├── requirements.txt       # Python dependencies
│   └── data/
│       └── milkrecord.db      # SQLite database (auto-created)
├── apps/
│   ├── dairy-pos-enhanced.html  # Main POS
│   └── ... (other apps)
├── hardware/
│   └── hardware-integration.js
├── auth/
│   └── shift-authorization.html
└── compliance/
    └── audit-trail.js
```

### **Database Schema**

The backend automatically creates these tables:

| Table | Purpose |
|-------|---------|
| `shops` | Shop/Store information |
| `users` | Operators and staff |
| `customers` | Customer database |
| `products` | Product catalog |
| `invoices` | Sales transactions |
| `invoice_items` | Invoice line items |
| `shifts` | Shift management |
| `customer_ledger` | Credit/Debit tracking |
| `audit_logs` | Complete audit trail |
| `sync_queue` | Offline sync queue |
| `hardware_devices` | Device registry |

### **Configuration**

Edit `backend/server.py` to customize:

```python
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['DATABASE'] = '/path/to/database.db'
```

### **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/products` | GET/POST | Product management |
| `/api/products/<id>` | PUT/DELETE | Update/Delete product |
| `/api/invoices` | GET/POST | Invoice management |
| `/api/shifts` | POST | Start shift |
| `/api/shifts/<id>/end` | POST | End shift |
| `/api/customers` | GET/POST | Customer management |
| `/api/audit-logs` | GET | View audit logs |
| `/api/health` | GET | Health check |

---

## Frontend Setup

### **Using Enhanced POS**

1. **Start backend** (see above)
2. **Open browser:** `http://localhost:5000`
3. **Login** with credentials
4. **Complete shift authorization**
5. **Start billing!**

### **Connecting to Backend**

The POS automatically connects to the backend via:
- **REST API** for data operations
- **Socket.IO** for real-time updates
- **LocalStorage** for offline mode

### **Configuration**

In `apps/dairy-pos-enhanced.html`:

```javascript
const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
```

Change these if your backend runs on a different port/host.

---

## Hardware Setup

### **1. Barcode Scanner**

**Setup:**
1. Connect USB scanner
2. It acts as keyboard input
3. No drivers needed!

**Test:**
1. Open POS
2. Click in product search field
3. Scan any barcode
4. Product should auto-add to cart

### **2. Thermal Printer**

**USB ESC/POS Printers:**
```bash
# Check if printer is detected
lsusb | grep -i printer
```

**Setup:**
1. Connect via USB
2. Install manufacturer drivers (if needed)
3. Chrome/Edge will detect automatically
4. Test print from POS

**Network Printers:**
1. Connect to same network
2. Note printer IP address
3. Configure in POS settings

### **3. Digital Scale**

**Serial Scales:**
```bash
# Check serial ports (macOS)
ls /dev/cu.*

# Check serial ports (Linux)
ls /dev/ttyUSB*
```

**Setup:**
1. Connect via USB-Serial adapter
2. Grant serial port permission in browser
3. Configure baud rate (default: 9600)

### **4. Cash Drawer**

**Setup:**
1. Connect to printer's RJ11/RJ12 port
2. Opens automatically on sale
3. No additional configuration needed

---

## Testing

### **1. Test Backend**

```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"operator_id":"OP-001","password":"admin123"}'
```

### **2. Test POS**

**Basic Flow:**
1. ✅ Login successful
2. ✅ Shift starts
3. ✅ Products display
4. ✅ Add to cart works
5. ✅ Payment completes
6. ✅ Receipt prints
7. ✅ Shift ends
8. ✅ Audit logs created

**Hardware Tests:**
1. ✅ Barcode scanner adds products
2. ✅ Printer prints receipts
3. ✅ Cash drawer opens
4. ✅ Scale reads weight (if connected)

### **3. Test Offline Mode**

1. Start POS with backend
2. Stop backend server
3. Continue using POS (offline mode)
4. Restart backend
5. Data syncs automatically

---

## Deployment

### **Option 1: Local Installation**

**For single shop:**
```bash
# Start backend
cd backend
python3 server.py

# Open in browser
open http://localhost:5000
```

**Auto-start on boot (macOS):**
```bash
# Create launch agent
cat > ~/Library/LaunchAgents/com.milkrecord.pos.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.milkrecord.pos</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/test/startups/milkrecord_pos/backend/server.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/test/startups/milkrecord_pos/backend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/milkrecord-pos.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/milkrecord-pos.err</string>
</dict>
</plist>
EOF

# Load agent
launchctl load ~/Library/LaunchAgents/com.milkrecord.pos.plist
```

### **Option 2: Network Deployment**

**For multiple terminals:**

1. **Start backend on server:**
```bash
python3 server.py --host=0.0.0.0 --port=5000
```

2. **Access from other devices:**
```
http://SERVER_IP:5000
```

3. **Configure firewall:**
```bash
# Allow port 5000
sudo ufw allow 5000/tcp  # Linux
# or
sudo firewall-cmd --add-port=5000/tcp --permanent  # CentOS
```

### **Option 3: Cloud Deployment**

**Using Vercel/Heroku:**

1. **Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    { "src": "backend/server.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "backend/server.py" }
  ]
}
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Update frontend API URL:**
```javascript
const API_BASE = 'https://your-app.vercel.app/api';
```

---

## Production Configuration

### **Security**

1. **Change default password:**
```sql
UPDATE users 
SET password_hash = sha256('new_password') 
WHERE operator_id = 'OP-001';
```

2. **Enable HTTPS:**
```bash
# Using Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

3. **Set strong SECRET_KEY:**
```python
import secrets
app.config['SECRET_KEY'] = secrets.token_hex(32)
```

### **Performance**

1. **Use production server:**
```bash
pip install gunicorn eventlet
gunicorn -w 4 -b 0.0.0.0:5000 "server:app"
```

2. **Enable database connection pooling:**
```python
from flask_sqlalchemy import SQLAlchemy
app.config['SQLALCHEMY_POOL_SIZE'] = 10
```

3. **Add caching:**
```python
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'redis'})
```

### **Backup**

**Database backup script:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/milkrecord.db /backups/milkrecord_$DATE.db
# Keep only last 30 days
find /backups -name "milkrecord_*.db" -mtime +30 -delete
```

**Auto-backup daily:**
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### **Backend won't start**

**Error: Port already in use**
```bash
# Find process using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

**Error: Database locked**
```bash
# Remove lock file
rm /path/to/milkrecord.db-shm
rm /path/to/milkrecord.db-wal
```

### **POS won't connect**

**Check backend is running:**
```bash
curl http://localhost:5000/api/health
```

**Check CORS:**
```python
# In server.py, ensure CORS is enabled
CORS(app)
```

**Check browser console:**
```
F12 → Console → Look for errors
```

### **Hardware not working**

**Barcode scanner:**
- Ensure it's keyboard emulation mode
- Test in text editor first
- Check scanner ends with Enter key

**Printer:**
- Install manufacturer drivers
- Test print from browser
- Check USB connection

**Scale:**
- Grant serial port permission
- Check baud rate matches
- Test with serial terminal

### **Database issues**

**Reset database:**
```bash
# Backup first!
cp milkrecord.db milkrecord.db.backup

# Delete and restart
rm milkrecord.db
python3 server.py
# Database will be recreated
```

**Migrate data:**
```python
# Export data
import sqlite3
conn = sqlite3.connect('old.db')
data = conn.execute('SELECT * FROM products').fetchall()

# Import to new
conn = sqlite3.connect('new.db')
conn.executemany('INSERT INTO products VALUES (...)', data)
conn.commit()
```

---

## Support

### **Documentation**

- `ENHANCED_EDITION_README.md` - User manual
- `HARDWARE_IMPROVEMENTS_SUMMARY.md` - Hardware guide
- `IMPLEMENTATION_COMPLETE.md` - Technical summary

### **Logs**

**Backend logs:**
```bash
tail -f /tmp/milkrecord-pos.log
```

**Browser console:**
```
F12 → Console
```

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Login fails | Check credentials, verify backend running |
| Products not loading | Check API endpoint, CORS enabled |
| Printer not working | Install drivers, test USB connection |
| Scanner not adding | Ensure keyboard emulation mode |
| Offline mode stuck | Clear localStorage, restart browser |

---

## Updates

### **Update Backend**

```bash
cd /Users/test/startups/milkrecord_pos/backend
git pull
pip3 install -r requirements.txt
# Restart server
```

### **Update Frontend**

```bash
cd /Users/test/startups/milkrecord_pos
git pull
# Hard refresh browser (Ctrl+Shift+R)
```

---

## 🎉 Success!

Your MilkRecord POS is now fully set up with:

- ✅ Python Flask backend
- ✅ SQLite database
- ✅ Real-time WebSocket updates
- ✅ Hardware integration
- ✅ Audit trail logging
- ✅ Offline-first design
- ✅ Production-ready security

**Happy Billing!** 🚀

---

**Last Updated:** March 1, 2026  
**Version:** 2.0 Enhanced  
**Backend:** Flask + SQLite + SocketIO
