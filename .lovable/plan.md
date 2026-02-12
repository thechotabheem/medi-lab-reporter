

# Rebuild PDF Layout from Scratch -- Pixel-Perfect Match to Sample CBC Report

## Overview

Delete all current PDF component styles/layouts and rebuild every component from scratch to exactly replicate the sample CBC report. The structure, spacing, colors, fonts, borders, and status labels will all be matched precisely.

## Reference Layout (from sample)

The sample report has these exact sections top-to-bottom:

1. **Header bar**: Dark azure (#003366) rounded rectangle, ~90pt tall. Logo fills the left half. Right side has clinic name in large bold white text, then "Contact: phone" in white, then email in white -- all right-aligned.
2. **Accent line**: Thin teal/accent colored line (~2px) spanning the full width directly below the header.
3. **"Patient Report"** heading: Centered, ~18pt bold, dark text.
4. **Patient info box**: Rounded border (~1pt gray), two columns with a vertical center divider. Left column: Name, Age/Gender, Referred By, Patient ID. Right column: Report No, Collected On, Reported On. All ~13pt with bold labels.
5. **Category header**: Category name centered in ~16pt bold, with a full-width 1pt accent-colored divider line below.
6. **Test results table**: 5 columns (Test Name 28%, Reference Range 22%, Unit 14%, Result 16%, Status 20%). Header row has accent/teal background with white bold text. Data rows have visible grid borders (~0.7pt). Status text is color-coded: green=Normal, orange=Low-Abnormal/High-Abnormal, red=Low-Critical/High-Critical.
7. **Clinical notes box**: Bordered box with "Clinical Notes:-" label in bold teal.
8. **Footer area**: "Page # X/Y" dark rounded badge on the left, "Authorized Signature" with a line above it on the right. Full-width dark teal bar at the very bottom with bold white address on the left and right-aligned two-line timestamp.

## Exact Changes

### 1. `src/lib/pdf/utils.ts` -- Update status labels

Change `DetailedStatus` type from `'Low' | 'High'` to `'Low-Abnormal' | 'High-Abnormal'` to match the sample exactly.

Update `getDetailedValueStatus()` return values and `getStatusColor()` cases accordingly.

### 2. `src/lib/pdf/components/ReportHeader.tsx` -- Rebuild from scratch

- Dark azure (#003366) background, 90pt height, rounded corners, 5pt padding
- Left half: logo image, contained, left-aligned
- Right half: clinic name in bold white (~14pt), contact phone in white (10pt), email in white (10pt) -- all right-aligned, vertically centered
- 2pt accent-colored line below the header block
- "Patient Report" centered heading (18pt bold, dark text)

### 3. `src/lib/pdf/components/PatientInfoBox.tsx` -- Rebuild from scratch

- Rounded border (1pt, #d2d2d2), 3pt radius, 8pt padding
- Two 50% columns with 0.5pt vertical center divider
- Left: Name, Age/Gender, Referred By, Patient ID -- 13pt, bold labels
- Right: Report No, Collected On, Reported On -- 13pt, bold labels
- All text color #282828

### 4. `src/lib/pdf/components/TestResultsTable.tsx` -- Rebuild from scratch

- Header row: accent color background, white bold centered text (10pt)
- Column widths: 28%, 22%, 14%, 16%, 20%
- Data rows: 0.7pt gray borders, 3.5pt padding, centered text
- Alternating row stripe (#fcfcfd on odd rows)
- Status column: color-coded text using updated labels (Low-Abnormal, High-Abnormal, Low-Critical, High-Critical, Normal)

### 5. `src/lib/pdf/components/CategoryHeader.tsx` -- Rebuild

- Category name: 16pt centered bold, color #282828
- 1pt accent-colored divider line below, 3pt margin top

### 6. `src/lib/pdf/components/ClinicalNotesBox.tsx` -- Rebuild

- Bordered box (0.5pt, #d2d2d2, 2pt radius)
- "Clinical Notes:-" label in bold (10pt, #282828)
- Notes text at 9pt, #282828, 3pt top margin

### 7. `src/lib/pdf/components/ReportFooter.tsx` -- Rebuild from scratch

- Fixed at absolute bottom of page
- Signature section: right-aligned, 150pt line with "Authorized Signature" text below
- Page badge: dark accent-colored rounded badge with "Page # X/Y" in white bold (8pt), positioned left
- Bottom bar: full-width, accent-colored background, 25pt height, bold white address left, right-aligned two-line timestamp

### 8. `src/lib/pdf/ReportDocument.tsx` -- Clean rebuild

- Assemble all components in correct order
- Pass accent color through to all components
- No inline signature block (footer handles it)
- Watermark support retained

### 9. `src/lib/pdf/components/Watermark.tsx` -- Keep as-is

No changes needed; the watermark component already works correctly.

### 10. Comparison generators -- Update status references

Update `src/lib/comparison-pdf-generator.tsx` and `src/lib/multi-comparison-pdf-generator.tsx` to use the new status labels if they reference them.

---

## Technical Details

### Files Modified (complete rewrite of content)

| File | Action |
|------|--------|
| `src/lib/pdf/utils.ts` | Update status type and labels to Low-Abnormal/High-Abnormal |
| `src/lib/pdf/components/ReportHeader.tsx` | Full rewrite matching sample header |
| `src/lib/pdf/components/PatientInfoBox.tsx` | Full rewrite with 13pt text, 1pt border |
| `src/lib/pdf/components/TestResultsTable.tsx` | Full rewrite with 0.7pt borders, accent header, status labels |
| `src/lib/pdf/components/CategoryHeader.tsx` | Rewrite with accent divider |
| `src/lib/pdf/components/ClinicalNotesBox.tsx` | Rewrite matching sample |
| `src/lib/pdf/components/ReportFooter.tsx` | Full rewrite with signature, page badge, address bar |
| `src/lib/pdf/ReportDocument.tsx` | Clean assembly of all components |
| `src/lib/comparison-pdf-generator.tsx` | Update any status label references |
| `src/lib/multi-comparison-pdf-generator.tsx` | Update any status label references |

### No New Dependencies

All changes are styling/layout rewrites within existing components using the existing `@react-pdf/renderer` and `react-pdf-tailwind` setup.

