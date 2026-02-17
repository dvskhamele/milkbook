# MilkRecord Extended Data Schema Updates

## Updated Entry Schema
```javascript
{
  // Existing fields
  id: string,
  farmerId: string,
  farmerName: string,
  qty: number,
  fat: number,
  snf: number,
  animal: "cow" | "buffalo",
  rateMode: "auto" | "manual",
  ratePerL: number,
  amount: number,
  before: number,
  after: number,
  session: string,
  createdAt: number,
  day: string,
  
  // NEW: Extended proof fields (MANDATORY)
  collectionPointId: string,
  collectionPointName: string,
  entrySource: "auto" | "manual" | "external-photo",
  deviceId: string,
  recordedAt: number,
  edited: boolean,
  editedAt: number | null,
  previousValues: {
    qty: number,
    fat: number,
    snf: number,
    rate: number
  } | null,
  slipNumber: string | null,
  bmcLinked: boolean,
  bmcBatchId: string | null,
  images: string[], // base64 encoded image data
  
  // Existing fields (continued)
  images: string[],
  edited: boolean,
  editedAt: null
}
```

## New Collections
```javascript
// Collection Points
{
  id: string,
  name: string,
  active: boolean
}

// Dispatch Records
{
  dispatchId: string,
  collectionPointId: string,
  date: string,
  shift: string,
  totalMilkSent: number,
  destination: "dairy" | "bmc",
  recordedAt: number,
  deviceId: string,
  notes: string
}

// Adjustment Log
{
  id: string,
  farmerId: string,
  farmerName: string,
  type: "advance_given" | "advance_cut",
  amount: number,
  note: string,
  date: string,
  time: string,
  recordedAt: number
}
```