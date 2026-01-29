
# Database Reset Plan

## Overview
Delete all patient and report data from the database while keeping the clinic configuration intact.

## What Will Be Deleted

| Table | Current Count | Action |
|-------|---------------|--------|
| reports | 5 | Delete all |
| report_images | 0 | Delete all (already empty) |
| patients | 3 | Delete all |

## What Will Be Kept
- Clinic settings (name, logo, contact info, accent color)
- Custom templates (if any)

## Implementation Steps

1. **Delete report images first** (depends on reports)
   - `DELETE FROM report_images`

2. **Delete all reports** (depends on patients)
   - `DELETE FROM reports`

3. **Delete all patients**
   - `DELETE FROM patients`

## Technical Notes
- The deletions must happen in this order due to foreign key relationships
- The global clinic (ID: `00000000-0000-0000-0000-000000000001`) will remain untouched
- No code changes are required - this is a data-only operation

## After Reset
- Dashboard will show 0 patients and 0 reports
- You can immediately start adding new patients and creating reports
- All app functionality remains intact
