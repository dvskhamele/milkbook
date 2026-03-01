# 🧩 Collection Page - Production Modules Integration Guide

## **✅ New Modules Added (All Additive)**

---

## **📁 Module Structure**

```
js/
├── session-context.js      ← Global session state
├── rate-engine.js          ← Isolated rate calculation
├── ledger-engine.js        ← Append-only ledger
├── transaction-writer.js   ← Atomic transaction saves
└── audit-logger.js         ← Audit trail
```

---

## **🔧 How to Use Each Module**

### **1. Session Context Manager**

**Purpose:** Global session state (date, shift, booth, operator)

**Usage:**
```javascript
// Get current session
const session = window.sessionContext.get();
console.log(session);
// { date: '2026-03-01', shift: 'Morning', booth: 'Default Booth', operator_id: 'operator_1' }

// Update shift
window.sessionContext.setShift('Evening');

// Update booth
window.sessionContext.setBooth('Booth A');

// Full update
window.sessionContext.update({
  shift: 'Morning',
  booth: 'Booth B'
});
```

**Auto-updates:**
- Date changes at midnight
- Shift based on time (Morning < 12PM, Evening >= 12PM)

---

### **2. Rate Engine**

**Purpose:** Isolated rate calculation (never mix with UI)

**Usage:**
```javascript
// Calculate rate
const intake = {
  quantity: 5.5,
  fat: 4.2,
  snf: 8.5,
  animal_type: 'cow',
  rate_override: null  // Set to override auto calculation
};

const result = window.rateEngine.calculate(intake);

console.log(result);
// {
//   rate_per_litre: 30.5,
//   total_amount: 167.75,
//   breakdown: {
//     base_rate: 30,
//     fat_component: 10.5,
//     snf_component: 10.2,
//     quantity: 5.5,
//     calculation_mode: 'auto'
//   },
//   source: 'auto'
// }

// Manual override
const manualIntake = {
  quantity: 5.5,
  rate_override: 35  // Fixed rate
};

const manualResult = window.rateEngine.calculate(manualIntake);
// rate_per_litre: 35, total_amount: 192.5
```

**Custom Formulas:**
```javascript
// Set custom formula for cow
window.rateEngine.setFormula('cow', {
  base: 35,
  fat_factor: 3.0,
  snf_factor: 1.5,
  formula: 'base + (fat * fat_factor)'
});

// Update config
window.rateEngine.updateConfig({
  enableFatBased: true,
  minFat: 2.0,
  maxFat: 8.0
});
```

---

### **3. Ledger Engine**

**Purpose:** Append-only ledger (never trust UI balances)

**Usage:**
```javascript
// Add credit entry (farmer receives money)
await window.ledgerEngine.addEntry('farmer_123', {
  txn_id: 'txn_456',
  type: 'credit',
  credit: 500,
  debit: 0,
  reference: 'collection_txn_789',
  notes: 'Milk collection payment',
  payment_mode: 'cash',
  operator_id: 'operator_1'
});

// Add debit entry (farmer owes money)
await window.ledgerEngine.addEntry('farmer_123', {
  txn_id: 'txn_457',
  type: 'debit',
  credit: 0,
  debit: 200,
  reference: 'advance_payment',
  notes: 'Advance taken',
  payment_mode: 'cash'
});

// Calculate balance (SUM credit - SUM debit)
const balance = await window.ledgerEngine.calculateBalance('farmer_123');
console.log('Farmer balance:', balance);

// Get recent transactions
const transactions = await window.ledgerEngine.getRecentTransactions('farmer_123', 20);
console.log(transactions);
// [
//   {
//     entry_id: 'ledger_xxxxx',
//     date: Date object,
//     type: 'credit',
//     amount: 500,
//     balance: 1500,
//     reference: 'collection_txn_789',
//     payment_mode: 'cash',
//     isSettled: true
//   }
// ]
```

**Key Principle:**
```javascript
// ❌ WRONG (trust UI balance)
farmer.balance = oldBalance + amount;

// ✅ CORRECT (calculate from ledger)
const balance = await window.ledgerEngine.calculateBalance(farmer_id);
```

---

### **4. Transaction Writer**

**Purpose:** Atomic transaction saves (all-or-nothing)

