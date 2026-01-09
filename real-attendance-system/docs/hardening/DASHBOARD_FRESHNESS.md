# Dashboard Data Freshness Implementation

**Date:** 2026-01-09  
**Status:** ✅ Implemented

---

## Overview

This document describes the implementation of data freshness features for the RAE Attendance System dashboard at `https://raeservice.mju.ac.th/attendance/app/dashboard`.

The goal is to ensure the dashboard always shows the latest data without stale cache, with visible proof through:
1. A "Last updated" timestamp display
2. A "Refresh data" button that refetches from APIs
3. Loading state indicator
4. Success confirmation feedback

---

## Changes Made

### 1. Backend: Data Freshness Endpoint

**File:** `src/api/routes/meta.js`

Added a new `/api/meta/data-freshness` endpoint that returns:
- Current server timestamp
- Latest data timestamps from key tables:
  - `daily_attendance` - latest attendance record date and timestamps
  - `staging_facescan` - latest face scan data
  - `staging_leave` - latest leave request data
  - `employees` - latest employee record update
- Last sync activity from system logs

**Example Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-01-09T08:54:50.856Z",
    "server_time": "9/1/2569 15:54:50",
    "data_sources": {
      "daily_attendance": {
        "latest_date": "2025-11-04",
        "latest_created": "2025-11-04 02:31:57",
        "total_records": 6,
        "status": "ok"
      },
      "employees": {
        "latest_updated": "2026-01-09 08:45:10",
        "total_employees": 3,
        "status": "ok"
      }
    },
    "latest_data_update": "2026-01-09 08:45:10",
    "latest_data_update_bangkok": "9/1/2569 08:45:10"
  }
}
```

Also added `/api/meta/server-time` endpoint for simple time synchronization.

### 2. Frontend: API Library Updates

**File:** `frontend/src/lib/api.ts`

- Fixed API base URL for production: `https://raeservice.mju.ac.th/attendance/api`
- Added cache-busting headers to prevent stale data:
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Pragma: no-cache`
- Added `meta.getDataFreshness()` and `meta.getServerTime()` methods
- Added TypeScript interfaces for `DataFreshness` and `ServerTime`

**File:** `frontend/src/services/api.js`

- Added same cache-busting headers for consistency

### 3. Frontend: Dashboard UI Updates

**File:** `frontend/src/views/DashboardView.vue`

Enhanced the dashboard component with:

1. **Last Updated Timestamp Display**
   - Shows "อัพเดทล่าสุด: [timestamp]" in the header
   - Formatted in Thai locale with Asia/Bangkok timezone
   - Updates automatically after each data fetch

2. **Refresh Button Enhancement**
   - Button text changed to "รีเฟรชข้อมูล" (Refresh Data)
   - Shows spinning icon during loading
   - Disabled while loading to prevent multiple requests

3. **Success Indicator**
   - Shows green "โหลดข้อมูลสำเร็จ" (Data loaded successfully) for 2 seconds after refresh
   - Green checkmark animation in the timestamp area

4. **Parallel Data Fetching**
   - Fetches attendance data and data freshness simultaneously
   - Graceful fallback if freshness endpoint fails

---

## How It Works

### Data Flow

```
User clicks "รีเฟรชข้อมูล" button
    │
    ▼
fetchDashboardData() called
    │
    ├─► loading = true (shows spinner)
    │
    ├─► Parallel API calls:
    │   ├─► GET /api/attendance/daily/{today}
    │   └─► GET /api/meta/data-freshness
    │
    ▼
Process responses
    │
    ├─► Update stats (total, present, late, absent, leave)
    ├─► Update recent attendance records
    ├─► Set lastUpdated = new Date()
    ├─► Set dataFreshness from API response
    │
    ▼
loading = false, refreshSuccess = true (shows success indicator)
    │
    ▼
After 2 seconds: refreshSuccess = false
```

### Cache Prevention

1. **HTTP Headers** - All API requests include:
   ```
   Cache-Control: no-cache, no-store, must-revalidate
   Pragma: no-cache
   ```

2. **Fresh Requests** - Each request uses the current timestamp ensuring unique requests

3. **No LocalStorage Caching** - Dashboard data is not cached in localStorage

---

## API Endpoints Used

| Endpoint | Purpose | Cache Policy |
|----------|---------|--------------|
| `GET /api/attendance/daily/{date}` | Today's attendance records | No cache |
| `GET /api/meta/data-freshness` | Database freshness timestamps | No cache |
| `GET /api/meta/server-time` | Server time synchronization | No cache |

---

## Verification

### Manual Testing

1. Open dashboard: `https://raeservice.mju.ac.th/attendance/app/dashboard`
2. Look for "อัพเดทล่าสุด:" timestamp in the header
3. Click "รีเฟรชข้อมูล" button
4. Verify:
   - Spinner appears during loading
   - "โหลดข้อมูลสำเร็จ" appears briefly after success
   - Timestamp updates to current time

### API Testing

```bash
# Test data freshness endpoint
curl -s "https://raeservice.mju.ac.th/attendance/api/meta/data-freshness" | jq .

# Test server time
curl -s "https://raeservice.mju.ac.th/attendance/api/meta/server-time" | jq .

# Verify cache headers
curl -sI "https://raeservice.mju.ac.th/attendance/api/attendance/daily/2026-01-09" | grep -i cache
```

---

## Troubleshooting

### Dashboard shows stale data

1. **Clear browser cache:** Press Ctrl+Shift+Del
2. **Hard reload:** Press Ctrl+Shift+R
3. **Check DevTools Network tab:** Verify requests have `Cache-Control: no-cache` header

### "Last updated" doesn't appear

1. Check browser console for JavaScript errors
2. Verify `/api/meta/data-freshness` endpoint returns 200
3. Check if `lastUpdated` ref is being set in Vue DevTools

### Refresh button doesn't work

1. Check network tab for failed requests
2. Verify backend is running: `pm2 status`
3. Check nginx is proxying correctly: `curl https://raeservice.mju.ac.th/attendance/api/health`

### Data freshness shows old dates

This is expected if no new data has been synced. The freshness endpoint shows the actual latest records in the database. If n8n sync hasn't run or external systems haven't sent new data, the timestamps will reflect the last actual update.

To trigger a manual sync:
1. Access n8n at the configured URL
2. Manually execute the sync workflow
3. Or wait for scheduled sync times (default: 06:00 and 14:00)

---

## Related Files

- `src/api/routes/meta.js` - Backend meta endpoints
- `src/api/index.js` - Route registration
- `frontend/src/lib/api.ts` - Frontend API client
- `frontend/src/services/api.js` - Alternative API client
- `frontend/src/views/DashboardView.vue` - Dashboard component

---

## Artifacts

API response snapshots are saved at:
`reports/artifacts/dashboard_api_snapshot_20260109_085727/`

- `attendance_daily.json` - Attendance data sample
- `data_freshness.json` - Data freshness response
- `server_time.json` - Server time response
- `employees.json` - Employees data sample
- `health_ready.json` - Health check response

---

**Implementation Date:** 2026-01-09T15:57:00+07:00  
**Last Updated:** 2026-01-09T15:57:00+07:00
