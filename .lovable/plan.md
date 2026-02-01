
# Add Custom Emerald Green Scrollbar

## Overview

Transform the scrollbar across the entire application from the current muted gray to a beautiful emerald/teal green that matches the app's primary color palette. This will create visual consistency with the premium medical aesthetic.

## Current State

The existing scrollbar uses muted gray colors:
```css
::-webkit-scrollbar-thumb {
  @apply bg-muted rounded-full;
}
```

## Proposed Design

| Element | Current | New (Emerald Green) |
|---------|---------|---------------------|
| Track | `bg-background` (dark) | `bg-background` with subtle teal tint |
| Thumb | `bg-muted` (gray) | Teal gradient with glow effect |
| Thumb hover | `bg-muted-foreground/50` | Brighter teal with enhanced glow |

## Technical Changes

### File: `src/index.css`

Update the global scrollbar styles in the `@layer base` section:

```css
/* Custom emerald/teal scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: hsl(220 15% 6%);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    hsl(162 84% 35%) 0%,
    hsl(162 84% 42%) 50%,
    hsl(162 84% 35%) 100%
  );
  border-radius: 5px;
  border: 2px solid hsl(220 15% 6%);
  box-shadow: 0 0 8px hsl(162 84% 42% / 0.3);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    hsl(162 84% 42%) 0%,
    hsl(162 84% 52%) 50%,
    hsl(162 84% 42%) 100%
  );
  box-shadow: 0 0 12px hsl(162 84% 42% / 0.5);
}

/* Firefox scrollbar support */
* {
  scrollbar-width: thin;
  scrollbar-color: hsl(162 84% 42%) hsl(220 15% 6%);
}
```

### File: `src/components/ui/scroll-area.tsx`

Update the ScrollBar component's thumb to use the teal color:

```tsx
<ScrollAreaPrimitive.ScrollAreaThumb 
  className="relative flex-1 rounded-full bg-primary/80 hover:bg-primary transition-colors shadow-[0_0_8px_hsl(162_84%_42%/0.3)]" 
/>
```

## Visual Preview

```text
BEFORE (gray):
┃░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░┃▓▓▓▓
                                           ^^^^
                                        gray thumb

AFTER (emerald):
┃░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░┃████ ✨
                                           ^^^^
                                     teal gradient + glow
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/index.css` | Update webkit scrollbar styles with teal gradient, glow effect, and Firefox support |
| `src/components/ui/scroll-area.tsx` | Update ScrollBar thumb to use primary teal color with glow |

## Benefits

1. **Brand Consistency** - Scrollbar now matches the teal accent color used throughout the app
2. **Premium Feel** - Gradient and glow effects elevate the perceived quality
3. **Cross-Browser Support** - Firefox scrollbar fallback ensures consistency
4. **Subtle Enhancement** - Visible improvement without being distracting
