

# PDF Report Layout Restructuring

## Overview
Restructure the PDF report to match the specified layout with a cleaner, more traditional medical report format.

## Key Layout Changes

### 1. Header Section (Logo Left, Contact Right)
- Logo area on the **left** side
- Address, Phone, Email aligned to the **right** side (stacked vertically)
- Horizontal divider line below

### 2. Patient Information Block
Reorganized 2-column grid with these specific field positions:
- **Left column**: Name, Age/Gender, Referring Dr, Report Date
- **Right column**: Patient ID, Report No, Collection Date, Status
- Section title: "PATIENT INFORMATION"

### 3. Test Results Table
- Stays the same with columns: Test, Result, Unit, Range, Status
- Section title: "TEST RESULTS"

### 4. Signature Section (Simplified)
- Only **one** signature line: "Lab Technician's Signature"
- Single horizontal line with label underneath
- Removed the second (Pathologist) signature from default layout

### 5. Comments and Notes (Moved After Results)
- Currently clinical notes appear **before** the test results table
- Move them to **after** the signature section
- Centered section title "COMMENTS & NOTES" with content area below

### 6. Footer (Simplified)
- Single centered line: "Generated: [Date]"
- Replaces the current page number + footer text approach

## Technical Details

### File Modified
- `src/lib/pdf-generator.ts` -- Rework the following functions/sections:
  - **`drawHeader()`**: Logo left, contact details right-aligned (address, phone, email stacked on right)
  - **Patient Info block** (lines ~478-539): Reorder fields to match the specified grid, add "PATIENT INFORMATION" section title
  - **Clinical Notes** (lines ~541-556): Move this block to after the signature section
  - **Signature section** (lines ~762-801): Simplify to a single "Lab Technician's Signature" line
  - **Footer** (lines ~404-423): Replace with centered "Generated: [Date]" text
  - These changes apply to **both** Modern and Classic styles

### No other files affected
The PDF generator is self-contained; preview thumbnails will automatically reflect the new layout.

