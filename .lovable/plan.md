
# Add Subtle Gradient & Pattern Background to Dashboard

## Overview

Enhance the dashboard with a layered background system that adds visual depth while maintaining the premium dark medical aesthetic. The design will combine subtle gradients with a geometric dot/grid pattern for added texture.

## Design Approach

Create a multi-layered background effect:
1. **Base gradient** - Radial gradient emanating from top center with subtle teal tint
2. **Dot grid pattern** - Very subtle repeating dot pattern using CSS for texture
3. **Vignette overlay** - Subtle darkening at edges for depth

This approach keeps the background subtle enough not to compete with content while adding visual sophistication.

## Technical Implementation

| File | Change |
|------|--------|
| `src/index.css` | Add new background pattern CSS classes |
| `src/pages/Dashboard.tsx` | Apply new background classes to page container |

### New CSS Classes (in `src/index.css`)

```css
/* Dashboard gradient background */
.dashboard-bg {
  position: relative;
  background: 
    /* Radial gradient from top */
    radial-gradient(
      ellipse 80% 50% at 50% -20%,
      hsl(162 84% 42% / 0.08) 0%,
      transparent 50%
    ),
    /* Base background */
    hsl(var(--background));
}

/* Subtle dot pattern overlay */
.dashboard-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(
    circle at center,
    hsl(var(--primary) / 0.03) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 0;
}

/* Vignette overlay for depth */
.dashboard-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    hsl(220 15% 2% / 0.4) 100%
  );
  pointer-events: none;
  z-index: 0;
}
```

### Dashboard.tsx Updates

Replace the current `page-container` class with the enhanced version:

```tsx
// Before
<div className="page-container">

// After
<div className="page-container dashboard-bg">
```

Ensure content remains above the background layers by adding relative positioning:

```tsx
<main className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
```

## Visual Effect

```
┌─────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Dot grid (very subtle)
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░ ╭────────────────────────╮ ░░░░░░░░░  │
│  ░░░░ │   Teal radial glow    │ ░░░░░░░░░  │  ← Gradient from top
│  ░░░░ ╰────────────────────────╯ ░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓  │  ← Vignette at edges
└─────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Opacity levels** - All effects use very low opacity (3-8%) to remain subtle
2. **Fixed positioning** - Pattern and vignette use `position: fixed` so they don't scroll
3. **Z-index layering** - Background elements at z-0, content at z-10+
4. **Teal accent** - Gradient uses the primary teal color for brand consistency
5. **Dot grid size** - 24px spacing for a refined, not busy pattern

## Benefits

- Adds visual depth without being distracting
- Reinforces the premium medical lab aesthetic
- Works harmoniously with existing CursorGlow effect
- Subtle movement/texture makes the UI feel more alive
- Maintains excellent readability and contrast
