

# Simplify Header Icon Animation

## Problem
The header icon currently has two overlapping animations:
- A continuous **pulse** animation on the wrapper (2 seconds)
- A **floating + rotation** animation on the icon (3 seconds)

These unsynchronized animations create a chaotic, flickering appearance.

## Solution
Replace both animations with a single, elegant "breathe" effect that's:
- **Simple**: One smooth animation instead of two conflicting ones
- **Modern**: Subtle scale change that feels alive without being distracting
- **Professional**: Minimal movement that maintains focus on the content

## Changes

### 1. Update Dashboard Header Icon
**File:** `src/pages/Dashboard.tsx`

Remove both existing animations and apply a single subtle animation:
- Remove `animate-[pulse_2s_ease-in-out_infinite]` from `IconWrapper`
- Remove `animate-[float_3s_ease-in-out_infinite]` from `FlaskConical`
- Add a gentle hover-only scale effect for interactivity

### 2. Create Simple Breathe Animation
**File:** `src/index.css`

Add a new subtle "breathe" keyframe:
- Very slow animation (4+ seconds)
- Minimal scale change (1.0 to 1.05)
- Smooth easing for a calm, modern feel

## Visual Result
- **At rest**: Icon displays with a subtle, slow breathing effect
- **On hover**: Slightly enhanced glow (already implemented on the title)
- **Overall**: Clean, professional, and modern without distraction

---

**Technical Details**

The new animation will use:
```css
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

Applied with a 4-second duration for a calm, barely-noticeable effect that adds life without being overwhelming.

