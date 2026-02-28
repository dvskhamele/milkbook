# 🥛 MilkRecord POS - Quick Start Guide

## 🚀 Start POS Server (Development)

```bash
cd flask_app

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings (optional - works without Supabase too)

# Start POS server
python pos_server.py
```

**Access at:** http://localhost:5000/pos

---

## 🪟 Build Windows EXE

### Option 1: Automated Build

```bash
cd flask_app
python build_exe.py
```

### Option 2: Manual Build

```bash
cd flask_app
pip install pyinstaller==6.3.0

pyinstaller --onefile --noconsole --name="MilkRecordPOS" pos_server.py
```

**EXE will be in:** `dist/MilkRecordPOS.exe`

---

## 📦 Distribute EXE

1. Copy `dist/MilkRecordPOS.exe` to target machine
2. (Optional) Create `.env` file next to EXE with:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   ```
3. Run EXE - browser opens automatically
4. Database created automatically in same folder

---

## 🔧 Configuration

### Without Supabase (Offline Only)
Just run the EXE - works fully offline with SQLite.

### With Supabase (Auto-Sync)
Create `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### Hardware Integration
Add to `.env`:
```env
SCALE_PORT=COM3
ANALYZER_PORT=COM4
BAUDRATE=9600
```

---

## 🎯 Features

✅ **All from HTML file:**
- Product categories (Milk, Paneer, Ghee, Curd, Sweets, Bakery)
- Customer search & selection
- Cart management
- Payment modes (Cash, UPI, Credit/Likh Lo)
- Hold cart
- Round-off
- Advance/Udhar
- Relations

✅ **Backend Features:**
- SQLite database (offline)
- Supabase sync (when online)
- Hardware integration (scale, analyzer)
- Auto-sync every 10 seconds
- Conflict detection
- Device tracking

---

## 🐛 Troubleshooting

### EXE Won't Start
- Check if port 5000 is available
- Check firewall settings
- Run as Administrator once

### Database Errors
- Delete `database/milkrecord.db`
- Restart EXE (auto-creates)

### Sync Not Working
- Check internet connection
- Verify SUPABASE_URL and SUPABASE_KEY
- Check sync status: http://localhost:5000/api/sync/status

---

## 📊 API Endpoints

All endpoints return JSON:

```
GET  /api/products          - Get products
POST /api/products          - Add product
GET  /api/customers         - Get customers
POST /api/customers         - Add customer
POST /api/sales             - Save sale
GET  /api/sales             - Get sales
GET  /api/farmers           - Get farmers
POST /api/farmers           - Add farmer
GET  /api/hardware/weight   - Get scale reading
GET  /api/hardware/analyzer - Get analyzer reading
GET  /api/sync/status       - Get sync status
POST /api/sync/force        - Force sync
GET  /api/health            - Health check
```

---

## 🎉 Ready to Use!

**Start with:**
```bash
python pos_server.py
```

**Or build EXE:**
```bash
python build_exe.py
```

**That's it!** 🚀

---

**Built with ❤️ for Indian Dairy Shops**
