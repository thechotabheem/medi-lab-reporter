
# Make Dashboard Cards Same Height - Equal Row Heights

## Problem

On mobile/tablet where cards stack into 2x2 grids, each row sizes to its own content height. This means if one card has longer text, its row is taller than the other row, creating inconsistent card heights within the same grid section.

## Solution

Use CSS Grid's `auto-rows-fr` (fractional unit) which makes ALL rows equal height - specifically, each row will match the height of the tallest card in the entire grid. Combined with `h-full` on the cards themselves, all cards will stretch to fill their grid cell.

## Technical Changes

### File: `src/pages/Dashboard.tsx`

#### Change 1: Add height equalization to action cards grid

**Line 152 - Current:**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
```

**Change to:**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4">
```

#### Change 2: Add `h-full` to action card wrappers so they stretch

**Lines 153, 163, 173, 183 - Current:**
```tsx
<div className="animate-fade-in-up animation-delay-XXX">
```

**Change to:**
```tsx
<div className="animate-fade-in-up animation-delay-XXX h-full">
```

### File: `src/components/ui/action-card.tsx`

#### Change 3: Add `h-full` to outer wrapper and Card component

**Line 102-107 - Current:**
```tsx
<div
  ref={tiltRef}
  style={tiltStyle}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
>
```

**Change to:**
```tsx
<div
  ref={tiltRef}
  style={tiltStyle}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
  className="h-full"
>
```

**Line 108-118 - Add `h-full` to Card:**
```tsx
<Card
  ref={containerRef}
  className={cn(
    "group cursor-pointer transition-all duration-300 ease-out relative overflow-hidden h-full",
    // ... rest of classes
  )}
>
```

## How It Works

```
auto-rows-fr means:
┌─ Grid Container ─────────────────────────────────┐
│  Row 1: [Card A] [Card B]  ← Both 5rem tall      │
│  Row 2: [Card C] [Card D]  ← Both 5rem tall      │
│                                                  │
│  All rows are equal height (tallest card wins)   │
└──────────────────────────────────────────────────┘

Without h-full on cards:
┌─────────────────┐  ┌─────────────────┐
│ Content         │  │ Content         │
│                 │  │ More content    │
│ (empty space)   │  │ Even more       │
└─────────────────┘  └─────────────────┘

With h-full on cards:
┌─────────────────┐  ┌─────────────────┐
│ Content         │  │ Content         │
│                 │  │ More content    │
│ (card fills)    │  │ Even more       │
└─────────────────┘  └─────────────────┘
```

## Files to Change

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add `auto-rows-fr` to action grid, add `h-full` to wrappers |
| `src/components/ui/action-card.tsx` | Add `h-full` to outer div and Card |

## Expected Result

- All action cards in the same grid will have identical heights
- On mobile (2x2 grid): both rows will be the same height
- On desktop (1x4 grid): single row, all cards same height
- Content stays properly aligned, no text clipping or deformation
- Cards stretch to fill their grid cell but content remains at the top
