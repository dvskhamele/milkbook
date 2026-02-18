# MilkRecord UI Flow Descriptions

## Page-by-Page Flow

### Main Collection Screen
- **Header**: Shows shop title, date/session, collection point selector, hardware indicator
- **Farmer Selection**: Grid of farmer cards with search, pagination
- **Input Section**: Qty, Fat, SNF, Animal type, Rate mode, Slip number input
- **Summary Panel**: Amount, old/new balance, recent entries table
- **Footer**: Hold, Save, Undo buttons

### History Modal
- **Today Tab**: Shows today's entries with collection point and slip number
- **Weekly Tab**: Shows last 7 days of entries
- **Center Summary Button**: Opens center summary view
- **Export Button**: Exports data as JSON
- **Clear Today**: Clears today's entries

### Center Summary View
- **Summary Card**: Shows total entries, milk volume, fat range, amount
- **Actions**: Mark milk sent to dairy, share via WhatsApp
- **Access**: From History → Today → Center Summary

### Entry Detail Drawer
- **Access**: Tap on any entry in the history table
- **Content**: Qty, Fat, SNF, Rate, Recorded time, Entry source, Edit status
- **Action**: Send entry proof via WhatsApp

### Farmer Detail Modal
- **Information**: Monthly milk total, current advance
- **Actions**: Give advance, Cut advance with optional note
- **Share**: Send monthly summary via WhatsApp

### Settings Modal
- **Rate Formula**: Cow/buffalo base rates and factors
- **Steps**: Qty, Fat, SNF steps
- **Session Hour**: Switch hour for morning/evening
- **Sync Status**: Offline/online status with last sync time
- **Collection Points**: Manage collection points

### Receipt Modal
- **Content**: Pre-formatted receipt message
- **Actions**: Copy to clipboard, send via WhatsApp

## New UI Elements Added

### Collection Point Selector
- Location: Top header next to shop title
- Behavior: Auto-selected (last used), with visual indicator
- Visual: Small grey text near time: "• Village A Booth"

### Hardware Acknowledgment Indicator
- Location: Near timer in header
- Options: "● Reading: Lactoscan" (green), "● Reading: Manual" (gray), "● Reading: External Photo" (gray)
- Behavior: Non-clickable, passive trust signal

### Balance Reason Strip
- Location: Under "NEW BALANCE" field
- Examples: "+₹1,200 (Today Milk)" or "+₹1,200 (Today Milk) – ₹300 (Advance Cut)"
- Behavior: Auto-generated, non-interactive

### Daily Farmer Summary
- Access: Long-press on farmer card or History → Today Summary
- Content: Farmer name, date, total liters, fat range, entries, amount, balance
- Action: Send via WhatsApp

### Sync Status Indicators
- Location: Settings modal
- Statuses: "● Offline – Data safe on this device", "● Online – Syncing…", "● Last synced X min ago"