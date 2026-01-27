
# Add Pulsing Glow Effect to Dashboard Stat Cards

## Overview
Add an animated pulsing glow effect to the dashboard stat cards that complements the vibrant rainbow clinic name styling. The glow will use the primary teal color and pulse subtly to create visual harmony with the animated elements.

## Implementation

### 1. Add New CSS Animation (src/index.css)

Add a new keyframe animation for the pulsing glow effect and a utility class to apply it:

```css
/* Pulsing glow animation for cards */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 15px hsl(162 84% 42% / 0.15),
                0 0 30px hsl(162 84% 42% / 0.08);
  }
  50% {
    box-shadow: 0 0 25px hsl(162 84% 42% / 0.3),
                0 0 50px hsl(162 84% 42% / 0.15);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}
```

### 2. Update StatCard Component (src/components/ui/stat-card.tsx)

Add a new optional `glowEffect` prop to the StatCard component that enables the pulsing glow:

```tsx
interface StatCardProps {
  // ... existing props
  glowEffect?: boolean;
}

export function StatCard({
  // ... existing props
  glowEffect = false,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group transition-all duration-300 ease-out",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        glowEffect && "animate-pulse-glow border-primary/20",
        className
      )}
      // ...
    />
  );
}
```

### 3. Enable Glow on Dashboard Stats (src/pages/Dashboard.tsx)

Add the `glowEffect` prop to each StatCard in the dashboard:

```tsx
<StatCard
  title="Total Reports"
  value={...}
  icon={FileText}
  glowEffect
  // ...
/>
```

## Visual Result

- Each stat card will have a subtle, rhythmic pulsing teal glow
- The glow intensity oscillates between soft (15px/8% opacity) and bright (25px/30% opacity)
- 3-second animation cycle for a calm, professional feel
- Border gets a subtle primary tint to enhance the glowing appearance
- Complements the rainbow gradient and sparkle effects on the clinic name

## Technical Notes

- The pulsing animation uses the same primary teal color (162 84% 42%) as existing glow effects
- Animation is smooth with `ease-in-out` timing for natural breathing effect
- The effect is opt-in via a prop, so it can be reused elsewhere without affecting existing StatCards
