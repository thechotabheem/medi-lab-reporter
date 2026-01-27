

# Unify Action Card Icon Colors

## Current Situation
The four quick action cards on the dashboard have different icon color variants:

| Card | Current `iconVariant` | Appearance |
|------|----------------------|------------|
| New Report | `default` | Green/Teal |
| View Reports | `default` | Green/Teal |
| Patients | `secondary` | White/Gray |
| Settings | `muted` | White/Gray |

This was an intentional design choice to create visual hierarchy, but it may appear inconsistent.

## Solution
Change all action cards to use the same `iconVariant="default"` for visual consistency, giving them all the signature teal/green color.

## Changes

### File: `src/pages/Dashboard.tsx`

Update the Patients and Settings ActionCard components:

**Patients Card (line ~171)**
```text
Change: iconVariant="secondary"
To:     iconVariant="default"
```

**Settings Card (line ~180)**
```text
Change: iconVariant="muted"  
To:     iconVariant="default"
```

## Result
All four quick action cards will have consistent green/teal icons, matching the application's primary brand color for a unified, cohesive look.

