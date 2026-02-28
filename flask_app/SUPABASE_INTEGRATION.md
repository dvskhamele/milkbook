# MilkRecord Supabase Integration Guide
## Production Architecture with Offline-First Sync

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MilkRecord POS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Desktop EXE (Offline-First)    │  Vercel (Cloud-Only)  │
│  ┌──────────────────────┐       │  ┌─────────────────┐  │
│  │  SQLite Database     │       │  │  Supabase Only  │  │
│  │  - Full data store   │       │  │  - Real-time    │  │
│  │  - Offline buffer    │       │  │  - No SQLite    │  │
│  │  - Sync queue        │       │  │  - Serverless   │  │
│  └──────────┬───────────┘       │  └────────┬────────┘  │
│             │                   │           │           │
│             ▼                   │           │           │
│  ┌──────────────────────┐       │  ┌────────▼────────┐  │
│  │  Background Sync     │       │  │  Supabase API   │  │
│  │  - Auto retry        │       │  │  - PostgreSQL   │  │
│  │  - Conflict detect   │◄──────┼──│  - RLS Security │  │
│  │  - Version control   │       │  │  - Real-time    │  │
│  └──────────┬───────────┘       │  └─────────────────┘  │
│             │                   │                       │
│             └───────────────────┼───────────────────────┘
│                                 │
│                                 ▼
│                    ┌────────────────────────┐
│                    │   Supabase Cloud       │
│                    │   - PostgreSQL         │
│                    │   - Source of Truth    │
│                    │   - Multi-device sync  │
│                    └────────────────────────┘
```

---

## 📋 Prerequisites

### 1. Supabase Account
- Create account at https://supabase.com
- Create new project
- Note your project URL and anon key

### 2. Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

---

## 🗄️ Database Setup

### Step 1: Run SQL Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase_schema.sql`
3. Run all queries
4. Verify tables created:
   - farmers
   - customers
   - products
   - sales
   - milk_collections
   - sync_logs
   - devices

### Step 2: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show 'true' for all tables
```

### Step 3: Get Credentials

From Supabase Dashboard:
- Settings → API
- Copy **Project URL** → `SUPABASE_URL`
- Copy **anon public** key → `SUPABASE_KEY`

**⚠️ IMPORTANT:**
- Use **anon key** in desktop/EXE (safe)
- Use **service role key** ONLY in secure backend
- Never expose service role key in EXE

---

## 🖥️ Desktop EXE Setup

### 1. Configure Environment

Edit `.env`:
```env
RUNTIME=desktop
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Test Locally

```bash
cd flask_app
python desktop/app.py
```

Expected output:
```
✅ Database initialized with device_id: device_abc123
✅ Sync engine started (interval: 10s)
🚀 Starting Desktop app on port 5000
```

### 3. Build EXE

```bash
# Install PyInstaller
pip install pyinstaller==6.3.0

# Build EXE
pyinstaller --onefile --noconsole --name="MilkRecordPOS" desktop/app.py

# Add data files
pyinstaller --onefile --noconsole ^
  --name="MilkRecordPOS" ^
  --add-data "apps;apps" ^
  --add-data "database;database" ^
  desktop/app.py
```

### 4. Distribute

Copy `dist/MilkRecordPOS.exe` to target machines.

**First Run:**
- Creates `device_config.json` automatically
- Generates unique `device_id`
- Creates local SQLite database
- Starts background sync

---

## ☁️ Vercel Deployment

### 1. Configure Environment

In Vercel Dashboard → Project Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
VERCEL=1
RUNTIME=cloud
```

### 2. Update vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.py"
    }
  ]
}
```

### 3. Deploy

```bash
cd flask_app
vercel --prod
```

### 4. Test

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "runtime": "cloud",
  "platform": "vercel",
  "hardware": "disabled",
  "sync": "realtime"
}
```

---

## 🔄 Sync Engine (Desktop Only)

### How It Works

1. **Save Operation:**
   ```
   User saves sale
   ↓
   Saved to SQLite with sync_status='pending'
   ↓
   Background thread picks up (every 10s)
   ↓
   Checks internet
   ↓
   Pushes to Supabase
   ↓
   Marks as sync_status='synced'
   ```

2. **Conflict Detection:**
   ```
   Before sync:
   - Check remote version
   - If remote_version > local_version → CONFLICT
   - Log conflict, skip sync
   - Manual resolution required
   ```

3. **Retry Logic:**
   - Failed sync → logged in sync_logs
   - Retries every 10 seconds
   - No limit on retries
   - Manual intervention if persistent

### Monitor Sync

```bash
curl http://localhost:5000/api/sync/status
```

Response:
```json
{
  "device_id": "device_abc123",
  "internet": true,
  "pending_records": {
    "farmers": 5,
    "sales": 12
  },
  "runtime": "desktop"
}
```

### Force Sync

```bash
curl -X POST http://localhost:5000/api/sync/force
```

---

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Example policy
CREATE POLICY "Allow authenticated read" ON farmers
    FOR SELECT TO authenticated USING (true);
```

