# Proof & Edit-Trail Handling

## 1. Entry Creation
- **Timestamp**: `recordedAt: Date.now()`
- **Device ID**: `deviceId: "WEB-" + userAgent.substring(0, 10)`
- **Entry Source**: `entrySource: "auto" | "manual" | "external-photo"`
- **Initial Values**: `qty, fat, snf, rate` stored as original values

## 2. Edit Process
1. **Before Edit**: Store original values in `previousValues`
2. **Edit Action**: Update entry with new values
3. **Set Flags**: `edited: true`, `editedAt: Date.now()`
4. **Preserve Proof**: All original data and metadata retained

## 3. Edit Trail Structure
```javascript
{
  // Original entry data
  id: "entry_abc123",
  farmerId: "farmer_def456",
  qty: 12.0,
  fat: 6.2,
  snf: 8.4,
  rate: 49.0,
  
  // Proof fields
  edited: false,
  editedAt: null,
  previousValues: null,
  
  // After edit
  edited: true,
  editedAt: 1644825600000,
  previousValues: {
    qty: 12.0,
    fat: 6.2,
    snf: 8.4,
    rate: 49.0
  },
  
  // New values
  qty: 12.5,  // Changed
  fat: 6.4,   // Changed
  snf: 8.4,   // Unchanged
  rate: 49.0  // Unchanged
}
```

## 4. Display Logic
- **Unedited Entries**: Show normally
- **Edited Entries**: Show "✏️ Sudhara gaya" with timestamp
- **Edit Details**: Available in entry detail drawer
- **Previous Values**: Shown as "Old → New" format

## 5. Audit Trail
- **All Changes Logged**: Every edit preserved
- **Non-destructive**: Original values never lost
- **Timestamped**: When edit occurred
- **User Identified**: Who made the change (when possible)

## 6. Conflict Resolution
- **Last Write Wins**: Most recent edit takes precedence
- **Proof Preserved**: All edit trails maintained
- **Manual Review**: For critical disputes

## 7. Data Integrity
- **Immutable Originals**: Original values never modified
- **Chain of Custody**: Complete edit history maintained
- **Verification**: All changes traceable to source

## 8. UI Indicators
- **Table View**: Small edit icon with timestamp
- **Detail View**: Full edit history with before/after values
- **Receipts**: "Auto entry • Edited once • 6:42 AM"
- **WhatsApp Messages**: Include edit status when relevant

## 9. Privacy Considerations
- **Minimal Disclosure**: Only necessary edit info shown
- **Farmer-Friendly**: No technical jargon
- **Trust Building**: Clear, honest edit disclosure
- **Dispute Resolution**: Complete proof trail available

## 10. Recovery Process
- **Undo Capability**: Recent edits can be reverted
- **Backup Preservation**: All edit history backed up
- **Export Ready**: Edit trails included in exports
- **Audit Compliant**: Meets regulatory requirements