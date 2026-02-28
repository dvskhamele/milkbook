# MilkRecord Architecture Guide
## Future-Proof Split Architecture

This document explains the **properly split architecture** that supports:
- ✅ Desktop EXE (offline, hardware)
- ✅ Vercel Cloud (online, no hardware)
- ✅ Same codebase
- ✅ No breaking changes

---

## 🏗️ Architecture Overview

```
milkrecord_pos/flask_app/
│
├── core/                    ← PURE business logic (shared)
│   └── services.py          ← Calculations, validations, models
│
├── adapters/                ← Runtime-specific implementations
│   ├── db_local.py          ← SQLite (Desktop)
│   ├── db_cloud.py          ← PostgreSQL (Vercel)
│   └── hardware.py          ← Serial communication (Desktop only)
│
├── desktop/                 ← Desktop/EXE deployment
│   └── app.py               ← Flask server entry point
│
├── api/                     ← Vercel serverless deployment
│   └── index.py             ← Serverless function entry
│
├── templates/               ← HTML templates
├── static/                  ← CSS, JS, assets
└── apps/                    ← SEO-optimized HTML pages
```

---

## 🔑 Key Design Principles

### 1. **Core is Pure**

`core/services.py` contains:
- ✅ Domain models (Farmer, Customer, Sale)
- ✅ Business logic (rate calculation)
- ✅ Validation rules
- ✅ ID generation

**NO**:
- ❌ Database calls
- ❌ Hardware access
- ❌ Framework dependencies
- ❌ Runtime-specific code

### 2. **Adapters are Runtime-Specific**

Each adapter implements the same interface:

```python
# db_local.py (Desktop)
def farmer_save(farmer: Dict) -> bool:
    conn = sqlite3.connect(DB)
    # ... SQLite logic

# db_cloud.py (Vercel)
def farmer_save(farmer: Dict) -> bool:
    conn = psycopg2.connect(DATABASE_URL)
    # ... PostgreSQL logic
```

Same function signature, different implementation.

### 3. **Hardware is Desktop-Only**

```python
# adapters/hardware.py

IS_DESKTOP = getattr(sys, 'frozen', False)

if IS_DESKTOP:
    import serial
    def read_weight():
        # Real serial reading
else:
    def read_weight():
        return None  # Cloud returns None
```

**Vercel never sees hardware code.**

---

## 🖥️ Desktop Deployment (EXE)

### Entry Point: `desktop/app.py`

```python
from adapters import db_local, hardware
from core.services import RateCalculator

# Initialize SQLite
db_local.init_db()

# Start hardware
hardware.start_hardware()

# Flask routes use db_local
@app.route('/api/farmers', methods=['POST'])
def add_farmer():
    farmer = {...}
    db_local.farmer_save(farmer)  # ← SQLite
```

### Build Command:

```bash
pyinstaller --onefile --noconsole desktop/app.py
```

### Features:
- ✅ SQLite database (local file)
- ✅ Hardware integration (serial)
- ✅ Offline operation
- ✅ Auto-opens browser
- ✅ Print support

---

## ☁️ Vercel Deployment (Cloud)

### Entry Point: `api/index.py`

```python
from adapters import db_cloud
from core.services import RateCalculator

# Initialize PostgreSQL
db_cloud.init_db()

# NO hardware initialization

# Flask routes use db_cloud
@app.route('/api/farmers', methods=['POST'])
def add_farmer():
    farmer = {...}
    db_cloud.farmer_save(farmer)  # ← PostgreSQL
```

### Deploy Command:

```bash
vercel --prod
```

### Features:
- ✅ PostgreSQL database (cloud)
- ✅ Serverless scaling
- ✅ Global CDN
- ✅ Automatic HTTPS
- ❌ NO hardware support
- ❌ NO offline mode

---

## 🔄 How It Works

### Request Flow (Desktop):

```
Browser → desktop/app.py → db_local.py → SQLite file
                     ↓
                hardware.py → Serial port
```

### Request Flow (Vercel):

```
Browser → api/index.py → db_cloud.py → PostgreSQL
```

### Same Frontend:

```javascript
// Frontend doesn't know the difference
fetch('/api/farmers', {method: 'POST', body: data})
  .then(res => res.json())
  .then(data => console.log(data))
```

---

## 📊 Database Strategy

### Desktop (SQLite):
```python
# adapters/db_local.py
DB_PATH = "database/milkrecord.db"

def get_connection():
    return sqlite3.connect(DB_PATH)
```

**Pros:**
- ✅ No setup required
- ✅ Single file
- ✅ Works offline
- ✅ Fast for <100K records

**Cons:**
- ❌ No concurrent writes
- ❌ No cloud sync
- ❌ File-based backup

### Vercel (PostgreSQL):
```python
# adapters/db_cloud.py
DATABASE_URL = os.getenv('DATABASE_URL')

def get_connection():
    return psycopg2.connect(DATABASE_URL)
```

