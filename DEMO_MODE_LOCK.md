# 🧪 Demo Mode Lock Behavior

## Overview

MilkRecord uses a **soft lock** system for trial users:
- **Never blocks billing** (core function always works)
- **Limits historical access** (creates upgrade pressure)
- **Shows value clearly** (users see what they're missing)

---

## Trial Period Logic

### Day 0-30: Full Trial
```javascript
const trialDays = 30;
const daysRemaining = trialDays - daysSinceSignup;

if (daysRemaining > 0) {
  // Full access to all features
  showFeature('monthly_sheet');
  showFeature('export');
  showFeature('whatsapp_reminders');
  showFeature('unlimited_history');
}
```

### Day 31+: Free Continuation (Limited)
```javascript
if (daysRemaining <= 0 && !isPaid) {
  // Continue billing but limit features
  limitHistoryTo(3); // Only 3 days visible
  hideFeature('export');
  hideFeature('monthly_sheet');
  hideFeature('whatsapp_reminders');
  showUpgradePrompt();
}
```

---

## Feature Availability Matrix

| Feature | Trial (0-30 days) | Paid (Standard) | Free Continuation (31+ days) |
|---------|-------------------|-----------------|------------------------------|
| **Billing** | ✅ Full | ✅ Full | ✅ Full |
| **Udhar Tracking** | ✅ Full | ✅ Full | ✅ Full |
| **History Visible** | ✅ 30 days | ✅ Unlimited | ⚠️ 3 days only |
| **Search History** | ✅ 30 days | ✅ Unlimited | ⚠️ 3 days only |
| **CSV Export** | ❌ Locked | ✅ Full | ❌ Locked |
| **Monthly Sheet** | ❌ Locked | ✅ Full | ❌ Locked |
| **Milkman Sheet** | ❌ Locked | ✅ Full | ❌ Locked |
| **WhatsApp Reminders** | ❌ Locked | ✅ Full | ❌ Locked |
| **Aging Report** | ❌ Locked | ✅ Full | ❌ Locked |
| **Backup Download** | ❌ Locked | ✅ Full | ❌ Locked |
| **Customer Summary** | ❌ Locked | ✅ Full | ❌ Locked |

---

## Upgrade Prompts (Non-Intrusive)

### Prompt 1: Day 3
**Trigger:** User completes 10+ bills
```
🎉 You've billed 10 customers!

Want to download your first Weekly Milk Sheet?
Upgrade to Standard to unlock:
✅ Monthly settlement sheets
✅ Customer milk summaries
✅ CSV export

[View Pricing] [Maybe Later]
```

### Prompt 2: Day 7
**Trigger:** End of first week
```
📊 Week 1 Complete!

View your Weekly Summary:
- Total sales: ₹XX,XXX
- Cash collected: ₹XX,XXX
- Udhar given: ₹X,XXX

Upgrade to unlock detailed reports:
[View Summary] [Upgrade Now]
```

### Prompt 3: Day 10
**Trigger:** Before month-end
```
⏰ Month-End Approaching!

Confirm customer balances before month closes:
- Send balance confirmations via WhatsApp
- Download monthly settlement sheet
- Generate milkman delivery sheet

Upgrade to Standard: ₹2000/year
[Upgrade Now] [Remind Later]
```

### Prompt 4: Day 25
**Trigger:** 5 days before trial ends
```
⚠️ Trial Ends in 5 Days!

Don't lose access to:
- 30 days of transaction history
- Monthly dairy sheets
- Customer summaries
- CSV exports

Continue with full access:
[Upgrade to Standard - ₹2000/year] [Continue with Limited Features]
```

### Prompt 5: Day 31 (Trial Expired)
**Trigger:** Trial period ends
```
🔒 Trial Period Ended

You can continue billing with:
✅ Unlimited billing forever
✅ 3-day transaction history
✅ Basic udhar tracking

Upgrade to Standard for:
✅ Unlimited history
✅ Monthly sheets
✅ CSV export
✅ WhatsApp reminders

[Continue with Free Plan] [Upgrade to Standard]
```

---

## History Access Logic

### Free Continuation (31+ days)
```javascript
function getHistoryAccess() {
  if (isPaid) {
    return { days: 365, message: 'Full 1-year history' };
  } else if (daysSinceSignup <= 30) {
    return { days: 30, message: 'Trial: 30-day history' };
  } else {
    return { days: 3, message: 'Free: 3-day history (Upgrade for more)' };
  }
}

// In history modal
const access = getHistoryAccess();
if (requestedDate < cutoffDate) {
  showBlurOverlay();
  showUpgradePrompt('Upgrade to view older transactions');
}
```

---

## Export Lock Behavior

### CSV Export Button State
```javascript
function renderExportButton() {
  if (isPaid) {
    return `<button onclick="exportCSV()">⬇️ Export CSV</button>`;
  } else if (daysSinceSignup <= 30) {
    return `<button disabled title="Available in Standard plan">🔒 Export CSV</button>`;
  } else {
    return `<button disabled title="Upgrade to export data">🔒 Export CSV</button>`;
  }
}
```

### When User Clicks Locked Feature
```javascript
function onLockedFeatureClick(feature) {
  const upgradeModal = {
    title: 'Available in Standard Plan',
    message: getFeatureMessage(feature),
    price: '₹2000/year',
    features: [
      'Unlimited transaction history',
      'Monthly dairy settlement sheet',
      'Customer milk summaries',
      'CSV/Excel export',
      'WhatsApp balance reminders',
      '1-year backup download'
    ],
    buttons: [
      { text: 'View Pricing', action: 'pricing' },
      { text: 'Maybe Later', action: 'close' }
    ]
  };
  showModal(upgradeModal);
}
```

---

## Dependency Creation Elements

### Week 1 Onboarding Flow

**Day 1:** Welcome
```
👋 Welcome to MilkRecord!

Your dairy shop's financial control system.
Start billing in 30 seconds.

[Get Started] [Watch Tutorial]
```

**Day 3:** First Achievement
```
🎉 Great Start!

You've billed 10 customers this week.

Tip: Upgrade to download your first
Weekly Milk Sheet and share with customers.

[View Weekly Sheet] [Keep Billing]
```

**Day 7:** Weekly Summary Teaser
```
📊 Week 1 Summary

This week:
- Sales: ₹{{total}}
- Customers: {{count}}
- Udhar: ₹{{udhar}}

Upgrade to unlock detailed reports
and customer summaries.

[View Summary] [Upgrade Now]
```

**Day 10:** Month-End Prep
```
⏰ Month-End in 20 Days!

Prepare for month-end with:
✅ Customer balance confirmations
✅ Monthly settlement sheet
✅ Milkman delivery summary

Upgrade to Standard: ₹2000/year

[Upgrade Now] [Remind Tomorrow]
```

**Day 25:** Trial Ending
```
⚠️ Trial Ends in 5 Days

Don't lose your data!
Upgrade to keep:
- 30 days of history
- Monthly sheets
- Customer summaries

[Upgrade - ₹2000/year] [Continue Free (Limited)]
```

---

## Visual Indicators

### Trial Badge (Top Bar)
```html
<div class="trial-badge" id="trialBadge">
  🎁 Trial: {{daysRemaining}} days left
  <button onclick="upgrade()">Upgrade</button>
</div>
```

### Expired Badge (Top Bar)
```html
<div class="expired-badge" id="expiredBadge">
  🔒 Free Plan (3-day history)
  <button onclick="upgrade()">Upgrade to Standard</button>
</div>
```

### Locked Feature Styling
```css
.feature-locked {
  opacity: 0.5;
  pointer-events: none;
  position: relative;
}

.feature-locked::after {
  content: '🔒 Standard Plan';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
}
```

---

## Upgrade Conversion Optimization

### Pricing Page Triggers
- Show "Most Popular" badge on Standard plan
- Display "₹167/month" (₹2000/12) to make price seem smaller
- Show comparison table with checkmarks
- Include testimonials from dairy owners
- Add "30-day money-back guarantee"

### In-App Upgrade Prompts
- Trigger after positive actions (successful billing)
- Show value, not features
- Use dairy-specific language ("Monthly Milk Sheet" not "Reports")
- Always provide "Maybe Later" option (no forced upgrades)

### Exit Intent (Free Continuation)
When user tries to access locked feature:
```
📊 This Feature Requires Standard Plan

Get unlimited access to:
✅ Monthly dairy sheets
✅ Customer milk summaries  
✅ CSV export
✅ WhatsApp reminders
✅ 1-year history

₹2000/year (₹167/month)

[Upgrade Now] [Continue with Free Plan]
```

---

## Implementation Checklist

- [ ] Trial counter (30 days from first use)
- [ ] Feature gating logic
- [ ] History access control (3-day limit after trial)
- [ ] Export lock (CSV/PDF)
- [ ] Monthly sheet lock
- [ ] WhatsApp reminder lock
- [ ] Upgrade prompt triggers (Day 3, 7, 10, 25, 31)
- [ ] Trial badge in top bar
- [ ] Locked feature styling
- [ ] Upgrade modal
- [ ] Pricing page integration
- [ ] Payment integration (Razorpay/PayU)
- [ ] Receipt generation
- [ ] Plan activation logic
- [ ] Downgrade logic (paid → free)

---

## Key Principles

1. **Never block billing** - Core function always works
2. **Show value clearly** - Users see what they're missing
3. **Create dependency** - Monthly sheets become essential
4. **Gentle pressure** - Prompts, not popups
5. **Fair free tier** - Can continue forever, just limited
6. **Dairy-specific** - Language matches dairy shop owners

---

**This lock behavior creates natural upgrade pressure without frustrating users.**
