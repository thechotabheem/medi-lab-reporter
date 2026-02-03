
# Full Viewport Dashboard Cards - Fill All Available Space

## Goal

Make the dashboard cards expand to fill the entire viewport height on all screen sizes (QHD 2560x1440, WUXGA 1920x1200, FHD 1920x1080, HD+ 1600x900, HD 1366x768, SXGA 1280x1024, iPhone 12 Pro 390x844, Pixel 5 393x851, WQHD 3440x1440), leaving only approximately 2% padding at the bottom.

## Current Layout Structure

```
┌─────────────────────────────────────┐
│ Header (fixed height)               │
├─────────────────────────────────────┤
│ Welcome Section (fixed height)      │
├─────────────────────────────────────┤
│ Stat Cards Grid (content height)    │
├─────────────────────────────────────┤
│ Action Cards Grid (content height)  │
├─────────────────────────────────────┤
│                                     │
│ (empty space at bottom)             │
│                                     │
└─────────────────────────────────────┘
```

## Target Layout

```
┌─────────────────────────────────────┐
│ Header (fixed)                      │
├─────────────────────────────────────┤
│ Welcome Section (fixed)             │
├─────────────────────────────────────┤
│                                     │
│ Stat Cards Grid (flex: 1)           │
│ (expands to fill ~49% of space)     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Action Cards Grid (flex: 1)         │
│ (expands to fill ~49% of space)     │
│                                     │
├─────────────────────────────────────┤
│ ~2% bottom padding                  │
└─────────────────────────────────────┘
```

## Technical Changes

### File: `src/pages/Dashboard.tsx`

#### Change 1: Reduce bottom padding on main container

**Line 67 - Current:**
```tsx
<main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
```

**Change to:**
```tsx
<main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[2%] relative z-10">
```

This reduces bottom padding to exactly 2% of viewport.

#### Change 2: Create a flex container for both card grids that fills remaining space

Wrap both card grids in a flex container that grows to fill available height, with each grid taking equal space:

**Lines 103-193 - Current structure:**
```tsx
{/* Quick Stats - Equal height cards */}
<div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4 mb-3 sm:mb-4">
  {/* 4 stat cards */}
</div>

{/* Quick Actions - Equal height cards */}
<div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4">
  {/* 4 action cards */}
</div>
```

**Change to:**
```tsx
{/* Card grids container - fills remaining viewport */}
<div className="flex-1 flex flex-col gap-2 sm:gap-4 min-h-0">
  {/* Quick Stats - Equal height cards */}
  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4 min-h-0">
    {/* 4 stat cards with h-full */}
  </div>

  {/* Quick Actions - Equal height cards */}
  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4 min-h-0">
    {/* 4 action cards with h-full */}
  </div>
</div>
```

Key classes:
- `flex-1`: Each grid takes equal share of remaining space
- `min-h-0`: Prevents flex items from overflowing (critical for nested flex)
- `auto-rows-fr`: All rows within each grid are equal height

## How It Works

```
Viewport Height: 100vh
┌────────────────────────────────────────┐
│ Header (~60-80px fixed)                │
├────────────────────────────────────────┤
│ Welcome Section (~80-100px fixed)      │
├────────────────────────────────────────┤
│                                        │
│ ┌─ Flex Container (flex-1) ──────────┐ │
│ │                                    │ │
│ │ Stat Cards Grid (flex-1)           │ │
│ │ [Card][Card][Card][Card]           │ │
│ │                                    │ │
│ ├────────────────────────────────────┤ │
│ │                                    │ │
│ │ Action Cards Grid (flex-1)         │ │
│ │ [Card][Card][Card][Card]           │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ 2% bottom padding                      │
└────────────────────────────────────────┘
```

On mobile (2x2 grids):
```
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│ Welcome              │
├──────────────────────┤
│ [Stat1] [Stat2]      │
│ [Stat3] [Stat4]      │
├──────────────────────┤
│ [Action1] [Action2]  │
│ [Action3] [Action4]  │
├──────────────────────┤
│ 2% padding           │
└──────────────────────┘
```

## Files to Change

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add flex wrapper container, change grids to `flex-1`, update padding to `pb-[2%]` |

## Expected Result

- Cards fill entire available viewport height on all screen sizes
- Stat cards and action cards each occupy approximately 50% of the available card area
- Only 2% padding remains at the bottom
- On mobile: 2x2 grids still work correctly, each card fills its proportional space
- On desktop: 1x4 grids expand vertically to fill the screen
- No content clipping or overflow issues
- Consistent behavior across all specified screen sizes (QHD, WUXGA, FHD, HD+, HD, SXGA, iPhone 12 Pro, Pixel 5, WQHD)
