

# Remove All Shimmer Effects

## Overview

Remove all shimmer/animated sweep effects throughout the application while preserving static styling and non-shimmer animations.

---

## Elements to Remove

| Element | Location | Description |
|---------|----------|-------------|
| **Shimmer sweep on splash** | `SplashScreen.tsx` lines 69-77 | Animated diagonal light sweep across splash screen |
| **Text gradient shimmer** | `SplashScreen.tsx` line 135 | `text-gradient-shimmer` class on "Lab Reporter" title |
| **Text gradient shimmer** | `Dashboard.tsx` line 74 | `text-gradient-shimmer` class on clinic name |
| **Shimmer utility class** | `index.css` lines 459-473 | `.shimmer` class and `@keyframes shimmer` |
| **Text gradient shimmer** | `index.css` lines 531-558 | `.text-gradient-shimmer` class and `@keyframes shimmer-sweep` |
| **Stat card shimmer** | `index.css` lines 625-648 | `@keyframes stat-shimmer` and `.animate-stat-shimmer::after` |
| **Stat card shimmer logic** | `stat-card.tsx` | `isInitialLoad` state and `animate-stat-shimmer` class |
| **Action card shimmer logic** | `action-card.tsx` | `isInitialLoad` state and `animate-stat-shimmer` class |
| **Skeleton shimmer variant** | `skeleton.tsx` | `shimmer` variant option |

---

## Files to Modify

### 1. `src/index.css`

**Remove:**
- Lines 459-473: `.shimmer` class and `@keyframes shimmer`
- Lines 531-558: `.text-gradient-shimmer` class and `@keyframes shimmer-sweep`
- Lines 625-648: `@keyframes stat-shimmer` and `.animate-stat-shimmer::after`

### 2. `src/components/SplashScreen.tsx`

**Remove:**
- Lines 69-77: The animated shimmer sweep div
- Line 135: Change `text-gradient-shimmer` to static `text-gradient-primary` class

### 3. `src/pages/Dashboard.tsx`

**Remove:**
- Line 74: Change `text-gradient-shimmer` to static `text-gradient-primary` class

### 4. `src/components/ui/stat-card.tsx`

**Remove:**
- The `isInitialLoad` state and `useEffect` timer (lines 44-48)
- The `animate-stat-shimmer` class from the card className

### 5. `src/components/ui/action-card.tsx`

**Remove:**
- The `isInitialLoad` state and `useEffect` timer (lines 37-42)
- The `animate-stat-shimmer` class from the card className

### 6. `src/components/ui/skeleton.tsx`

**Remove:**
- The `shimmer` variant option - keep only `"default"` with `animate-pulse`

---

## Result

After these changes:
- No animated shimmer/sweep effects anywhere in the app
- Static gradient text styling where needed (using `text-gradient-primary`)
- Skeleton loaders use pulse animation only (no shimmer)
- Cards load without shimmer animation
- All other UI interactions and transitions remain functional