### Best Practices

1. **Never use service role key in EXE**
   - Anon key is safe (RLS protects data)
   - Service role key bypasses RLS

2. **Device ID tracking**
   - Every record has device_id
   - Can track which device created record
   - Useful for audit trail

3. **Version control**
   - Every record has version number
   - Incremented on each update
   - Used for conflict detection

---

## 🐛 Troubleshooting

### Sync Not Working

**Check logs:**
```bash
# Desktop logs
cat logs/milkrecord.log

# Check sync_logs table
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

**Common issues:**
1. No internet → Check connection
2. Wrong SUPABASE_KEY → Verify in dashboard
3. RLS blocking → Check policies
4. Table doesn't exist → Run schema SQL

### EXE Won't Start

**Check:**
1. `.env` file exists next to EXE
2. `SUPABASE_URL` and `SUPABASE_KEY` set
3. Firewall not blocking port 5000
4. SQLite database not locked

### Vercel Deployment Fails

**Check:**
1. Environment variables set in Vercel
2. `requirements.txt` includes `supabase`
3. No SQLite imports in Vercel runtime
4. Build logs for errors

---

## 📊 Data Flow Examples

### Example 1: Desktop Sale (Offline)

```
1. User creates sale
2. Saved to SQLite:
   - id: uuid-123
   - sync_status: 'pending'
   - device_id: 'device_abc'
3. User sees success
4. Background sync picks up
5. Pushes to Supabase
6. Marks as 'synced'
```

### Example 2: Vercel Sale (Online)

```
1. User creates sale
2. Saved directly to Supabase:
   - id: uuid-456
   - sync_status: 'synced'
3. User sees success
4. No sync needed (already in cloud)
```

### Example 3: Conflict Scenario

```
Device A: Updates farmer balance to 1000 (version 5)
Device B: Updates farmer balance to 1200 (version 5)

Sync from Device A:
- Remote version: 6 (Device B already synced)
- Local version: 5
- CONFLICT DETECTED
- Logged in sync_logs
- Skipped

Manual resolution required
```

---

## 🎯 Production Checklist

### Before Deployment

- [ ] Supabase schema deployed
- [ ] RLS policies enabled
- [ ] Environment variables set
- [ ] Tested offline mode
- [ ] Tested sync with internet
- [ ] Tested conflict detection
- [ ] EXE builds successfully
- [ ] Vercel deploys successfully

### Monitoring

- [ ] Sync logs being created
- [ ] No persistent sync failures
- [ ] Database size reasonable
- [ ] RLS blocking unauthorized access
- [ ] Device IDs unique

### Backup

- [ ] Supabase automatic backups enabled
- [ ] SQLite backups for desktop (manual)
- [ ] Export critical data regularly

---

## 📈 Performance Tips

### SQLite Optimization

```sql
-- Vacuum database periodically
VACUUM;

-- Analyze for query optimization
ANALYZE;
```

### Supabase Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_sales_customer_date ON sales(customer_id, sale_date DESC);

-- Partition large tables (if needed)
-- Consider partitioning sales by date
```

### Sync Optimization

- Adjust `SYNC_INTERVAL` based on needs
- Batch sync operations (future enhancement)
- Compress large payloads (future enhancement)

---

## 🔮 Future Enhancements

1. **Bidirectional Sync**
   - Pull changes from Supabase to SQLite
   - Handle deletes
   - Merge conflicts automatically

2. **Delta Sync**
   - Only sync changed fields
   - Reduce bandwidth
   - Faster sync

3. **Compression**
   - Compress large payloads
   - Reduce API calls
   - Faster sync

4. **Priority Sync**
   - Critical records sync first
   - Batch low-priority records
   - Configurable priorities

---

**Built with ❤️ for Indian Dairy Shops**
