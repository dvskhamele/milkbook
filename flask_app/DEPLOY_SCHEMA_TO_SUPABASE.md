# 🚀 Deploy Schema to Supabase - Step by Step

## **📋 SCHEMA TO DEPLOY:**

**File:** `flask_app/ADDITIVE_INVENTORY_RECONCILIATION_SCHEMA.sql`

This schema adds **7 new tables** and **5 ledger views** without removing any existing tables.

---

## **🔧 DEPLOYMENT STEPS:**

### **Step 1: Open Supabase Dashboard**

Go to:
```
https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar
```

### **Step 2: Open SQL Editor**

Click **SQL Editor** in left sidebar → **New Query**

### **Step 3: Copy Schema File**

1. Open: `flask_app/ADDITIVE_INVENTORY_RECONCILIATION_SCHEMA.sql`
2. Select All (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)

### **Step 4: Paste & Run**

1. Paste in SQL Editor
2. Click **Run** button (or Ctrl+Enter)
3. Wait for completion

### **Step 5: Verify Deployment**

You should see:
```
✅ Complete Inventory & Reconciliation Schema Deployed (ADDITIVE)
new_tables_created: 6
ledger_views_created: 5
```

---

## **📊 TABLES CREATED:**

### **1. inventory_current**
Real-time stock tracking
```sql
- id (UUID)
- shop_id (UUID)
- item_type (TEXT) - milk_cow, milk_buff, paneer, curd, ghee, etc.
- quantity (DECIMAL)
- unit (TEXT) - L, kg, g, ml
- last_updated (TIMESTAMPTZ)
```

### **2. inventory_movements**
Complete audit trail
```sql
- id (UUID)
- shop_id (UUID)
- shift_id (UUID)
- movement_type (TEXT) - collection, conversion_in, conversion_out, sale, waste, adjustment
- direction (TEXT) - IN, OUT
- item_type (TEXT)
- quantity (DECIMAL)
- unit (TEXT)
- reference_type (TEXT)
- reference_id (UUID)
- batch_number (TEXT)
- notes (TEXT)
- created_by (TEXT)
- created_at (TIMESTAMPTZ)
```