**Pros:**
- ✅ Cloud-hosted
- ✅ Concurrent access
- ✅ Automatic backup
- ✅ Scales infinitely

**Cons:**
- ❌ Requires internet
- ❌ Setup required (Neon/Supabase)
- ❌ Cost at scale

---

## 🔌 Hardware Integration

### Desktop Only:

```python
# adapters/hardware.py

class HardwareAdapter:
    def __init__(self):
        if IS_DESKTOP:
            import serial
            self.ser = serial.Serial(port, baudrate)
        else:
            self.ser = None  # Cloud mode
    
    def read_weight(self):
        if not self.ser:
            return None  # Cloud returns None
        return self.ser.readline()
```

### Usage in Routes:

```python
@app.route('/api/weight')
def get_weight():
    weight = hardware.read_weight()
    
    if weight is None:
        return jsonify({
            'success': False,
            'message': 'Hardware not available'
        })
    
    return jsonify({'success': True, 'weight': weight})
```

**Same route works on both platforms!**

---

## 🚀 Deployment Comparison

| Feature | Desktop EXE | Vercel Cloud |
|---------|-------------|--------------|
| **Database** | SQLite (file) | PostgreSQL (cloud) |
| **Hardware** | ✅ Yes | ❌ No |
| **Offline** | ✅ Yes | ❌ No |
| **Print** | ✅ Yes | ⚠️ Limited |
| **Setup** | Double-click EXE | `vercel --prod` |
| **Cost** | Free | Free tier + usage |
| **Scale** | Single machine | Unlimited |
| **Sync** | Manual export | Real-time |

---

## 🎯 Recommended Strategy

### Use Desktop EXE for:
- ✅ Milk collection centers
- ✅ Village operations
- ✅ Hardware integration (scale, analyzer)
- ✅ Print receipts
- ✅ Offline operations

### Use Vercel Cloud for:
- ✅ Admin dashboard
- ✅ Multi-location monitoring
- ✅ Reports & analytics
- ✅ Owner access (remote)
- ✅ Backup & sync

### Hybrid Approach:

```
Village Center (Desktop EXE)
       ↓
   Daily Sync
       ↓
Vercel Cloud (PostgreSQL)
       ↓
Owner Dashboard (Web)
```

---

## ⚠️ Critical Rules

### DO:
- ✅ Use `core/services.py` for business logic
- ✅ Use adapters for database/hardware
- ✅ Keep routes thin (call services)
- ✅ Use environment variables
- ✅ Handle errors gracefully

### DON'T:
- ❌ Mix SQLite calls in routes
- ❌ Put hardware logic in routes
- ❌ Hardcode file paths
- ❌ Use `flask.request` in core
- ❌ Block on hardware in routes

---

## 🔮 Future Extensions

### Add New Database:

1. Create `adapters/db_mysql.py`
2. Implement same interface
3. Set `DB_ADAPTER=db_mysql` in env

### Add New Hardware:

1. Extend `adapters/hardware.py`
2. Add device type
3. Add parsing logic
4. Desktop auto-supports

### Add New Platform:

1. Create `raspberry_pi/app.py`
2. Use `db_local` + `hardware`
3. Deploy to Pi

---

## 📈 Migration Path

### Phase 1: Desktop Only (Now)
```
desktop/app.py → db_local → SQLite
```

### Phase 2: Add Cloud (Later)
```
api/index.py → db_cloud → PostgreSQL
```

### Phase 3: Sync Engine (Future)
```
Desktop (SQLite) ←sync→ Cloud (PostgreSQL)
```

---

## 🧪 Testing Strategy

### Unit Tests (Core):
```python
def test_rate_calculation():
    rate = RateCalculator.calculate_rate(4.5, 8.5)
    assert rate == 64.0
```

### Integration Tests (Desktop):
```python
def test_farmer_save():
    farmer = {...}
    success = db_local.farmer_save(farmer)
    assert success == True
```

### API Tests (Vercel):
```python
def test_cloud_health():
    response = requests.get('https://app.vercel.app/api/health')
    assert response.status_code == 200
```

---

## 💰 Cost Analysis

### Desktop EXE:
- Development: Free
- Deployment: Free
- Database: Free (SQLite)
- Hardware: One-time cost
- **Total: ₹0**

### Vercel Cloud:
- Development: Free
- Deployment: Free (hobby)
- Database: Free (Neon/Supabase free tier)
- **Total: ₹0** (up to limits)

### Production:
- Vercel Pro: $20/month
- PostgreSQL: $15/month (Neon)
- **Total: ~₹3000/month**

---

## 🎓 Summary

This architecture gives you:

✅ **Single codebase** for desktop + cloud
✅ **No breaking changes** when adding features
✅ **Hardware support** where needed
✅ **Cloud scalability** where needed
✅ **Offline capability** for villages
✅ **Future-proof** for new platforms

**This is how professional software is built.**

---

**Built with ❤️ for Indian Dairy Shops**