**Usage:**
```javascript
// Save collection entry
const entry = {
  farmer_id: 'F0001',
  farmer_name: 'Ramesh Kumar',
  
  // Session context (auto-filled if not provided)
  date: '2026-03-01',
  shift: 'Morning',
  booth: 'Default Booth',
  operator_id: 'operator_1',
  
  // Intake data
  quantity: 5.5,
  fat: 4.2,
  snf: 8.5,
  animal_type: 'cow',
  
  // Rate calculation
  rate_per_litre: 30.5,
  total_amount: 167.75,
  rate_calculation_mode: 'auto',
  
  // Payment
  payment_mode: 'cash',
  
  // Audit
  machine_mode: 'manual',
  rate_source: 'auto'
};

const result = await window.transactionWriter.save(entry);

if (result.success) {
  console.log('✅ Transaction saved:', result.txn_id);
} else {
  console.error('❌ Save failed:', result.error);
}

// Get today's entries
const todayEntries = await window.transactionWriter.getTodayEntries();

// Get farmer's entries
const farmerEntries = await window.transactionWriter.getFarmerEntries('F0001');

// Get today's summary
const summary = await window.transactionWriter.getTodaySummary();
// {
//   total_liters: 150.5,
//   total_amount: 4500,
//   total_entries: 25,
//   cow_liters: 100,
//   buffalo_liters: 50.5
// }
```

---

### **5. Audit Logger**

**Purpose:** Append-only audit trail (never editable)

**Usage:**
```javascript
// Log action
await window.auditLogger.log('collection_save', {
  entity_type: 'collection',
  entity_id: 'txn_123',
  operator_id: 'operator_1',
  changes: {
    quantity: 5.5,
    fat: 4.2,
    amount: 167.75
  },
  metadata: {
    machine_mode: 'manual',
    rate_source: 'auto'
  }
});

// Get audit trail for entity
const trail = await window.auditLogger.getTrail('collection', 'txn_123');
console.log(trail);
// [
//   {
//     audit_id: 'audit_xxxxx',
//     timestamp: 1234567890,
//     datetime: '2026-03-01T10:30:00Z',
//     action: 'collection_save',
//     operator_id: 'operator_1',
//     entity_type: 'collection',
//     entity_id: 'txn_123',
//     changes: {...},
//     checksum: 'hash_abc123'
//   }
// ]

// Verify integrity
const integrity = await window.auditLogger.verifyIntegrity();
console.log(integrity);
// { valid: true, total: 100, invalid: 0 }
```

---

## **🎯 Complete Integration Example**

### **Save Collection Entry (All Modules Together)**

```javascript
async function saveCollectionEntry() {
  // 1. Get session context
  const session = window.sessionContext.get();
  
  // 2. Get intake data from UI
  const intake = {
    quantity: parseFloat(document.getElementById('quantity').value),
    fat: parseFloat(document.getElementById('fat').value),
    snf: parseFloat(document.getElementById('snf').value),
    animal_type: selectedAnimal,
    rate_override: manualRate || null
  };
  
  // 3. Calculate rate (isolated engine)
  const rateResult = window.rateEngine.calculate(intake);
  
  // 4. Prepare transaction
  const transaction = {
    farmer_id: selectedFarmerId,
    farmer_name: selectedFarmer.name,
    
    // Session context
    date: session.date,
    shift: session.shift,
    booth: session.booth,
    operator_id: session.operator_id,
    
    // Intake
    quantity: intake.quantity,
    fat: intake.fat,
    snf: intake.snf,
    animal_type: intake.animal_type,
    
    // Rate
    rate_per_litre: rateResult.rate_per_litre,
    total_amount: rateResult.total_amount,
    rate_calculation_mode: rateResult.source,
    
    // Payment
    payment_mode: selectedPaymentMode,
    
    // Audit
    machine_mode: 'manual',
    rate_source: rateResult.source
  };
  
  // 5. Save transaction atomically
  const txnResult = await window.transactionWriter.save(transaction);
  
  if (!txnResult.success) {
    alert('Failed to save transaction');
    return;
  }
  
  // 6. Add ledger entry (append-only)
  if (selectedPaymentMode === 'credit') {
    await window.ledgerEngine.addEntry(selectedFarmerId, {
      txn_id: txnResult.txn_id,
      type: 'credit',
      credit: rateResult.total_amount,
      debit: 0,
      reference: txnResult.txn_id,
      notes: 'Milk collection',
      payment_mode: 'credit'
    });
  }
  
  // 7. Log audit
  await window.auditLogger.log('collection_save', {
    entity_type: 'collection',
    entity_id: txnResult.txn_id,
    operator_id: session.operator_id,
    changes: transaction,
    metadata: {
      farmer_name: selectedFarmer.name,
      session: session.shift
    }
  });
  
  // 8. Queue for sync
  if (window.syncEngine) {
    await window.syncEngine.queue('save_milk_collection', {
      ...transaction,
      local_txn_id: txnResult.txn_id
    }, 'high');
  }
  
  // 9. Update UI
  updateBalanceDisplay();
  clearForm();
  
  console.log('✅ Collection saved successfully');
}
```

