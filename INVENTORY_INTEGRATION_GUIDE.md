# 🏪 Store Inventory & Stock Management - Complete Guide

## 📋 **For Hala Asaad - Store Owner Requirements**

---

## 🎯 **What Store Owners Need:**

1. **Enter products they bought** (quantity + purchase price)
2. **Track what they sold** (quantity + selling price)
3. **Know current stock** (what's left in shop)
4. **Calculate profit** (selling price - purchase price)

---

## 🔄 **Complete Workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│                    STORE OWNER FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. PURCHASE PRODUCTS
   └─> Go to Inventory Page
   └─> Enter: Product name, Quantity, Purchase Price
   └─> Example: "Biscuits, 10 boxes, ₹50/box"
   └─> Stock increases: +10 boxes

2. COLLECT PRODUCTS (Optional)
   └─> Go to Collection Page
   └─> Can collect: Milk OR Other Products
   └─> Example: "Milk 50L @ ₹60/L" or "Paneer 5kg @ ₹300/kg"
   └─> Stock increases: +50L milk or +5kg paneer

3. CONVERT PRODUCTS (Optional)
   └─> Milk → Paneer/Ghee/etc.
   └─> Example: 10L milk → 1kg paneer
   └─> Milk stock: -10L, Paneer stock: +1kg

4. SELL PRODUCTS
   └─> Go to POS (Collection) Page
   └─> Select product, enter quantity
   └─> Example: "3 boxes biscuits @ ₹70/box"
   └─> Stock decreases: -3 boxes
   └─> Profit recorded: ₹70 - ₹50 = ₹20/box

5. VIEW REPORTS
   └─> Go to Stock & Profit Report
   └─> See: Purchased, Sold, In Stock, Profit
```

---

## 📊 **Data Flow:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  INVENTORY   │────▶│  COLLECTION  │────▶│     POS      │
│  (Purchase)  │     │   (Milk +    │     │    (Sales)   │
│              │     │   Products)  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    STOCK DATA                            │
│  mr_inventory + milkbook_data.inventory                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              STOCK & PROFIT REPORT                       │
│  Shows: Purchased - Sold = In Stock + Profit            │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 **How to Use Each Page:**

### **1. Inventory Page** (`/inventory.html`)

**Purpose:** Record products you bought from suppliers

**Steps:**
1. Select item (or click "Add" to create new)
2. Select action: Purchase / Sale / Consumption / Wastage
3. Enter supplier name
4. Enter quantity
5. Enter rate (₹ per unit)
6. Click "Update Stock"

**Example:**
```
Item: Biscuits
Action: Purchase
Supplier: Mumbai Traders
Quantity: 10
Rate: ₹50
Total: ₹500

→ Stock: +10 boxes
→ Cost: ₹50/box
```

---

### **2. Collection Page** (`/collection.html`)

**Purpose:** Record milk collection from farmers OR add products to stock

**For Milk:**
1. Select farmer
2. Enter liters, fat%, SNF
3. System calculates rate automatically
4. Stock: +Liters milk

**For Products:**
1. Select product from dropdown
2. Enter quantity
3. Enter rate
4. Stock: +Quantity product

**Example:**
```
Farmer: Ram Singh
Liters: 50L
Fat: 4.0%
Rate: ₹60/L
Total: ₹3,000

→ Milk Stock: +50L
→ Cost: ₹60/L
```

---

### **3. POS Demo Page** (`/pos-demo.html`)

**Purpose:** Sell products to customers

**Steps:**
1. Click product card (or search)
2. Quantity auto-adds to cart
3. Adjust quantity if needed
4. Select customer (or "Walking Customer")
5. Click payment method (Cash/UPI/Credit)
6. Stock: -Quantity sold

**Example:**
```
Product: Biscuits
Sold: 3 boxes @ ₹70
Total: ₹210

→ Stock: -3 boxes
→ Revenue: ₹210
→ Profit: ₹210 - (3 × ₹50) = ₹60
```

---

### **4. Stock & Profit Report** (`/stock-profit-report.html`)

**Purpose:** See complete stock position and profit

**Shows:**
- **Total Purchased:** ₹ value of all products bought
- **Total Sold:** ₹ value of all products sold
- **Current Stock:** ₹ value of unsold items
- **Total Profit:** Revenue - Cost

**Product Table:**
| Column | Meaning |
|--------|---------|
| Product | Item name |
| Purchased | Quantity bought |
| Sold | Quantity sold |
| In Stock | Purchased - Sold |
| Buy Price | Average cost per unit |
| Sell Price | Average selling price |
| Profit | ₹ earned on this product |
| Status | In Stock / Low / Out |

**Example Output:**
```
Product: Biscuits
├─ Purchased: 10 boxes @ ₹50 = ₹500
├─ Sold: 3 boxes @ ₹70 = ₹210
├─ In Stock: 7 boxes (₹350 value)
├─ Profit: ₹60 (28.6% margin)
└─ Status: ✅ In Stock
```

---

## 💡 **Key Formulas:**

```
In Stock = Purchased Quantity - Sold Quantity

Stock Value = In Stock × Purchase Price

Profit = (Sold Quantity × Sell Price) - (Sold Quantity × Purchase Price)

Profit Margin = (Profit / Revenue) × 100
```

---

## 📱 **Access URLs:**

| Page | URL | Purpose |
|------|-----|---------|
| **Inventory** | https://milkrecord.in/inventory.html | Record purchases |
| **Collection** | https://milkrecord.in/collection.html | Milk + product collection |
| **POS** | https://milkrecord.in/pos-demo.html | Sell products |
| **Stock Report** | https://milkrecord.in/stock-profit-report.html | View stock + profit |
| **Sales Report** | https://milkrecord.in/reports-dashboard.html | Sales analytics |

---

## 🔧 **Integration Notes:**

### **Data Storage:**

All data is saved to browser's localStorage:

```javascript
// Inventory (Purchases)
- mr_inventory
- milkbook_data.inventory

// Sales
- mr_sales_history
- mr_pos_sales
- mr_pos_history
- milkbook_data.sales

// Stock Report reads from ALL sources
```

### **Auto-Sync:**

Stock report automatically combines data from all sources, so it doesn't matter where you enter data - the report will show complete picture.

---

## ✅ **Checklist for Store Owners:**

- [ ] Enter all purchased products in Inventory
- [ ] Record milk collection in Collection page
- [ ] Sell products via POS page
- [ ] Check Stock & Profit Report daily
- [ ] Review low stock alerts
- [ ] Export report for accountant (CSV)

---

## 📞 **Support:**

For questions about:
- **How to enter purchases** → Use Inventory page
- **How to record milk** → Use Collection page
- **How to sell** → Use POS page
- **How to check profit** → Use Stock & Profit Report

---

**Created for:** Hala Asaad
**Date:** 2026-02-23
**Version:** 1.0
