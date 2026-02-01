
# Fix: Duplicate CSS Animation Causing Invisible Elements

## Root Cause

The `.animate-fade-in-up` class is defined **twice** in `src/index.css`:

```css
/* First definition (lines 290-292) */
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

/* Second definition (lines 314-317) - PROBLEMATIC */
.animate-fade-in-up {
  opacity: 0;  /* <-- This is the culprit! */
  animation: fadeInUp 0.5s ease-out forwards;
}
```

The second definition sets `opacity: 0` as the base state. When the animation fails to run (due to browser quirks, race conditions, or CSS conflicts), elements remain invisible because they're stuck at `opacity: 0`.

## The Fix

Remove the duplicate definition entirely. Keep only the first, clean definition without the problematic `opacity: 0`:

| File | Change |
|------|--------|
| `src/index.css` | Delete lines 314-317 (the duplicate `.animate-fade-in-up` definition) |

## Technical Details

### Before (lines 314-317 to remove)
```css
.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}
```

### After
Lines 314-317 will be completely removed, leaving only the single definition at lines 290-292:

```css
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
```

The `@keyframes fadeInUp` already handles the opacity transition properly:
```css
@keyframes fadeInUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

## Why This Works

1. The keyframe animation already defines `from { opacity: 0 }` - we don't need to set it on the class
2. Using `animation-fill-mode: forwards` (via the `forwards` keyword) ensures the final state (`opacity: 1`) is retained
3. Removing the duplicate eliminates the race condition where the base `opacity: 0` could persist if animation timing fails

## Impact

This fix will immediately resolve the blank pages issue across:
- Dashboard
- Reports page
- Patients page
- Create Report page
- All other pages using the `animate-fade-in-up` class

No service worker clearing needed - this is purely a CSS fix that will take effect on next page load.
