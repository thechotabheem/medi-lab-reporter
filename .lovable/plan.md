
# Add Cursor-Following Glow Effect

## Overview
Add a subtle, elegant glow effect that follows the cursor position in two places:
1. **Background**: A diffused ambient glow that follows the cursor across the entire dashboard
2. **Action Cards**: A localized glow spotlight inside each card that tracks cursor movement

---

## Implementation Approach

### Part 1: Background Cursor Glow

Create a new component that renders a full-page glow effect following the cursor. This will be a fixed-position element with a radial gradient that updates position based on mouse coordinates.

### Part 2: Action Card Internal Glow

Extend the existing `handleMouseMove` logic in ActionCard to also position a glow element inside each card, creating a spotlight effect that follows the cursor within the card bounds.

---

## Implementation Steps

### Step 1: Create Background Cursor Glow Component
**New File:** `src/components/ui/cursor-glow.tsx`

Create a reusable component that:
- Tracks global mouse position using `mousemove` event listener
- Renders a fixed-position radial gradient glow
- Smoothly animates position changes using CSS transitions
- Fades in on mount for a polished entrance

```tsx
import { useState, useEffect } from 'react';

export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  return (
    <div
      className="fixed pointer-events-none z-0 transition-opacity duration-700"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, hsl(162 84% 42% / 0.06) 0%, transparent 70%)',
        opacity: isVisible ? 1 : 0,
      }}
    />
  );
}
```

### Step 2: Add Background Glow to Dashboard
**File:** `src/pages/Dashboard.tsx`

Import and render the `CursorGlow` component at the top of the page container, behind all other content.

```tsx
import { CursorGlow } from '@/components/ui/cursor-glow';

// Inside return, right after page-container opens:
<CursorGlow />
```

### Step 3: Add Internal Glow to Action Cards
**File:** `src/components/ui/action-card.tsx`

Extend the existing mouse tracking to also control an internal glow element:

1. Add a new state for the glow position
2. Calculate glow position relative to card during `handleMouseMove`
3. Render a positioned glow element inside the card
4. Fade out glow on mouse leave

```tsx
// Add new state
const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0, opacity: 0 });

// In handleMouseMove, add:
setGlowPosition({ x, y, opacity: 1 });

// In handleMouseLeave, add:
setGlowPosition(prev => ({ ...prev, opacity: 0 }));

// Add glow element inside Card, before CardHeader:
<div
  className="absolute pointer-events-none transition-opacity duration-300"
  style={{
    left: glowPosition.x,
    top: glowPosition.y,
    transform: 'translate(-50%, -50%)',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, hsl(162 84% 42% / 0.15) 0%, transparent 70%)',
    opacity: glowPosition.opacity,
  }}
/>
```

### Step 4: Add CSS Support for Cursor Glow
**File:** `src/index.css`

Add utility class for the cursor glow component:

```css
/* Cursor-following glow effect */
.cursor-glow {
  transition: left 0.15s ease-out, top 0.15s ease-out;
}
```

---

## Technical Details

### Background Glow Specifications

| Property | Value | Purpose |
|----------|-------|---------|
| Size | 600px x 600px | Large enough for soft ambient effect |
| Gradient | radial, 0-70% | Smooth falloff to transparent |
| Color | primary at 6% opacity | Subtle teal glow matching theme |
| Z-index | 0 | Behind all content |
| Transition | 0.15s ease-out | Smooth cursor tracking |

### Action Card Glow Specifications

| Property | Value | Purpose |
|----------|-------|---------|
| Size | 150px x 150px | Proportional to card size |
| Gradient | radial, 0-70% | Focused spotlight effect |
| Color | primary at 15% opacity | More visible within card context |
| Fade | 300ms | Smooth appearance/disappearance |

### Performance Considerations

- Uses CSS transitions instead of JavaScript animation for GPU acceleration
- Event listeners are properly cleaned up on unmount
- State updates are batched where possible
- `pointer-events: none` ensures glow doesn't interfere with interactions

---

## Files to Modify/Create

1. **NEW: `src/components/ui/cursor-glow.tsx`** - Background cursor glow component
2. **`src/pages/Dashboard.tsx`** - Add CursorGlow component
3. **`src/components/ui/action-card.tsx`** - Add internal glow tracking and element
4. **`src/index.css`** - Add cursor-glow utility class

---

## Visual Result

The final effect creates a cohesive, premium feel:
- Moving the cursor across the dashboard reveals a soft ambient teal glow in the background
- Hovering over action cards shows a concentrated spotlight effect that follows the cursor
- Combined with existing tilt and parallax effects, creates a layered, responsive interface
- All animations are subtle and performant, enhancing without distracting
