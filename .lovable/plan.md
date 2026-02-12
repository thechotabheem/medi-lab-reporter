

# Match PDF Layout to Sample CBC Report

## Overview
Restructure the PDF generator to exactly replicate the style and layout from the uploaded sample CBC report. This involves significant changes to the header, patient info, table structure, status styling, footer, and signature placement.

## Visual Differences Identified

### Current Layout vs Sample Layout

1. **Header**: Current has clinic name as text next to logo. Sample has the logo image (which includes the clinic name/branding) on the left, and doctor name + contact info stacked on the right. A thick teal gradient divider separates the header from content.

2. **Report Title**: Current has a colored bar or accent strip with report type. Sample uses a centered "Patient Report" heading above the patient info box -- no separate report-type bar.

3. **Patient Information Box**: Current has labels on the left and values offset to the right. Sample uses a clean bordered box with two columns:
   - Left: Name, Age/Gender, Referred By, Patient ID
   - Right: Report No, Collected On, Reported On
   - Values appear inline after the label with a colon

4. **Table Column Order**: Current is `Test | Result | Unit | Range | Status`. Sample is `Test Name | Reference Range | Unit | Result | Status`.

5. **Status Badges**: Current uses colored text ("Normal", "Abnormal"). Sample uses colored background badges/pills -- green for Normal, orange for Low-Abnormal/High-Abnormal, dark red for Low-Critical/High-Critical.

6. **Status Labels**: Current shows "Normal" or "Abnormal". Sample shows directional labels: "Normal", "Low-Abnormal", "High-Abnormal", "Low-Critical", "High-Critical".

7. **Clinical Notes**: Current shows "COMMENTS & NOTES" centered text. Sample shows a bordered box with "Clinical Notes:-" as a bold label.

8. **Signature & Page Number**: Current has a separate signature section. Sample places "Authorized Signature" in the footer area alongside a "Page # X/Y" badge.

9. **Footer Bar**: Current has a thin line with centered "Generated: date". Sample has a full-width dark teal bar with the clinic address on the left and "Report Generated On: date time" on the right.

## Changes

### File: `src/lib/pdf-generator.ts`

#### 1. Header Rework
- Logo on the left (larger, ~25-28mm)
- Right side: Clinic name in bold (larger font), then "Contact: [phone]" and email below it
- Replace thin divider with a thick teal gradient-style line below the header

#### 2. Replace Report Title with "Patient Report"
- Remove the colored bar / accent strip for report type
- Add a centered "Patient Report" heading (large, bold) between the header divider and the patient info box

#### 3. Patient Information Box Restyle
- Draw a bordered rectangle with two columns
- Left column fields: Name, Age/Gender, Referred By, Patient ID (inline "Label: Value" format)
- Right column fields: Report No, Collected On, Reported On
- Remove the separate "PATIENT INFORMATION" section header bar

#### 4. Table Column Reorder
- Change column order to: Test Name | Reference Range | Unit | Result | Status
- Adjust column widths accordingly

#### 5. Directional Status Labels with Background Colors
- Update `getValueStatus` to return directional statuses: "Normal", "Low-Abnormal", "High-Abnormal", "Low-Critical", "High-Critical"
- Add colored background fills to the Status cells:
  - Green background for "Normal"
  - Orange background for "Low-Abnormal" / "High-Abnormal"
  - Dark red background for "Low-Critical" / "High-Critical"

#### 6. Clinical Notes Box
- Replace centered "COMMENTS & NOTES" with a bordered box
- Bold "Clinical Notes:-" label at the top of the box
- Notes text inside the box

#### 7. Footer Redesign
- Move signature to footer area: "Authorized Signature" text with a line, positioned on the right side above the footer bar
- Add "Page # X/Y" badge on the left side (dark rounded rectangle with white text)
- Replace thin footer line with a full-width dark teal bar containing:
  - Left: "Address: [clinic address]"
  - Right: "Report Generated On: [date time]"

#### 8. Remove Abnormal Summary Box
- The sample report does not include a separate abnormal summary alert box; status is shown per-row in the table instead

### No Other Files Affected
The PDF generator is self-contained. The live preview thumbnail and report generation will automatically reflect these changes.

## Technical Details

### Status Detection Enhancement
The current `getValueStatus` function returns `'normal' | 'abnormal' | 'unknown'`. It needs to be enhanced to return directional info:

```text
Function: getDetailedValueStatus(value, field, gender)
Returns: 'Normal' | 'Low-Abnormal' | 'High-Abnormal' | 'Low-Critical' | 'High-Critical' | 'unknown'

Logic:
- If value < min: check if value < min * 0.7 -> 'Low-Critical', else 'Low-Abnormal'  
- If value > max: check if value > max * 1.3 -> 'High-Critical', else 'High-Abnormal'
- Otherwise: 'Normal'
```

### Status Badge Colors
```text
Normal:        background #d4edda (light green), text #155724
Low-Abnormal:  background #fff3cd (light orange), text #856404
High-Abnormal: background #fff3cd (light orange), text #856404  
Low-Critical:  background #f8d7da (light red), text #721c24
High-Critical: background #f8d7da (light red), text #721c24
```

### Footer Bar
```text
Full-width rectangle at bottom of page
Background: dark teal (accent color darkened)
Left text (white): "Address: [clinic.address]"
Right text (white): "Report Generated On: [formatted date]"
Height: ~10mm
```

### Page Numbering
```text
Dark rounded rectangle badge
Position: bottom-left, above the footer bar
Text: "Page # X/Y" in white
```

