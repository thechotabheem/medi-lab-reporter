

# Remove Background Animation

## Overview

Remove the animated background effects from the application while preserving the core dark theme and static styling. This will result in a cleaner, more static background that's less distracting.

---

## Elements to Remove

| Element | Location | Description |
|---------|----------|-------------|
| **Shimmer overlay** | `.dashboard-bg-shimmer` in index.css | Animated sweep of teal light across the screen (8s infinite animation) |

---

## Elements to Keep

- Cursor glow component in EnhancedPageLayout | Radial gradient that follows mouse movement
- Dot grid pattern .dashboard-bg::before` in index.css Fixed dot pattern overlay with subtle teal dots
- Vignette overlay .dashboard-bg::after` in index.css Dark edge gradient for depth effect
- Header border shimmer .app-header::before` keyframes Animated gradient border at bottom of header
- **Base dark background color** (`hsl(220 15% 4%)`)
- **Static teal radial glow** at top (the subtle ambient lighting)
- **Card hover effects and transitions**
- **All other UI animations** (page transitions, button states, accordions)

---

## Files to Modify

### 1. `src/index.css`

**Remove/disable:**
- Lines 324-349: `.dashboard-bg-shimmer` class and `@keyframes bg-shimmer`


**Keep:**
- The `.dashboard-bg` base class with the static teal radial gradient
- CursorGlow` component in EnhancedPageLayout Radial gradient that follows mouse movement
- Dot grid pattern.dashboard-bg::before` in index.css Fixed dot pattern overlay with subtle teal dots
- Vignette overlay`.dashboard-bg::after` in index.css Dark edge gradient for depth effect |
- Header border shimmer`.app-header::before` keyframes Animated gradient border at bottom of header

### 2. `src/components/ui/enhanced-page-layout.tsx`

**Remove:**
- The `<div className="dashboard-bg-shimmer" />` element

---

## Result

After these changes, pages will have:
- A clean, static dark background with subtle teal ambient lighting at the top
- Faster perceived performance (fewer animations running)
- All interactive animations (hover, click, transitions) still working

