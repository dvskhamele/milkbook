# Sync Architecture

## 1. Local-First Architecture
- All data stored locally in localStorage/indexedDB
- App functions completely offline
- No mandatory internet connection

## 2. Background Sync Process
1. **Detection**: Service worker detects network availability
2. **Queue**: Changes queued locally when offline
3. **Sync**: Changes pushed to server when online
4. **Conflict Resolution**: Last-write wins with proof preserved
5. **Status Update**: Sync status updated in UI

## 3. Conflict Resolution Strategy
- **Last-write wins**: Most recent change takes precedence
- **Proof Preservation**: All edit trails and metadata preserved
- **Manual Resolution**: For critical conflicts, manual intervention

## 4. Sync Status Indicators
- **Offline**: Gray dot, "Offline – Data safe on this device"
- **Syncing**: Green dot, "Online – Syncing..."
- **Synced**: Green dot, "Last synced X min ago"

## 5. Data Flow
```
Local Storage → Queue → Network → Server → Confirmation → Status Update
```

## 6. Error Handling
- Retry mechanism for failed syncs
- Graceful degradation when sync unavailable
- Clear status messaging to user

## 7. Sync Triggers
- Periodic (every 5 minutes when online)
- On app foreground/background
- On significant data changes
- Manual trigger (if needed)

## 8. Data Types Synced
- Entry records
- Farmer information
- Settings
- Collection point data
- Dispatch records
- Adjustment logs