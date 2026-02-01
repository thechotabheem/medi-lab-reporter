
# Remove Category Headings & Convert to List Layout

## Current State

The TemplateSelector component currently:
- Groups tests into 3 categories with headings ("Value Based Tests", "Screening Tests (Negative/Positive)", "Blood Group & Typing")
- Uses a responsive grid layout with cards for each test type
- Cards have icon, name, and field count

## Proposed Changes

Convert to a simple flat list layout without category headings:

| File | Change |
|------|--------|
| `src/components/reports/TemplateSelector.tsx` | Remove category grouping, flatten to single list, change from grid cards to list rows |

## New Layout Design

Each test type will be a horizontal list item with:
- Icon on the left
- Test name in the middle
- Field count on the right
- Checkmark indicator when selected

```
┌────────────────────────────────────────────────┐
│ 🧪  Complete Blood Count (CBC)      15 fields ✓│
├────────────────────────────────────────────────┤
│ 🧪  Liver Function Test (LFT)       11 fields  │
├────────────────────────────────────────────────┤
│ 🧪  Renal Function Test (RFT)        8 fields  │
└────────────────────────────────────────────────┘
```

## Technical Details

### Before (Grid with Categories)
```tsx
<div className="space-y-8">
  {categoryLabels.map((category) => (
    <div>
      <h3>{category.label}</h3>  {/* REMOVE */}
      <div className="grid grid-cols-2 ...">  {/* CHANGE TO LIST */}
        {category.types.map((type) => (
          <Card>...</Card>
        ))}
      </div>
    </div>
  ))}
</div>
```

### After (Flat List)
```tsx
// Flatten all types into single array
const allTestTypes: ReportType[] = [
  'cbc', 'lft', 'rft', 'lipid_profile', 'esr', 'bsr', 'bsf', 'serum_calcium',
  'mp', 'typhoid', 'hcv', 'hbsag', 'hiv', 'vdrl', 'h_pylori',
  'blood_group', 'ra_factor'
];

<div className="space-y-2">
  {allTestTypes.map((type) => (
    <div 
      key={type}
      onClick={() => onSelect(type)}
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                 hover:border-primary hover:bg-primary/5
                 {selected ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''}"
    >
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <span className="flex-1 font-medium">{template.name}</span>
      <span className="text-sm text-muted-foreground">{fieldCount} fields</span>
      {selected && <Badge>✓</Badge>}
    </div>
  ))}
</div>
```

## Visual Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Layout | Grid of cards | Vertical list |
| Headings | 3 category headings | No headings |
| Test items | Cards with stacked content | Horizontal rows |
| Spacing | Large gaps between groups | Compact uniform spacing |

## Benefits

1. **Simpler navigation** - All tests visible in one scrollable list
2. **Faster selection** - No need to scan multiple grid sections
3. **More compact** - Takes less vertical space
4. **Mobile-friendly** - List items work better on narrow screens
