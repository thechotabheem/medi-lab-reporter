
# Add Rainbow Gradient to Header Clinic Name

## Overview
Apply the same animated rainbow gradient effect to the clinic name displayed in the header area, matching the style already used in the welcome section.

## Current State
The header currently shows:
- "MedLab Reporter" as the main title
- Clinic name below it with muted foreground color (`text-muted-foreground`)

## Change Required

### File: `src/pages/Dashboard.tsx`

**Line 61-63** - Update the clinic name paragraph styling:

```tsx
// From:
<p className="text-2xs sm:text-xs text-muted-foreground">
  {clinicName}
</p>

// To:
<p className="text-2xs sm:text-xs text-gradient-rainbow font-medium">
  {clinicName}
</p>
```

## Result
Both instances of "Zia Clinic & Maternity Home" will display with the animated 7-color rainbow gradient:
1. In the header (below MedLab Reporter)
2. In the welcome section subtitle

This creates a cohesive, eye-catching brand presence throughout the dashboard.