### **3. production_batches**
Enhanced production tracking
```sql
- id (UUID)
- shop_id (UUID)
- shift_id (UUID)
- batch_number (TEXT)
- from_item_type (TEXT) - milk_cow, milk_buff, paneer, etc.
- from_quantity (DECIMAL)
- from_unit (TEXT)
- to_item_type (TEXT) - paneer, ghee, curd, sweets, etc.
- to_quantity (DECIMAL)
- to_unit (TEXT)
- conversion_ratio (DECIMAL)
- expected_ratio (DECIMAL)
- variance_percent (DECIMAL)
- yield_efficiency (DECIMAL)
- avg_fat (DECIMAL)
- avg_snf (DECIMAL)
- waste_percent (DECIMAL)
- quality_grade (TEXT) - A, B, C
- operator_name (TEXT)
- notes (TEXT)
- status (TEXT) - completed, cancelled, flagged
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### **4. shift_reconciliation**
Variance detection
```sql
- id (UUID)
- shop_id (UUID)
- shift_id (UUID)
- shift_date (DATE)
- shift_name (TEXT) - morning, evening
- milk_opening (DECIMAL)
- milk_collected (DECIMAL)
- milk_converted (DECIMAL)
- milk_sold_raw (DECIMAL)
- milk_waste (DECIMAL)
- milk_expected_closing (DECIMAL)
- milk_actual_closing (DECIMAL)
- milk_variance (DECIMAL)
- milk_variance_percent (DECIMAL)
- product_opening (DECIMAL)
- product_produced (DECIMAL)
- product_sold (DECIMAL)
- product_waste (DECIMAL)
- product_expected_closing (DECIMAL)
- product_actual_closing (DECIMAL)
- product_variance (DECIMAL)
- product_variance_percent (DECIMAL)
- cash_opening (DECIMAL)
- cash_sales (DECIMAL)
- cash_other_in (DECIMAL)
- cash_expenses (DECIMAL)
- cash_expected_closing (DECIMAL)
- cash_actual_closing (DECIMAL)
- cash_variance (DECIMAL)
- cash_variance_percent (DECIMAL)
- status (TEXT) - pending, reconciled, variance_detected
- reconciled_by (TEXT)
- reconciled_at (TIMESTAMPTZ)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
```

### **5. farmer_yield_analytics**
Profitability tracking
```sql
- id (UUID)
- farmer_id (UUID)
- farmer_name (TEXT)
- shop_id (UUID)
- analysis_date (DATE)
- shift_name (TEXT)
- total_quantity (DECIMAL)
- avg_fat (DECIMAL)
- avg_snf (DECIMAL)
- total_amount (DECIMAL)
- paneer_yield_per_liter (DECIMAL)
- ghee_yield_per_liter (DECIMAL)
- curd_yield_per_liter (DECIMAL)
- profit_per_liter (DECIMAL)
- cost_per_liter (DECIMAL)
- quality_score (DECIMAL) - 0-100
- quality_grade (TEXT) - A, B, C
- recommendation (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### **6. waste_tracking**
Spoilage management
```sql
- id (UUID)
- shop_id (UUID)
- shift_id (UUID)
- waste_type (TEXT) - milk, product
- item_type (TEXT)
- quantity (DECIMAL)
- unit (TEXT)
- reason (TEXT) - spoiled, damaged, expired, other
- notes (TEXT)
- cost_amount (DECIMAL)
- approved_by (TEXT)
- approved_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

---

## **📊 VIEWS CREATED:**

### **1. milk_ledger**
All milk movements

### **2. production_ledger**
All production batches

### **3. inventory_ledger**
Current stock + movements

### **4. sales_ledger**
All sales with payment mode

### **5. cash_credit_ledger**
Cash flow tracking

---

## **✅ VERIFICATION:**

After deployment, run this in SQL Editor:

```sql
SELECT 
    table_name,
    '✅ Created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'inventory_current',
    'inventory_movements',
    'production_batches',
    'shift_reconciliation',
    'farmer_yield_analytics',
    'waste_tracking'
)
ORDER BY table_name;
```

**Expected Output:**
```
table_name             | status
-----------------------|---------
farmer_yield_analytics | ✅ Created
inventory_current      | ✅ Created
inventory_movements    | ✅ Created
production_batches     | ✅ Created
shift_reconciliation   | ✅ Created
waste_tracking         | ✅ Created
```

---

## **🔧 NEXT STEPS:**

### **1. Initialize Inventory Current**

Run this to set up initial stock (all zeros):

```sql
INSERT INTO inventory_current (shop_id, item_type, quantity, unit)
VALUES 
    (NULL, 'milk_cow', 0, 'L'),
    (NULL, 'milk_buff', 0, 'L'),
    (NULL, 'paneer', 0, 'kg'),
    (NULL, 'curd', 0, 'kg'),
    (NULL, 'ghee', 0, 'kg'),
    (NULL, 'butter', 0, 'kg'),
    (NULL, 'sweets', 0, 'kg')
ON CONFLICT (shop_id, item_type) DO NOTHING;
```

### **2. Test in POS**

1. Open POS page
2. Click 🔄 Milk→Product
3. Click any of the **5 Ledger buttons**
4. Should show modal with entries

---

## **📋 INTEGRATION WITH EXISTING:**

This schema is **ADDITIVE ONLY**:
- ✅ Does NOT remove any existing tables
- ✅ Does NOT modify existing ledgers
- ✅ Works alongside existing sync-engine
- ✅ Compatible with existing storage
- ✅ Enhances with new features

---

## **🎯 BENEFITS:**

### **For User:**
- ✅ Auto production suggestions
- ✅ View 5 ledgers instantly
- ✅ Shift reconciliation
- ✅ Theft detection
- ✅ Yield analytics

### **For System:**
- ✅ Complete audit trail
- ✅ Real-time inventory
- ✅ Movement tracking
- ✅ Variance detection
- ✅ Profitability analytics

---

## **🚀 DEPLOY NOW:**

1. **Open:** https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql
2. **Copy:** `flask_app/ADDITIVE_INVENTORY_RECONCILIATION_SCHEMA.sql`
3. **Paste & Run**
4. **Verify** tables created
5. **Test** in POS

---

**Schema is ready to deploy!** 🎉
