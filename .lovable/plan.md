
# Animated Rainbow Gradient for Clinic Name

## Overview
Add a stunning animated color-changing gradient effect to display "Zia Clinic & Maternity Home" with 7 vibrant, eye-catching colors that smoothly transition through each other.

## Color Palette (7 Eye-Catching Colors)
1. **Magenta** (#FF00FF) - Vivid pink-purple
2. **Electric Blue** (#00D4FF) - Bright cyan
3. **Lime Green** (#39FF14) - Neon green
4. **Golden Yellow** (#FFD700) - Rich gold
5. **Hot Pink** (#FF1493) - Deep pink
6. **Electric Orange** (#FF6B00) - Vibrant orange
7. **Violet** (#8B5CF6) - Purple

---

## Implementation Steps

### Step 1: Add CSS Animation Keyframes
Add a new `@keyframes` rule in `src/index.css` that cycles through all 7 gradient positions, creating a smooth infinite loop.

### Step 2: Create Animated Gradient Class
Add a new utility class `.text-gradient-rainbow` that:
- Uses a wide linear gradient with all 7 colors
- Applies `background-clip: text` for text effect
- Uses `background-size: 400%` to enable animation movement
- Animates the `background-position` to create the flowing color effect

### Step 3: Update Dashboard Component
In `src/pages/Dashboard.tsx`, apply the new animated gradient class to the clinic name span element.

---

## Technical Details

### CSS Changes (src/index.css)

```css
/* Rainbow gradient animation keyframes */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Animated rainbow text gradient */
.text-gradient-rainbow {
  background: linear-gradient(
    90deg,
    #FF00FF,   /* Magenta */
    #00D4FF,   /* Electric Blue */
    #39FF14,   /* Lime Green */
    #FFD700,   /* Golden Yellow */
    #FF6B00,   /* Electric Orange */
    #FF1493,   /* Hot Pink */
    #8B5CF6,   /* Violet */
    #FF00FF    /* Back to Magenta for seamless loop */
  );
  background-size: 400% 400%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-shift 6s ease infinite;
}
```

### Dashboard Changes (src/pages/Dashboard.tsx)
Replace the current clinic name styling:
```tsx
// From:
<span className="text-foreground font-medium">{clinicName}</span>

// To:
<span className="text-gradient-rainbow font-semibold">{clinicName}</span>
```

---

## Visual Result
The clinic name "Zia Clinic & Maternity Home" will display with:
- Smooth flowing colors that shift from left to right
- Seamless infinite loop animation (6 second cycle)
- Bold, eye-catching appearance that draws attention
- Professional yet vibrant aesthetic that fits the dark theme

---

## Files to Modify
1. `src/index.css` - Add new keyframes and gradient class
2. `src/pages/Dashboard.tsx` - Apply the new class to clinic name
