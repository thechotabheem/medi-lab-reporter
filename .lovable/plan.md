
# Add Gentle Fade-In for Sparkles on Page Load

## Overview
Add a fade-in effect so the sparkles gently appear when the page first loads, rather than immediately starting their animation cycle. This creates a more polished entrance effect.

---

## Implementation Approach

Use CSS animation chaining to add an initial fade-in before the sparkle animation begins. The fade-in will work in conjunction with each sparkle's existing stagger delay.

---

## Implementation Steps

### Step 1: Create Initial Fade-In Animation
**File:** `src/index.css`

Add a new keyframe animation for the initial fade-in and update the `.animate-sparkle` class to chain both animations:

```css
/* Sparkle initial fade-in */
@keyframes sparkle-fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.animate-sparkle {
  opacity: 0;
  animation: 
    sparkle-fade-in 0.6s ease-out forwards,
    sparkle 3s ease-in-out 0.6s infinite;
}
```

The key changes:
- Start with `opacity: 0` so sparkles are hidden initially
- `sparkle-fade-in` runs for 0.6s with `forwards` to maintain the final state
- `sparkle` animation starts after a 0.6s delay (after fade-in completes)

### Step 2: Update Animation Delay Logic
**File:** `src/components/ui/sparkle-text.tsx`

Update the style to include both the fade-in delay and the existing stagger delay:

```tsx
<span
  className="absolute pointer-events-none animate-sparkle"
  style={{
    ...style,
    width: size,
    height: size,
    animationDelay: `${delay}ms, ${delay + 600}ms`,
  }}
>
```

This ensures:
- First value (`${delay}ms`) applies to `sparkle-fade-in`
- Second value (`${delay + 600}ms`) applies to `sparkle` animation (adds 600ms for fade-in duration)

---

## Technical Details

### Animation Chain Breakdown

| Animation | Duration | Delay | Purpose |
|-----------|----------|-------|---------|
| sparkle-fade-in | 0.6s | Staggered per particle | Gentle initial appearance |
| sparkle | 3s (infinite) | 0.6s after fade-in | Continuous sparkle effect |

### How It Works
1. Page loads → All sparkles start invisible (`opacity: 0`)
2. Each sparkle fades in with its own stagger delay (0ms, 400ms, 800ms, etc.)
3. After each sparkle completes its fade-in, the sparkle animation begins
4. Result: Sparkles gracefully appear one by one, then continue their twinkling cycle

### Files to Modify
1. **src/index.css** - Add fade-in keyframes and update animation property
2. **src/components/ui/sparkle-text.tsx** - Update animation delay to support chained animations
