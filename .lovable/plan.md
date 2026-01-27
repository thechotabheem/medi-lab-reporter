

# Subtle Sparkle Effect Adjustments

## Overview
Modify the sparkle effect on the clinic name to be more subtle and refined with smaller particles, slower animation, and sparkles contained within the text boundaries.

---

## Current vs. Desired Settings

| Property | Current | Desired |
|----------|---------|---------|
| Particle Size | 10-20px | 5-8px |
| Animation Duration | 1.2s | 3s |
| Position Range | -10% to 110% (beyond text) | 0% to 100% (within text) |
| Stagger Delay | 150ms | 400ms (slower stagger) |

---

## Implementation Steps

### Step 1: Update Sparkle Animation Duration
**File:** `src/index.css`

Change the animation duration from `1.2s` to `3s` for a slower, more elegant effect:

```css
.animate-sparkle {
  animation: sparkle 3s ease-in-out infinite;
}
```

### Step 2: Update SparkleText Component
**File:** `src/components/ui/sparkle-text.tsx`

Modify the sparkle generation parameters:

```tsx
const sparkles = useMemo(() => {
  return Array.from({ length: sparkleCount }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 5, // 5-8px (smaller)
    color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
    style: {
      top: `${Math.random() * 100}%`, // Stay within bounds (0-100%)
      left: `${Math.random() * 100}%`,
    },
    delay: i * 400, // Slower stagger for more elegant timing
  }));
}, [sparkleCount]);
```

---

## Technical Details

### Changes Summary
1. **Particle Size**: `Math.random() * 3 + 5` generates sizes between 5-8px instead of 10-20px
2. **Position Bounds**: `Math.random() * 100` keeps sparkles within 0-100% of the text container (no negative offset or overflow)
3. **Animation Speed**: 3s duration makes each sparkle cycle 2.5x slower
4. **Stagger Delay**: 400ms between particle starts creates a calmer, more elegant sequence

### Files to Modify
1. **src/index.css** - Update animation duration from 1.2s to 3s
2. **src/components/ui/sparkle-text.tsx** - Update size calculation and position bounds

