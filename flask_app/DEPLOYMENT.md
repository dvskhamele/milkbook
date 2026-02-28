# MilkRecord Deployment Guide
## Vercel + Windows EXE Compatible

This guide covers deploying MilkRecord to:
1. **Vercel** (Cloud/Online)
2. **Windows EXE** (Offline/Desktop)

Both use the **same codebase** with different configurations.

---

## 📁 Project Structure

```
milkrecord_pos/
├── flask_app/
│   ├── app.py                    # Main Flask app (Vercel + EXE compatible)
│   ├── requirements.txt          # Python dependencies
│   ├── vercel.json              # Vercel configuration
│   ├── milkrecord.spec          # PyInstaller configuration
│   ├── .env.example             # Environment template
│   ├── start.sh                 # Quick start script
│   ├── README.md                # This file
│   ├── hardware/
│   │   └── serial_manager.py    # Hardware integration (optional)
│   ├── database/                # SQLite database
│   └── logs/                    # Application logs
│
└── apps/                         # HTML templates (symlinked)
    ├── dairy-pos-billing-software-india.html
    ├── automated-milk-collection-system-village.html
    └── ... (other SEO pages)
```

---

## 🌐 Option 1: Deploy to Vercel (Cloud)

### Prerequisites
- Vercel account (free)
- Vercel CLI installed: `npm install -g vercel`
- GitHub repository

### Steps

#### 1. Prepare for Vercel

```bash
cd flask_app

# Install dependencies
pip install -r requirements.txt

# Test locally first
python app.py
```

#### 2. Configure Environment Variables

In Vercel dashboard, set:
```
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=sqlite:///database/milkrecord.db
```

#### 3. Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### 4. Access Your App

Vercel will provide a URL like:
```
https://milkrecord-yourproject.vercel.app
```

### ⚠️ Vercel Limitations

- **Serverless functions** have 10-second timeout (Pro: 60s)
- **SQLite** works but resets on each deployment
- **Serial hardware** NOT supported (serverless)
- **Persistent storage** requires external database (PostgreSQL)

### ✅ Best For

- Online access
- Multi-device cloud sync
- No hardware integration needed
- Quick deployment

---

## 🪟 Option 2: Windows EXE (Offline/Desktop)

### Prerequisites
- Python 3.8+ installed
- pip installed
- Windows 10/11

### Steps

#### 1. Install Dependencies

```bash
cd flask_app

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install pyinstaller==6.3.0
```

#### 2. Test Locally

```bash
# Run Flask app
python app.py

# Access at: http://127.0.0.1:5000
```

#### 3. Build Windows EXE

```bash
# Build executable
pyinstaller milkrecord.spec

# EXE will be in: dist/MilkRecord.exe
```

#### 4. Distribute

Copy `dist/MilkRecord.exe` to any Windows machine.

**No Python required!** The EXE includes everything.

### ✅ Features

- ✅ Fully offline
- ✅ SQLite database persists
- ✅ Print support works
- ✅ Hardware integration ready (serial_manager.py)
- ✅ Auto-opens browser on start
- ✅ No internet required

### ⚠️ Important Notes

1. **First Run**: May take 5-10 seconds to start
2. **Antivirus**: May flag as false positive (add to exceptions)
3. **Database**: Stored in same folder as EXE
4. **Logs**: Check `logs/milkrecord.log` for errors

---

## 🔧 Option 3: Local Development

### Quick Start

```bash
cd flask_app

# Run quick start script
./start.sh

# Or manually:
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

pip install -r requirements.txt
python app.py
```

### Access

```
http://localhost:5000
```

---

## 📊 Database Migration

### From Local to Cloud

If moving from SQLite (local) to PostgreSQL (Vercel):

1. **Update requirements.txt**:
```
psycopg2-binary==2.9.9
```

2. **Update app.py**:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
```

3. **Set Vercel Environment Variable**:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

4. **Migrate Data**:
```python
# Use pg_dump and pg_restore
# Or write migration script
```

---

## 🖨️ Print Support

### Receipt Printing

The app includes receipt generation:

```python
@app.route('/receipt/<sale_id>')
def receipt(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return render_template('receipt.html', sale=sale)
```

### Frontend Usage

```javascript
// After saving sale
window.open(`/receipt/${sale_id}`, '_blank');
```

### Windows EXE Printing

- Uses default Windows printer
- Supports thermal printers (58mm, 80mm)
- Configure in Windows Settings

---

## 🔌 Hardware Integration

### Adding Scale/Analyzer

Hardware integration is **separate** from main app:

```python
# In app.py (already included)
from hardware.serial_manager import get_manager

serial_mgr = get_manager()

@app.route('/api/hardware/scale/latest')
def get_scale():
    reading = serial_mgr.get_latest_reading('scale_01')
    # Return reading
```

### Enable Hardware

1. **Install pyserial**:
```bash
pip install pyserial==3.5
```

2. **Configure ports** in `.env`:
```
SCALE_PORT=COM3
ANALYZER_PORT=COM4
```

3. **Start devices**:
```python
serial_mgr.start_device('scale_01')
```

### ⚠️ Hardware + Vercel

**NOT COMPATIBLE** - Vercel is serverless (no direct hardware access).

Use hardware only with:
- Windows EXE
- Local Flask server
- Raspberry Pi / Local server

---

## 🚀 Production Checklist

### Before Deploying

- [ ] Change `SECRET_KEY` in environment
- [ ] Set `FLASK_DEBUG=False`
- [ ] Test all routes locally
- [ ] Verify database migrations
- [ ] Test print functionality
- [ ] Backup database
- [ ] Configure CORS if needed
- [ ] Set up logging rotation
- [ ] Test error handling

### Security

- [ ] Use HTTPS (Vercel provides automatically)
- [ ] Set strong SECRET_KEY
- [ ] Enable database backups
- [ ] Restrict API access if needed
- [ ] Sanitize user inputs
- [ ] Implement rate limiting

---

## 🐛 Troubleshooting

### Vercel Deployment Fails

```bash
# Check build logs
vercel logs

# Test build locally
vercel dev
```

### Windows EXE Won't Start

1. **Check logs**: `logs/milkrecord.log`
2. **Run with console**: Edit `milkrecord.spec`, set `console=True`
3. **Rebuild**: `pyinstaller milkrecord.spec`
4. **Check antivirus**: Add to exceptions

### Database Errors

```bash
# Delete and recreate
rm database/milkrecord.db
python app.py  # Auto-creates
```

### Port Already in Use

```bash
# Change port in .env
PORT=5001

# Or specify on command line
python app.py --port=5001
```

---

## 📈 Performance

### Vercel
- Cold start: 1-3 seconds
- Request timeout: 10 seconds (free), 60 seconds (pro)
- Concurrent requests: Unlimited

### Windows EXE
- Startup: 2-5 seconds
- Memory: ~100MB
- Database: SQLite (fast for <100K records)

---

## 🎯 Recommendation

**Use Both:**

1. **Vercel** for:
   - Online access
   - Multi-location sync
   - Customer portal
   - Reports & analytics

2. **Windows EXE** for:
   - Offline billing counter
   - Hardware integration (scale, analyzer)
   - Print receipts
   - Fast local operations

**Same codebase, different deployments!**

---

## 📞 Support

For issues:
1. Check logs: `logs/milkrecord.log`
2. Enable debug mode
3. Review error messages
4. Check database connectivity

---

**Built with ❤️ for Indian Dairy Shops**
