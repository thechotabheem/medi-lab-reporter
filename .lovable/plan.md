
# Fix for Blank Pages Issue

## Root Cause Analysis

The blank pages are caused by **stale Service Worker cache**. Your PWA caches the app aggressively, and when code changes are deployed, the old cached version may conflict with new routes or components.

This is especially common when:
- The app was installed as a PWA (home screen shortcut)
- You've been using the same browser session for a long time
- The service worker hasn't updated properly

## Immediate Fix (User Action Required)

### Step 1: Clear Service Worker & Cache (Do This First)

**Desktop Chrome/Edge:**
1. Open the published site: `medi-lab-reporter.lovable.app`
2. Press `F12` to open DevTools
3. Go to **Application** tab → **Service Workers** → Click **Unregister** on any workers
4. Go to **Application** tab → **Storage** → Click **Clear site data**
5. Close the browser completely and reopen

**Mobile (Android):**
1. Go to Settings → Apps → Chrome → Storage → Clear Cache
2. Or long-press the PWA icon → App Info → Clear Cache → Force Stop

**Mobile (iOS Safari):**
1. Settings → Safari → Advanced → Website Data → Find the site → Delete

### Step 2: Hard Refresh

After clearing cache, do a hard refresh:
- Windows/Linux: `Ctrl + Shift + R`  
- Mac: `Cmd + Shift + R`

## Code Fix (Prevents Future Issues)

I will make the following changes to prevent this from happening again:

### 1. Add Cache-Busting Version Header

Update `vite.config.ts` to add a version timestamp that forces service worker updates:

```text
Changes to workbox config:
- Add skipWaiting: true to immediately activate new service workers
- Add clientsClaim: true to take control of all pages immediately
- Add cleanupOutdatedCaches: true to remove old cache entries
```

### 2. Add Service Worker Update Notification

Create a component that notifies users when a new version is available and prompts them to reload.

### 3. Fix React ForwardRef Warnings

The console shows warnings about components not using `forwardRef`. While these don't cause blank pages, I'll fix them in `PatientSelector.tsx` and `TemplateSelector.tsx` to clean up the console.

## Files to Modify

| File | Change |
|------|--------|
| `vite.config.ts` | Add `skipWaiting`, `clientsClaim`, and `cleanupOutdatedCaches` to PWA config |
| `src/components/ServiceWorkerUpdate.tsx` | **New** - Component to detect and prompt for updates |
| `src/App.tsx` | Import the update notification component |

## Technical Details

### Updated PWA Configuration

```typescript
// vite.config.ts - VitePWA plugin options
VitePWA({
  registerType: "autoUpdate",
  workbox: {
    skipWaiting: true,           // New: Activate immediately
    clientsClaim: true,          // New: Take control immediately  
    cleanupOutdatedCaches: true, // New: Remove old caches
    // ... existing caching rules
  }
})
```

### Service Worker Update Component

A toast notification will appear when a new version is detected, with a "Refresh" button to update immediately.

## Why This Works

1. **skipWaiting** - Forces new service worker to activate immediately instead of waiting for all tabs to close
2. **clientsClaim** - New service worker takes control of all open pages
3. **cleanupOutdatedCaches** - Automatically removes old cache entries that could cause conflicts
4. **Update notification** - Users are prompted to refresh when new versions are available

## Expected Outcome

After implementing these changes:
- New deployments will take effect immediately
- Users will see a notification when updates are available
- Stale cache issues will be prevented
- The app will work reliably across all devices and both installed PWA and browser modes
