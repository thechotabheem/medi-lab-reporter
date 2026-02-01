
# Enhance Header Visual Appeal

## Overview

Transform the header from a simple sticky bar into a premium, visually striking component that matches the polished aesthetic of the dashboard. This enhancement will apply to both the main Dashboard header and the `PageHeader` component used across all other pages.

## Current State

The current `.app-header` style is minimal:
```css
.app-header {
  @apply sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur-xl;
}
```

## Proposed Enhancements

| Enhancement | Description |
|------------|-------------|
| Gradient border | Animated gradient bottom border instead of solid line |
| Inner glow | Subtle teal glow emanating from the top edge |
| Glass morphism upgrade | Enhanced frosted glass effect with subtle color tint |
| Animated accent | Gentle shimmer animation across the header |

## Technical Changes

### File: `src/index.css`

Update the `.app-header` class with enhanced visual effects:

```css
/* Header styles - Enhanced */
.app-header {
  @apply sticky top-0 z-40 backdrop-blur-xl;
  background: linear-gradient(
    180deg,
    hsl(var(--card) / 0.98) 0%,
    hsl(var(--card) / 0.92) 100%
  );
  border-bottom: 1px solid transparent;
  background-clip: padding-box;
  position: relative;
}

/* Animated gradient border */
.app-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(162 84% 42% / 0.3) 20%,
    hsl(162 84% 42% / 0.6) 50%,
    hsl(162 84% 42% / 0.3) 80%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: header-border-shimmer 6s ease-in-out infinite;
}

/* Subtle inner glow from top */
.app-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    180deg,
    hsl(162 84% 42% / 0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: -1;
}

@keyframes header-border-shimmer {
  0%, 100% {
    background-position: 200% 0;
  }
  50% {
    background-position: -200% 0;
  }
}
```

### File: `src/components/ui/page-header.tsx`

Enhance the PageHeader component with subtle animations:

- Add fade-in animation to the header content
- Apply breathe animation to the icon wrapper for consistency with Dashboard
- Add hover effect to the back button with glow

```tsx
<IconWrapper 
  size="default" 
  glow 
  className="shrink-0 hidden sm:flex animate-breathe"
>
```

## Visual Comparison

```text
BEFORE (flat):
┌────────────────────────────────────────────┐
│  ← icon  Title                     Actions │
├────────────────────────────────────────────┤  ← solid border
│                                            │

AFTER (premium):
┌────────────────────────────────────────────┐
│  ← icon  Title                     Actions │  ← subtle teal glow from top
╞═══════════════════════════════════════════╡  ← animated gradient border
│                                            │
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/index.css` | Enhanced `.app-header` with gradient background, animated border, and inner glow |
| `src/components/ui/page-header.tsx` | Add breathe animation to icon, improve hover states |

## Benefits

1. **Cohesive Design** - Header now matches the premium aesthetic of cards and background
2. **Animated Polish** - Subtle shimmer on border adds life without distraction
3. **Depth Perception** - Inner glow creates visual separation from content
4. **Consistency** - Both Dashboard and PageHeader share the same enhanced styling
