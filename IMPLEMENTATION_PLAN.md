# MilkRecord Implementation Plan

## Phase 1: Core Extensions (Already Implemented)
- [x] Collection Point Attribution
- [x] Enhanced Entry Proof Model
- [x] Daily Farmer Summary
- [x] Balance Reason Strip
- [x] Entry Detail Drawer
- [x] Image as Proof
- [x] Advance & Deduction
- [x] Hardware Acknowledgment
- [x] Sync & Safety UX

## Phase 2: Missing Feature Classes (Now Implemented)

### 1. Selectable Compliance Mode
- [x] Added compliance profile selection (Private vs FPO/Institutional)
- [x] One-time setup choice, not daily toggle
- [x] Enforces member IDs in FPO mode
- [x] Enables structured logs in FPO mode
- [x] Standardized reports for FPO mode

### 2. Explicit Traceability Objects
- [x] Collection Lot ID (auto-generated per shift)
- [x] Source Entity ID (farmer ID/center ID)
- [x] Quality Snapshot (fat, SNF, temp, reading source)
- [x] Batch linkage functionality
- [x] FSSAI-compliant data model

### 3. Multi-Center Aggregation View
- [x] Read-only centralized view for FPO directors
- [x] Daily procurement per center
- [x] Avg fat per center
- [x] Exception flags
- [x] Web dashboard (read-only, delayed updates)

### 4. NDLM/Pashu Aadhaar Link-Later
- [x] Optional cattle ID field per farmer
- [x] Not required or validated
- [x] Stored but unused currently
- [x] Placeholder hooks for future integration

### 5. Printer-First Trust Artifact
- [x] Thermal printer optimized receipts
- [x] One-tap print functionality
- [x] Offline printing capability
- [x] Idiot-proof pairing

## Implementation Summary

### Data Model Extensions
```javascript
{
  // Existing fields...
  
  // NEW: Compliance Profile
  complianceMode: "private" | "fpo",  // default "private"
  
  // NEW: Traceability Objects
  collectionLotId: "LOT-YYYYMMDD-SHIFT",  // Auto-generated per shift
  sourceEntityId: "farmerId",             // Farmer ID
  qualitySnapshot: {                      // Quality parameters
    fat: number,
    snf: number,
    temp: number,
    readingSource: "auto" | "manual" | "external-photo"
  },
  
  // NEW: NDLM Integration
  cattleId: string | null,                // Optional cattle ID
  
  // NEW: Batch Linkage
  batchId: string | null,                 // For FSSAI compliance
  bmcLinked: boolean,                     // For reconciliation
  bmcBatchId: string | null               // BMC batch reference
}
```

### UI Extensions
- Collection point selector in header
- Compliance mode selector (one-time setup)
- Cattle ID field in farmer form (optional)
- Thermal printer support
- Multi-center aggregation view (accessible via History)

### Navigation
- All new functionality accessible through existing History modal
- No new main screens added
- Maintains single-screen philosophy
- Preserves existing UI flow

### Architecture
- Progressive Web App with offline-first approach
- Service worker for background sync
- IndexedDB for structured data
- Local storage for settings
- Cloudflare R2 for media storage