
# Reduce Sparkle Particles & Add Text Fade-In

## Overview
Make two refinements to create a more elegant entrance experience:
1. Reduce sparkle particle count from 8 to 5 (default)
2. Add a gentle fade-in animation to the rainbow gradient text so it appears in sync with the sparkles

---

## Implementation Steps

### Step 1: Reduce Default Sparkle Count
**File:** `src/components/ui/sparkle-text.tsx`

Change the default `sparkleCount` prop from 8 to 5:

```tsx
export const SparkleText: React.FC<SparkleTextProps> = ({
  children,
  className,
  sparkleCount = 5,  // Changed from 8 to 5
}) => {
```

### Step 2: Update Dashboard Sparkle Counts
**File:** `src/pages/Dashboard.tsx`

Update both usages to use fewer sparkles:
- Header (line 63): Change from `sparkleCount={8}` to `sparkleCount={5}`
- Welcome section (line 89): Change from `sparkleCount={10}` to `sparkleCount={6}` (slightly more for the larger context)

### Step 3: Add Text Fade-In Animation
**File:** `src/index.css`

Add a text fade-in animation to the `.text-gradient-rainbow` class that syncs with the sparkle appearance:

```css
/* Text entrance animation for rainbow gradient */
@keyframes text-fade-in {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.text-gradient-rainbow {
  /* existing styles... */
  animation: 
    text-fade-in 0.8s ease-out forwards,
    gradient-shift 6s ease 0.8s infinite, 
    rainbow-glow 6s ease 0.8s infinite;
}
```

---

## Technical Details

### Sparkle Count Changes

| Location | Current | New |
|----------|---------|-----|
| Default prop | 8 | 5 |
| Header usage | 8 | 5 |
| Welcome section | 10 | 6 |

### Text Animation Timing
The text fade-in is designed to sync with the sparkle appearance:

| Animation | Duration | Delay | Purpose |
|-----------|----------|-------|---------|
| text-fade-in | 0.8s | 0ms | Initial text appearance with subtle upward motion |
| gradient-shift | 6s (infinite) | 0.8s | Rainbow color cycling (starts after fade-in) |
| rainbow-glow | 6s (infinite) | 0.8s | Glow pulsing effect (starts after fade-in) |

### Why These Values
- **5 sparkles default**: Creates a cleaner, less busy visual while still maintaining the magical effect
- **0.8s text fade-in**: Slightly longer than sparkle fade-in (0.6s) so text fully appears as sparkles are settling in
- **4px translateY**: Subtle upward motion adds elegance without being distracting
- **Delayed infinite animations**: Gradient shift and glow start after fade-in completes for smooth transition

---

## Files to Modify

1. **src/components/ui/sparkle-text.tsx** - Change default sparkleCount from 8 to 5
2. **src/pages/Dashboard.tsx** - Update both sparkleCount prop values
3. **src/index.css** - Add text-fade-in animation and update .text-gradient-rainbow animation chain
