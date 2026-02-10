

# Offline-First Enhancements for Lab Reporter

## Overview
This plan adds two major features to eliminate offline limitations: (1) an IndexedDB-based offline queue that lets users create reports and patients without internet, automatically syncing when connectivity returns, and (2) a data source indicator showing whether displayed data is live or from cache.

---

## Feature 1: Offline Data Queue with IndexedDB

### How it works
When a user creates a report or adds a patient while offline, instead of failing, the app saves the action to an IndexedDB queue. When the connection is restored, all queued actions are automatically synced to the server in order.

### New files

**`src/lib/offlineQueue.ts`** - Core IndexedDB queue manager
- Opens/creates an IndexedDB database (`lab-reporter-offline`) with an `pendingActions` object store
- Each queued action stores: `id`, `type` (create-report, create-patient), `payload`, `createdAt`, `status`
- Provides functions: `enqueueAction()`, `getPendingActions()`, `removeAction()`, `getPendingCount()`

**`src/hooks/useOfflineQueue.ts`** - React hook for offline queue
- Wraps the IndexedDB manager with React state
- Listens to online/offline events
- On reconnect: processes the queue sequentially, calling Supabase for each action
- Provides `pendingCount` and `isSyncing` state
- Shows toast notifications: "X items synced successfully" or error details for failures

**`src/components/OfflineSyncStatus.tsx`** - Sync status indicator
- Small floating badge (bottom-right area, above mobile nav) showing pending queue count
- Animated sync icon when actively syncing
- Clicking opens a small panel listing queued items with option to retry or discard

### Modified files

**`src/pages/CreateReport.tsx`** - `handleSave()` function (~line 305)
- Wrap the Supabase insert in a try-catch
- If offline (navigator.onLine === false) or network error occurs, enqueue the action to IndexedDB instead
- Show toast: "Saved offline - will sync when connected"
- Still clear the draft and navigate to dashboard

**`src/pages/AddPatient.tsx`** - `handleSubmit()` function (~line 56)
- Same pattern: detect offline state, enqueue patient creation to IndexedDB
- Show appropriate offline-saved toast

**`src/hooks/useReports.ts`** - Merge offline pending reports into the displayed list
- After fetching from Supabase, append any pending offline reports (marked with a "pending sync" badge)

**`src/hooks/usePatients.ts`** - Same merge for offline pending patients

**`src/App.tsx`** - Add the `OfflineSyncStatus` component and initialize the sync listener

---

## Feature 2: Cache vs Live Data Indicator

### How it works
A small, unobtrusive indicator on data-fetching pages shows whether the displayed data came from a live server response or from the service worker cache.

### New files

**`src/hooks/useDataFreshness.ts`** - Hook to detect data source
- Intercepts/wraps fetch responses to check for the service worker cache
- Uses the `Date` header and response timing to determine if data is fresh or cached
- Returns `dataSource: 'live' | 'cache' | 'offline'` and `lastFetchedAt` timestamp

**`src/components/DataSourceBadge.tsx`** - Visual indicator component
- Small pill badge in page headers: green dot + "Live" or amber dot + "Cached"  
- Tooltip shows last fetched timestamp
- When offline, shows "Offline mode" with the cached data timestamp

### Modified files

**`src/components/ui/page-header.tsx`** - Add optional `dataSource` prop to render the `DataSourceBadge` inline with the title

**Pages that fetch data** (Dashboard, Reports, Patients, PatientDetail, ReportView):
- Pass the data freshness status to their `PageHeader` component

---

## Technical Details

### IndexedDB Schema
```text
Database: lab-reporter-offline (version 1)
Store: pendingActions
  - keyPath: id (auto-generated UUID)
  - Indexes: type, createdAt
  - Fields: { id, type, payload, createdAt, status, retryCount }
```

### Sync Strategy
```text
Online event detected
  --> Lock queue (prevent duplicate processing)
  --> Process actions oldest-first
  --> For each action:
      - Attempt Supabase insert
      - On success: remove from queue, invalidate React Query cache
      - On failure: increment retryCount, skip (try next)
  --> Show summary toast
  --> Unlock queue
```

### Cache Detection Approach
- Use `performance.getEntriesByType('resource')` to check if Supabase API responses were served from the service worker cache (transferSize === 0 indicates cached)
- Fallback: compare response timing (< 10ms typically means cached)

### Edge Cases Handled
- Duplicate prevention: queue items get unique IDs; sync checks for duplicates via report_number
- Patient creation during offline report: if report references a new patient, patient is created first during sync
- Queue persistence: IndexedDB survives app restarts, browser closes
- Conflict resolution: server data always wins; offline items are marked if they fail to sync
- Max retry: after 3 failed sync attempts, item is flagged for manual review

