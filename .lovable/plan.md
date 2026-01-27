
# Offline Indicator Banner Implementation

## Overview
Add a visual banner that appears when the app loses internet connection, helping users understand why certain features may not work. The banner will automatically appear/disappear based on network status and match the app's teal dark theme design.

---

## What Will Be Built

### Visual Design
- A sleek, fixed banner at the top of the screen
- Uses a warning/amber color scheme that stands out but isn't jarring
- Shows a WiFi-off icon with "You're offline" message
- Smooth slide-down animation when appearing
- Automatically hides when connection is restored

### User Experience
- Banner appears within 1-2 seconds of losing connection
- Disappears automatically when back online
- Non-intrusive but clearly visible
- Works across all pages of the app

---

## Implementation Steps

### 1. Create Network Status Hook
A new custom hook that tracks online/offline status using browser APIs.

**File:** `src/hooks/useNetworkStatus.ts`
- Uses `navigator.onLine` for initial state
- Listens to `online` and `offline` window events
- Returns simple `isOnline` boolean
- Properly cleans up event listeners

### 2. Create Offline Banner Component
A reusable component that displays the offline notification.

**File:** `src/components/OfflineBanner.tsx`
- Uses the new `useNetworkStatus` hook
- Fixed positioning at the top of the viewport
- Amber/warning color scheme for visibility
- WiFi-off icon from lucide-react
- Slide-down animation for smooth appearance
- Only renders when offline

### 3. Add Banner to App Layout
Integrate the banner into the main App component.

**File:** `src/App.tsx`
- Import and add `OfflineBanner` component
- Place it at the top level, visible on all pages

### 4. Add Animation Styles
Add the slide-down animation to the CSS.

**File:** `src/index.css`
- Add `slideDown` keyframe animation
- Add `.animate-slide-down` utility class

---

## Technical Details

### Network Status Hook
```typescript
// Uses browser's Navigator API
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### Banner Styling
- Background: Amber/warning tones that work with dark theme
- Fixed position: `top-0 left-0 right-0 z-50`
- Padding for comfortable reading
- Centered content with icon and text

### Animation
```text
┌─────────────────────────────────────┐
│ ↓ Slides down from top              │
├─────────────────────────────────────┤
│  📵  You're offline                 │
│      Check your internet connection │
└─────────────────────────────────────┘
```

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useNetworkStatus.ts` | Create | Hook for tracking network status |
| `src/components/OfflineBanner.tsx` | Create | Banner component |
| `src/App.tsx` | Modify | Add banner to layout |
| `src/index.css` | Modify | Add slide animation |

---

## Benefits
- **PWA Enhancement:** Complements the existing offline-first PWA configuration
- **User Clarity:** Users understand why data might not load
- **Seamless UX:** Auto-appears and auto-hides without user action
- **Consistent Design:** Matches the app's dark teal aesthetic
