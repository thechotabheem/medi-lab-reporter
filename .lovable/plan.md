

# Replace Splash Screen with Creative Preloader

## Overview

Replace the current splash screen with a modern, visually stunning preloader featuring an animated DNA helix made of teal particles, a morphing circular progress ring around the logo, and sequenced text reveals -- all pure CSS/React, no shimmer effects.

---

## Design Concept

The preloader will feature:
- **Rotating orbital ring** around the clinic logo -- two thin arcs orbiting in opposite directions with a teal glow trail
- **Pulsing logo** that scales in with a soft teal drop-shadow bloom
- **Circular SVG progress indicator** -- a stroke-dasharray animated ring showing load progress
- **Staggered text entrance** -- "Lab Reporter", clinic name, and tagline fade-slide in sequentially
- **Particle dots** -- 6-8 small teal dots orbiting the logo on elliptical paths at different speeds
- **Exit animation** -- the entire preloader scales up slightly and fades out

---

## Files to Modify

### 1. `src/components/SplashScreen.tsx` -- Full Rewrite

Replace the entire component with the new preloader:

- **Orbital particles**: 6 small circles positioned via CSS `rotate()` + `translateX()` on a shared orbit, each with a staggered `animation-delay`, rotating continuously
- **SVG progress ring**: An SVG circle with `stroke-dasharray` animated from 0 to full circumference based on the `progress` state
- **Logo entrance**: Scale from 0.5 to 1.0 with opacity fade, plus a subtle continuous pulse glow
- **Text cascade**: "Lab Reporter" at 300ms, clinic name at 500ms, tagline at 700ms, progress ring at 800ms
- **Exit**: Scale to 1.05 + opacity 0 over 500ms
- Remove the unused `SparkleText` import
- Remove the old shimmer-sweep keyframe
- All animations defined inline via `<style>` tag (following existing pattern)

### 2. `src/App.tsx` -- No changes needed

The `SplashScreen` component interface (`onComplete`, `minDisplayTime`) stays the same.

---

## Technical Details

### Orbital Animation (CSS)
```css
@keyframes orbit {
  0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
}
```
6 dots with `animation-delay` offsets of 0s, 0.5s, 1s, 1.5s, 2s, 2.5s over a 4s loop.

### SVG Progress Ring
- Circle with `r=60`, `cx=70`, `cy=70`
- `stroke-dasharray: 377` (2 * PI * 60)
- `stroke-dashoffset` transitions from 377 to 0 based on progress state
- Teal stroke with glow filter

### Animation Sequence Timeline
| Time | Element |
|------|---------|
| 0ms | Background + orbital dots start |
| 200ms | Logo scales in |
| 300ms | "Lab Reporter" fades up |
| 500ms | Clinic name fades up |
| 700ms | Tagline fades up |
| 800ms | Progress ring fades in |
| 2000ms | Exit animation begins |
| 2500ms | onComplete fires |