---

## **📊 Module Communication Flow**

```
User clicks SAVE
    ↓
1. sessionContext.get()
    ↓
2. rateEngine.calculate()
    ↓
3. transactionWriter.save()
    ↓
4. ledgerEngine.addEntry()
    ↓
5. auditLogger.log()
    ↓
6. syncEngine.queue()
    ↓
✅ Complete
```

---

## **🔒 Data Integrity Rules**

### **DO:**
- ✅ Use `ledgerEngine.calculateBalance()` for balances
- ✅ Use `transactionWriter.save()` for atomic saves
- ✅ Log all actions with `auditLogger.log()`
- ✅ Attach session context to every transaction
- ✅ Queue for sync after local save

### **DON'T:**
- ❌ Calculate balances in UI
- ❌ Save partial transactions
- ❌ Skip audit logging
- ❌ Wait for sync before updating UI
- ❌ Modify audit entries

---

## **🧪 Testing**

```javascript
// Test rate engine
const testIntake = { quantity: 5, fat: 4, snf: 8, animal_type: 'cow' };
const rate = window.rateEngine.calculate(testIntake);
console.assert(rate.rate_per_litre > 0, 'Rate should be positive');

// Test ledger
await window.ledgerEngine.addEntry('test_farmer', {
  txn_id: 'test_1',
  type: 'credit',
  credit: 100
});
const balance = await window.ledgerEngine.calculateBalance('test_farmer');
console.assert(balance === 100, 'Balance should be 100');

// Test transaction writer
const txn = await window.transactionWriter.save({
  farmer_id: 'test_farmer',
  quantity: 5,
  total_amount: 150
});
console.assert(txn.success, 'Transaction should save');

// Test audit logger
await window.auditLogger.log('test_action', { test: 'data' });
const trail = await window.auditLogger.getTrail('test_action', 'test_1');
console.assert(trail.length > 0, 'Audit trail should exist');
```

---

## **📈 Performance Tips**

1. **Batch ledger queries:**
   ```javascript
   // ❌ Slow (multiple calls)
   const balance1 = await ledger.calculateBalance(f1);
   const balance2 = await ledger.calculateBalance(f2);
   
   // ✅ Fast (single call)
   const balances = await ledger.calculateBalances([f1, f2]);
   ```

2. **Limit transaction history:**
   ```javascript
   // Get only last 50 entries
   const entries = await transactionWriter.getFarmerEntries(farmer_id, 50);
   ```

3. **Debounce rate calculations:**
   ```javascript
   const debouncedCalc = debounce(() => {
     rateEngine.calculate(intake);
   }, 300);
   
   input.addEventListener('input', debouncedCalc);
   ```

---

## **🎯 Migration Path**

### **Phase 1: Load Modules (Done)**
```html
<script src="../js/rate-engine.js"></script>
<script src="../js/ledger-engine.js"></script>
...
```

### **Phase 2: Use Rate Engine**
Replace inline calculations:
```javascript
// Old
const rate = 30 + (fat * 2.5) + (snf * 1.2);

// New
const rate = window.rateEngine.calculate({fat, snf, animal_type});
```

### **Phase 3: Use Ledger Engine**
Replace balance updates:
```javascript
// Old
farmer.balance += amount;

// New
await window.ledgerEngine.addEntry(farmer_id, {
  type: 'credit',
  credit: amount
});
```

### **Phase 4: Use Transaction Writer**
Atomic saves:
```javascript
await window.transactionWriter.save(entry);
```

### **Phase 5: Add Audit Logging**
```javascript
await window.auditLogger.log('action', details);
```

---

## **✅ Benefits**

| Feature | Before | After |
|---------|--------|-------|
| **Rate Calculation** | Mixed with UI | Isolated engine |
| **Balance Updates** | UI-calculated | Ledger-based |
| **Transaction Saves** | Direct write | Atomic |
| **Audit Trail** | None | Complete |
| **Session Context** | Scattered | Centralized |
| **Data Integrity** | Manual | Guaranteed |

---

## **🚀 Next Steps**

1. **Test each module individually**
2. **Integrate rate engine first**
3. **Add ledger engine**
4. **Use transaction writer**
5. **Enable audit logging**
6. **Monitor performance**

---

**All modules are additive - existing code continues to work!** 🎉
