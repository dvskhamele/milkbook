# MilkBook Subscription & Module System

## 🎯 Overview

**Business Model:**
- 1 month FREE trial
- After trial: ₹2000/year (advance payment)
- Future: Paid modules (Cheque, Loan, ServiceTrack, etc.)

**Key Principles:**
- Data is NEVER deleted
- Login is NEVER blocked
- Read access is ALWAYS allowed
- Write access requires active subscription
- Module access requires module enabled

---

## 📊 Database Schema

### Core Tables

#### 1. **subscriptions**
```sql
- id (UUID)
- shop_id (UUID, FK to shops)
- plan_type (TEXT) -- 'trial', 'annual'
- status (TEXT) -- 'active', 'expired', 'cancelled'
- trial_start (TIMESTAMP)
- trial_end (TIMESTAMP)
- paid_start (TIMESTAMP)
- paid_end (TIMESTAMP)
- amount_paid (INTEGER) -- in paise (₹2000 = 200000)
- created_at, updated_at
```

#### 2. **billing_events**
```sql
- id (UUID)
- shop_id (UUID, FK)
- type (TEXT) -- 'trial_started', 'payment_received', 'expired'
- amount (INTEGER) -- in paise
- reference (TEXT)
- metadata (JSONB)
- created_at
```

#### 3. **modules**
```sql
- id (TEXT, PK) -- 'retail_pos', 'farmer_collection', 'cheque', etc.
- name (TEXT)
- description (TEXT)
- price (INTEGER) -- annual price in paise
- is_active (BOOLEAN)
- created_at
```

#### 4. **shop_modules**
```sql
- shop_id (UUID, FK)
- module_id (TEXT, FK)
- enabled (BOOLEAN)
- activated_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- PRIMARY KEY (shop_id, module_id)
```

---

## 🔐 Subscription States

| State | Write Access | Read Access | Login |
|-------|-------------|-------------|-------|
| Trial Active | ✅ | ✅ | ✅ |
| Annual Active | ✅ | ✅ | ✅ |
| Expired | ❌ | ✅ | ✅ |
| Cancelled | ❌ | ✅ | ✅ |

**Never block login or read access.**

---

## 📦 Module System

### Base Modules (Included Free)

1. **retail_pos** - Point of sale for dairy shop
2. **farmer_collection** - Milk collection from farmers
3. **export** - Export data to CSV/Excel
4. **reports** - Daily and monthly reports

### Future Paid Modules

1. **cheque** - Track cheque payments (₹500/year)
2. **loan** - Manage loans and advances (₹500/year)
3. **servicetrack** - Equipment maintenance (₹750/year)
4. **advanced_reports** - Detailed analytics (₹1000/year)
5. **multi_user** - Multiple cashiers/users (₹500/year)

---

## 🛡️ API Enforcement

### Middleware Functions

#### 1. `requireActiveSubscription()`
```javascript
const subscription = await checkSubscription(shop_id);
if (!subscription.active) {
  return {
    statusCode: 403,
    body: JSON.stringify({
      error: 'Subscription expired',
      upgrade_required: true
    })
  };
}
```

#### 2. `requireModuleEnabled(module_id)`
```javascript
const module = await checkModule(shop_id, 'retail_pos');
if (!module.enabled) {
  return {
    statusCode: 403,
    body: JSON.stringify({
      error: 'Module not enabled',
      module_required: 'retail_pos'
    })
  };
}
```

### API Flow

```
POST /api/farmers
    ↓
1. Get shop_id from JWT token
    ↓
2. Check subscription active?
    ↓ NO → 403 Forbidden (upgrade_required: true)
    ↓ YES
3. Check module enabled?
    ↓ NO → 403 Forbidden (module_required: 'farmer_collection')
    ↓ YES
4. Create farmer
    ↓
5. Return success
```

---

## 🚀 Usage Examples

### Check Subscription Status

```javascript
const response = await fetch('/.netlify/functions/subscription', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { subscription, modules } = await response.json();

// subscription.status: 'active', 'expired', 'cancelled'
// subscription.plan_type: 'trial', 'annual'
// modules: [{ id, name, enabled, price }]
```

### Upgrade to Annual Plan

```javascript
const response = await fetch('/.netlify/functions/subscription/upgrade', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 200000 }) // ₹2000 in paise
});

const { subscription_id } = await response.json();
```

### Enable Module

```javascript
const response = await fetch('/.netlify/functions/subscription/module/enable', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ module_id: 'cheque' })
});
```

### Get Available Modules

```javascript
const response = await fetch('/.netlify/functions/subscription/modules', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { modules } = await response.json();
// modules: [{ id, name, description, price, enabled }]
```

