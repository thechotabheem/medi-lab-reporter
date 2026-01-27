
# Unified Glow Effect for All Dashboard Cards

## Problem Identified
The "Total Reports" and "Patients" cards have an `onClick` handler that adds `hover:shadow-lg` styling, which overrides the teal glow effect from `.animate-pulse-glow:hover`. The "This Month" and "Pending" cards don't have `onClick`, so they display the correct glow.

## Solution
Remove the conflicting `hover:shadow-lg` from the StatCard and ActionCard components when `glowEffect` is enabled, so the CSS-based glow animation takes precedence.

---

## Implementation Steps

### Step 1: Update StatCard Component
**File:** `src/components/ui/stat-card.tsx`

Modify the conditional classes so that when `glowEffect` is true, the `hover:shadow-lg` is not applied (since the glow CSS already handles the hover shadow).

**Change:**
```tsx
// Current (line 47-50):
className={cn(
  "group transition-all duration-300 ease-out relative overflow-hidden",
  onClick && "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
  glowEffect && "animate-pulse-glow border-primary/20",
  className
)}

// Updated:
className={cn(
  "group transition-all duration-300 ease-out relative overflow-hidden",
  onClick && "cursor-pointer",
  onClick && !glowEffect && "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
  glowEffect && "animate-pulse-glow border-primary/20",
  className
)}
```

### Step 2: Update ActionCard Component  
**File:** `src/components/ui/action-card.tsx`

Apply the same fix to prevent `hover:shadow-lg` from conflicting with the glow effect.

**Change:**
```tsx
// Current (line 40-46):
className={cn(
  "group cursor-pointer transition-all duration-300 ease-out h-full relative overflow-hidden",
  "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
  "active:translate-y-0 active:shadow-md",
  glowEffect && "animate-pulse-glow border-primary/20",
  className
)}

// Updated:
className={cn(
  "group cursor-pointer transition-all duration-300 ease-out h-full relative overflow-hidden",
  !glowEffect && "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
  !glowEffect && "active:translate-y-0 active:shadow-md",
  glowEffect && "animate-pulse-glow border-primary/20",
  className
)}
```

---

## Technical Details

### Why This Works
- The `hover:shadow-lg` Tailwind class applies a standard dark shadow on hover
- The `.animate-pulse-glow:hover` CSS applies a teal-colored glow shadow  
- Since both target the `box-shadow` property, the Tailwind class wins due to specificity/order
- By conditionally removing the conflicting Tailwind classes when `glowEffect` is enabled, the CSS-based glow effect takes full control

### Result
All 8 dashboard cards (4 StatCards + 4 ActionCards) will now have the same consistent teal pulsing glow effect with the proper hover intensification and scale effect.
