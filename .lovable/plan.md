# Match PDF Layout to Sample CBC Report

## Overview

Fine-tune the existing React-PDF components to exactly match the sample CBC report layout. The current code is already close, but there are several specific differences that need fixing.

## Changes Needed

### 1. ReportHeader -- Add clinic name and accent line

The sample shows **"Dr Touseef-ur-Rehman Zia"** in bold white text on the right side of the header, above the contact details. The current code only shows phone and email. Also, a thin accent/gradient line appears below the dark azure header box.

**File:** `src/lib/pdf/components/ReportHeader.tsx`

- Add a thin colored accent line (2px, using the accent color) below the header rectangle

### 3. TestResultsTable -- Thicker borders, better spacing

The sample has more visible cell borders than the current 0.3pt. The table also has slightly more padding.

**File:** `src/lib/pdf/components/TestResultsTable.tsx`

- Increase border width from 0.3 to 0.5-0.7 for more visible grid lines
- Adjust cell padding to match the sample's spacing
- Ensure header row padding matches

### 4. PatientInfoBox -- Larger text, thicker border

The sample has slightly bolder/larger patient info text and a more visible border around the box.

**File:** `src/lib/pdf/components/PatientInfoBox.tsx`

- Increase base font size from 11 to ~13pt to match the sample
- Increase border width from 0.5 to ~1pt for a more visible box outline
- Increase vertical divider thickness slightly

### 5. ReportDocument -- Fix broken signature section

The current signature section in `ReportDocument.tsx` has a broken `<View>` structure with empty nested Views instead of the "Authorized Signature" text. This should be removed since the footer component already handles the signature.

**File:** `src/lib/pdf/ReportDocument.tsx`

- Remove the broken inline signature block (lines 127-135)
- Pass `isLastPage={true}` to `ReportFooter` so it renders the "Authorized Signature" line

### 6. CategoryHeader -- Match divider color

The sample's category divider line uses the accent color. This is already implemented, so this just needs verification that the accent color flows through correctly.

---

## Technical Details

### Files Modified


| File                                          | Change                                                 | &nbsp; |
| --------------------------------------------- | ------------------------------------------------------ | ------ |
| `src/lib/pdf/components/ReportHeader.tsx`     | Add accent line below header                           | &nbsp; |
| &nbsp;                                        | &nbsp;                                                 | &nbsp; |
| `src/lib/pdf/components/TestResultsTable.tsx` | Increase border thickness and cell padding             | &nbsp; |
| `src/lib/pdf/components/PatientInfoBox.tsx`   | Increase font size and border visibility               | &nbsp; |
| `src/lib/pdf/ReportDocument.tsx`              | Remove broken signature block, enable footer signature | &nbsp; |


### No New Dependencies

All changes are styling/layout adjustments within existing components.