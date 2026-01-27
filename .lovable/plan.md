

# Adding Subtle Gradient Overlay to Dashboard Cards

## Overview
Add a subtle gradient overlay to the StatCard and ActionCard components to create more visual depth. The gradient will be a semi-transparent overlay that flows from the top-left corner, adding dimension without overpowering the existing glow effects.

---

## Implementation Approach

The gradient overlay will be implemented as a pseudo-element using CSS, applied only when the `glowEffect` prop is enabled. This keeps the effect consistent with the existing interactive styling system.

---

## Implementation Steps

### Step 1: Add Gradient Overlay CSS Class

**File:** `src/index.css`

Add a new utility class `.card-gradient-overlay` that creates a subtle diagonal gradient using a pseudo-element:

```css
/* Card gradient overlay for depth */
.card-gradient-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    hsl(162 84% 42% / 0.03) 0%,
    transparent 50%,
    hsl(220 15% 0% / 0.15) 100%
  );
  pointer-events: none;
  z-index: 0;
}
```

This creates:
- A very subtle teal tint at the top-left (matches the primary color)
- Transparent in the middle
- A darker shadow at the bottom-right for depth

### Step 2: Update StatCard Component

**File:** `src/components/ui/stat-card.tsx`

Add the gradient overlay class when `glowEffect` is enabled:

```tsx
className={cn(
  "group transition-all duration-300 ease-out relative overflow-hidden",
  onClick && "cursor-pointer",
  onClick && !glowEffect && "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
  glowEffect && "animate-pulse-glow border-primary/20 card-gradient-overlay",
  className
)}
```

Also ensure card content stays above the overlay by adding `relative z-10` to the CardHeader and CardContent:

```tsx
<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
...
<CardContent className="relative z-10">
```

### Step 3: Update ActionCard Component

**File:** `src/components/ui/action-card.tsx`

Apply the same changes:

```tsx
className={cn(
  "group cursor-pointer transition-all duration-300 ease-out h-full relative overflow-hidden",
  !glowEffect && "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
  !glowEffect && "active:translate-y-0 active:shadow-md",
  glowEffect && "animate-pulse-glow border-primary/20 card-gradient-overlay",
  className
)}
```

And add `relative z-10` to the CardHeader to keep content above the overlay:

```tsx
<CardHeader className="p-4 sm:p-6 h-full flex flex-col relative z-10">
```

---

## Technical Details

### Gradient Design Rationale

| Aspect | Value | Reason |
|--------|-------|--------|
| Direction | 135deg (diagonal) | Creates natural light source from top-left |
| Top-left color | Primary at 3% opacity | Subtle teal highlight, matches theme |
| Middle | Transparent | Allows card content to remain clear |
| Bottom-right | Dark at 15% opacity | Adds depth, simulates shadow |

### Z-Index Strategy
- Gradient overlay: `z-index: 0` (pseudo-element)
- Ripple effect: Already positioned (stays above gradient)
- Card content: `z-index: 10` (ensures text/icons remain above)

### Why Pseudo-Element?
Using `::before` keeps the gradient as a separate layer that:
- Doesn't interfere with click events (`pointer-events: none`)
- Doesn't affect ripple positioning
- Can be easily modified or removed without touching component structure

---

## Files to Modify

1. **src/index.css** - Add the `.card-gradient-overlay` utility class
2. **src/components/ui/stat-card.tsx** - Apply overlay class and z-index to content
3. **src/components/ui/action-card.tsx** - Apply overlay class and z-index to content