---

## 📝 Trial Logic

### Auto-Create Trial (On New Shop)

```sql
-- Trigger automatically creates 30-day trial
CREATE TRIGGER trigger_auto_trial_subscription
    AFTER INSERT ON shops
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_trial_subscription();
```

**Trial Details:**
- Duration: 30 days from shop creation
- All base modules enabled
- Full write access
- Auto-expires after 30 days

### Trial Expiration

```sql
-- Function checks expiration
SELECT is_subscription_active(shop_id);
-- Returns: TRUE if active, FALSE if expired
```

**After Expiration:**
- Status changes to 'expired'
- Write access blocked
- Read access remains
- Upgrade prompt shown

---

## 💰 Annual Plan

### Upgrade Process

```sql
-- Upgrade to annual plan
SELECT upgrade_to_annual(shop_id, amount_in_paise);
```

**Annual Plan Details:**
- Duration: 365 days from payment
- Price: ₹2000 (200000 paise)
- All base modules included
- Can purchase additional modules

### Payment Recording

```sql
-- Log payment event
INSERT INTO billing_events (shop_id, type, amount, reference)
VALUES (shop_id, 'payment_received', 200000, 'Annual plan upgrade');
```

---

## 🔒 Security (RLS)

### Row Level Security Policies

```sql
-- Users can only see their shop's subscription
CREATE POLICY subscriptions_shop_select ON subscriptions
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can only see their shop's modules
CREATE POLICY shop_modules_shop_select ON shop_modules
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );
```

---

## 🧪 Testing

### Create Test Shop with Trial

```sql
-- Create shop (trial auto-created by trigger)
INSERT INTO shops (id, name, location)
VALUES ('test-shop-001', 'Test Dairy', 'Test Location');

-- Check subscription
SELECT * FROM subscriptions WHERE shop_id = 'test-shop-001';
-- Should show: plan_type='trial', status='active', trial_end=NOW()+30days
```

### Test Expiration

```sql
-- Manually expire trial for testing
UPDATE subscriptions 
SET status = 'expired', trial_end = NOW() - INTERVAL '1 day'
WHERE shop_id = 'test-shop-001';

-- Test API (should return 403)
-- POST /api/farmers
-- Response: { error: 'Subscription expired', upgrade_required: true }
```

### Test Module Access

```sql
-- Disable module
UPDATE shop_modules 
SET enabled = FALSE 
WHERE shop_id = 'test-shop-001' AND module_id = 'farmer_collection';

-- Test API (should return 403)
-- POST /api/farmers
-- Response: { error: 'Module not enabled', module_required: 'farmer_collection' }
```

---

## 📊 Helper Functions

### `is_subscription_active(shop_id)`
Returns TRUE if subscription is active, FALSE if expired.

### `is_module_enabled(shop_id, module_id)`
Returns TRUE if module is enabled for shop.

### `create_trial_subscription(shop_id)`
Creates 30-day trial subscription for new shop.

### `upgrade_to_annual(shop_id, amount)`
Upgrades shop to annual plan.

### `enable_shop_module(shop_id, module_id, expires_at)`
Enables module for shop.

### `disable_shop_module(shop_id, module_id)`
Disables module for shop.

---

## 🎯 Future Integration

### Adding New Module

```sql
-- 1. Add to modules table
INSERT INTO modules (id, name, description, price)
VALUES ('ai_reports', 'AI-Powered Reports', 'Advanced AI analytics', 150000);

-- 2. Enable for shops (if free trial)
INSERT INTO shop_modules (shop_id, module_id, enabled)
SELECT id, 'ai_reports', TRUE FROM shops;
```

**No schema changes required!**

### Module Pricing Tiers

```sql
-- Free module (price = 0)
UPDATE modules SET price = 0 WHERE id = 'reports';

-- Paid module (price in paise)
UPDATE modules SET price = 50000 WHERE id = 'cheque'; -- ₹500/year
```

---

## 📞 Support

### Check Subscription Status

```javascript
// Frontend check
const { subscription } = await window.MilkBookAPI.subscription.getStatus();

if (subscription.status === 'expired') {
  showUpgradePrompt();
}
```

### Handle Upgrade

```javascript
// On upgrade success
await window.MilkBookAPI.subscription.upgrade(200000);

// Refresh UI
loadSubscriptionStatus();
```

---

## ✅ Checklist

- [x] Subscription schema created
- [x] Module system implemented
- [x] RLS policies added
- [x] Helper functions created
- [x] API middleware implemented
- [x] Auto-trial trigger added
- [x] Upgrade function added
- [x] Documentation complete

---

**System is ready for production! 🚀**
