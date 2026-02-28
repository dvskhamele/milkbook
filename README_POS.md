# 🥛 MilkRecord POS - Complete Dairy Shop Billing System

Production-ready Point of Sale system for Indian dairy shops with full database integration.

## 🚀 Quick Start

### Option 1: Run with Flask (Recommended)

```bash
cd flask_app

# Install dependencies
pip install -r requirements.txt

# Start the application
python desktop/app.py

# Access at: http://localhost:5000/pos
```

### Option 2: Direct HTML (Offline Mode)

```bash
# Open directly in browser
open apps/dairy-pos-billing-software-india.html
```

## ✨ Features

### Product Management
- ✅ **7 Product Categories**: Milk, Paneer, Ghee, Curd, Sweets, Bakery, All
- ✅ **Visual Product Cards** with emojis
- ✅ **Search & Filter** by category or name
- ✅ **Quick Add** to cart with one click
- ✅ **Quantity Badges** showing items in cart

### Customer Management
- ✅ **Customer Search** with dropdown
- ✅ **Customer Selection** with balance display
- ✅ **Walking Customer** support
- ✅ **Customer Ledger** integration ready

### Payment System
- ✅ **Multiple Payment Modes**: Cash, UPI, Credit (Likh Lo)
- ✅ **Round Off** calculation
- ✅ **Change Display** (सही राशि!)
- ✅ **Hold Cart** for later
- ✅ **Advance/Udhar** management

### Cart Features
- ✅ **Real-time Total** calculation
- ✅ **Quantity Adjustment** per item
- ✅ **Item Removal** from cart
- ✅ **Cart Count** badge

## 📁 File Structure

```
milkrecord_pos/
├── apps/
│   └── dairy-pos-billing-software-india.html  ← Main POS page
├── flask_app/
│   ├── desktop/
│   │   └── app.py                              ← Flask backend
│   ├── core/
│   │   └── services.py                         ← Business logic
│   ├── adapters/
│   │   ├── db_local.py                         ← SQLite database
│   │   └── hardware.py                         ← Hardware layer
│   └── requirements.txt                        ← Dependencies
└── README_POS.md                               ← This file
```

## 🎯 How to Use

### 1. Add Products to Cart
- Click any product card
- Product added with quantity 1
- Click again to increase quantity
- Quantity badge shows on card

### 2. Select Customer
- Type customer name in search box
- Select from dropdown
- Customer balance shown

### 3. Process Payment
- Enter amount in "₹" field
- Or use "Round" to round off
- Click payment mode:
  - **CASH** - Cash payment
  - **UPI** - Digital payment
  - **LIKH LO** - Credit/Udhar
  - **HOLD** - Save cart for later

### 4. Additional Actions
- **Udhar** - Customer advance/credit
- **Order** - Advance order booking
- **Relations** - Customer relationship history

## 🔧 Configuration

### Database
The system uses SQLite by default:
```
flask_app/database/milkrecord.db
```

Auto-creates on first run.

### Products
Sample products are pre-loaded:
- Cow Milk (₹64)
- Buffalo Milk (₹72)
- Paneer (₹400)
- Ghee (₹600)
- Curd (₹80)
- Lassi (₹60)
- Barfi (₹300)
- Jalebi (₹200)
- Bread (₹40)
- Biscuits (₹30)

### Customers
Loaded from database or localStorage fallback.

## 🌐 API Endpoints

### Products
```
GET /api/products
→ Returns all products with categories
```

### Customers
```
GET /api/customers
→ Returns all customers

POST /api/customers
→ Add new customer
```

### Sales
```
GET /api/sales
→ Returns recent sales

POST /api/sales
→ Create new sale
```

## 💾 Offline Mode

If Flask backend is not available:
- System uses localStorage
- Products saved locally
- Customers saved locally
- Sales saved locally
- Syncs when backend available

## 🎨 UI Features

### Responsive Design
- Desktop optimized
- Tablet friendly
- Mobile responsive
- Touch-friendly buttons

### Visual Feedback
- Toast notifications
- Hover effects
- Active states
- Loading indicators

### Color Coding
- **Green** - Cash/Success
- **Blue** - UPI/Digital
- **Yellow** - Hold/Credit
- **Red** - Remove/Due

## 🚀 Production Deployment

### Windows EXE
```bash
cd flask_app
pip install pyinstaller
pyinstaller --onefile --noconsole --name="MilkRecordPOS" desktop/app.py
```

### Vercel Cloud
```bash
cd flask_app
vercel --prod
```

## 📊 Database Schema

### Customers Table
```sql
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at TIMESTAMP
)
```

### Sales Table
```sql
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT,
    items JSONB,
    total_amount REAL,
    paid_amount REAL,
    payment_mode TEXT,
    sale_date TIMESTAMP
)
```

## 🔐 Security

- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens (Flask)
- Secure session handling

## 🐛 Troubleshooting

### Products not loading
```
Check: flask_app running?
Check: /api/products endpoint
Check: Browser console for errors
```

### Database errors
```
Delete: flask_app/database/milkrecord.db
Restart: python desktop/app.py
```

### Cart not updating
```
Clear: Browser cache
Refresh: Page (F5)
Check: JavaScript console
```

## 📞 Support

For issues or questions:
- Check browser console
- Review logs in `flask_app/logs/`
- Enable debug mode: `FLASK_DEBUG=True`

## 🎯 Roadmap

### Coming Soon
- [ ] Product creation modal
- [ ] Edit inventory interface
- [ ] Customer add/edit modal
- [ ] Customer ledger view
- [ ] Product rate list modal
- [ ] Advance/Udhar management
- [ ] Advance order booking
- [ ] Customer relations tab
- [ ] Receipt printing
- [ ] Barcode scanner support
- [ ] Thermal printer integration

## 📄 License

Proprietary - MilkRecord

---

**Built with ❤️ for Indian Dairy Shops**
