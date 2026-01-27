
# Enhance Stat Card Icon Hover Effects

## Overview
Update the stat card icons to have a smoother, more polished interactive hover effect that matches the action cards—neutral/muted by default, transitioning to teal/green on hover with a smooth scale animation.

## Current State
The `StatCard` component renders icons directly with:
- Default color: `text-muted-foreground` (gray/neutral)
- Hover color: `group-hover:text-primary` (teal)
- Scale effect via parallax: `scale(1.1)` on mouse move

The color transition already works, but the scale animation is tied to mouse position rather than a clean hover state.

## Changes

### File: `src/components/ui/stat-card.tsx`

**Update icon styling (line 145-149)**

Add a dedicated scale transform on hover with smooth 300ms transition, independent of the parallax effect:

```text
Current:
<Icon 
  className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" 
  style={iconStyle}
/>

Updated:
<Icon 
  className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110" 
  style={iconStyle}
/>
```

**Key changes:**
- `transition-colors` → `transition-all` — enables both color AND scale transitions
- `duration-300` — ensures smooth 300ms easing for all property changes
- `group-hover:scale-110` — adds a clean 10% scale-up on card hover (works alongside parallax)

## Result
- Icons will smoothly scale up by 10% when hovering on the card
- Color transitions from muted gray to teal with the same smooth 300ms timing
- The parallax effect continues to work, adding extra responsiveness on mouse movement
- Matches the polished feel of the action cards for visual consistency
