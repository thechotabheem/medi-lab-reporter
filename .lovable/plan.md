
# Fill Card Content to Match Card Height

## Problem

Currently, the cards expand to fill the viewport height, but the content inside them (icon, title, value, description) is positioned at the top with empty space below. The user wants the content to be distributed throughout the card to fill the available space.

## Solution

Use flexbox with `justify-between` or `justify-around` to vertically distribute the content within each card, making the content elements spread across the full card height.

## Technical Changes

### File: `src/components/ui/stat-card.tsx`

#### Change 1: Make Card use flex column layout

Update the Card component to use flex layout so its children fill the height:

**Line 115-126 - Add flex layout to Card:**
```tsx
<Card
  ref={containerRef}
  className={cn(
    "group transition-all duration-300 ease-out relative overflow-hidden h-full flex flex-col",
    // ... rest of classes
  )}
>
```

#### Change 2: Make CardHeader and CardContent distribute space

**Line 141 - Update CardHeader to be flex with space distribution:**
```tsx
<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 space-y-0 relative z-10 px-3 sm:px-6 pt-3 sm:pt-6 shrink-0">
```

**Line 152 - Update CardContent to grow and fill remaining space:**
```tsx
<CardContent className="relative z-10 px-3 sm:px-6 pb-3 sm:pb-6 pt-0 flex-1 flex flex-col justify-center">
```

This centers the value/subtitle content vertically in the remaining space.

### File: `src/components/ui/action-card.tsx`

#### Change 1: Add flex column with space distribution to Card

**Line 109-119 - Update Card:**
```tsx
<Card
  ref={containerRef}
  className={cn(
    "group cursor-pointer transition-all duration-300 ease-out relative overflow-hidden h-full flex flex-col",
    // ... rest of classes
  )}
>
```

#### Change 2: Update CardHeader to fill and distribute content

**Line 134 - Update CardHeader with justify-between:**
```tsx
<CardHeader className="p-3 sm:p-6 h-full flex flex-col justify-between relative z-10">
```

This will distribute the icon at top, title in middle, and description at bottom.

## Visual Representation

### Before (content at top):
```
┌─────────────────────┐
│ Title          Icon │
│ Value               │
│ Subtitle            │
│                     │
│                     │
│ (empty space)       │
│                     │
└─────────────────────┘
```

### After (content distributed):
```
┌─────────────────────┐
│ Title          Icon │
│                     │
│       Value         │
│      Subtitle       │
│                     │
│       Trend         │
└─────────────────────┘
```

For Action Cards:
```
┌─────────────────────┐
│   [Icon]            │
│                     │
│   Title             │
│                     │
│   Description       │
│   text here...      │
└─────────────────────┘
```

## Files to Change

| File | Change |
|------|--------|
| `src/components/ui/stat-card.tsx` | Add `flex flex-col` to Card, `shrink-0` to CardHeader, `flex-1 flex flex-col justify-center` to CardContent |
| `src/components/ui/action-card.tsx` | Add `flex flex-col` to Card, change CardHeader to use `justify-between` |

## Expected Result

- Content fills the entire card height on all screen sizes
- StatCard: Title/icon at top, value centered vertically, subtitle/trend below value
- ActionCard: Icon at top, title in middle area, description at bottom
- Content scales proportionally as cards grow on larger screens
- No empty whitespace within cards
