

# Fine-Tune PDF Layout to Exactly Match Sample CBC Report

## Overview
After comparing the generated PDF with the sample CBC report screenshot pixel-by-pixel, several spacing, sizing, and styling adjustments are needed to achieve an exact match.

## Specific Differences Found

### 1. Logo Size -- Too Small
- **Current**: Logo is 26mm square
- **Sample**: Logo is significantly larger, approximately 40mm tall (the logo image includes "ZIA CLINIC & MATERNITY HOME" text)
- **Fix**: Increase logo size to ~40mm, maintaining aspect ratio

### 2. Header Right Side -- Font Sizes Off
- **Current**: Clinic name at 16pt, contact info at 8pt
- **Sample**: Doctor/clinic name is much larger (~18-20pt bold teal), contact and email are ~10pt
- **Fix**: Increase clinic name to 20pt, contact info to 10pt

### 3. Patient Information Box -- Too Compact
- **Current**: Box height is 32mm, text at 8.5pt, row gap 6.5mm
- **Sample**: Box is taller (~40mm), text is larger (~11pt), more vertical breathing room, and there is a vertical divider line between left and right columns
- **Fix**: Increase box height to 40mm, text to 11pt, row gap to 8mm, add a center vertical divider line

### 4. Category Header -- Should NOT Be a Filled Teal Bar
- **Current**: Full-width teal filled rectangle with white text
- **Sample**: Category name is centered black/dark bold text (like "CBC (Complete Blood Count)") with a thin horizontal line below it -- no filled background
- **Fix**: Replace the filled teal bar with centered bold text + thin line separator

### 5. Table Styling -- Needs Adjustments
- **Current**: 8.5pt body text, 2.5 cell padding, alternating stripe rows
- **Sample**: Larger text (~10pt), more cell padding (~4-5), NO alternating row colors (clean white background), all cells center-aligned
- **Fix**: Increase font sizes, padding, remove alternate row stripes, center-align all columns

### 6. Table Column Widths -- Need Rebalancing
- **Current**: Test Name 50, Ref Range 35, Unit 22, Result 28, Status 30
- **Sample**: Columns appear more evenly distributed with Test Name being wider
- **Fix**: Auto-distribute columns more evenly across the page width

### 7. Clinical Notes Label -- Should Be Teal, Not Black
- **Current**: "Clinical Notes:-" in dark text color
- **Sample**: "Clinical Notes:-" appears in teal/green accent color
- **Fix**: Change label text color to accent color

### 8. Footer Bar -- "Report Generated On" in a Separate Badge
- **Current**: Plain white text inline on the right side of the teal bar
- **Sample**: "Report Generated On:" with the date appears in a small box/badge overlaid on the right side of the footer bar. Address text appears bold.
- **Fix**: Make address text bold. Style "Report Generated On" as a small badge/box on the right

### 9. Signature Line Positioning
- **Current**: Signature line 22mm above footer bar
- **Sample**: Signature line appears closer to the footer, with "Authorized Signature" centered below the line on the right side
- **Fix**: Adjust vertical position and center the text under the line

### 10. Logo Watermark Support
- Already implemented in code (logo_watermark_enabled flag). No changes needed -- just verify it works on multi-page reports.

## Technical Details

### File Modified: `src/lib/pdf-generator.ts`

All changes are in this single file:

1. **Line ~274**: Change `logoSize = 26` to `logoSize = 40`
2. **Line ~282**: Change font size from `16` to `20` for clinic name
3. **Line ~288**: Change contact font size from `8` to `10`
4. **Line ~305**: Adjust `y += 28` to `y += 42` to account for larger logo
5. **Lines ~399-440**: Increase patient box height from 32 to 40, font size from 8.5 to 11, row gap from 6.5 to 8, add vertical center divider line
6. **Lines ~474-481**: Replace filled teal bar category header with centered bold text + thin line
7. **Lines ~524-546**: Increase table body font size to 10, cell padding to 4, remove `alternateRowStyles`, center-align all columns
8. **Line ~582**: Change "Clinical Notes:-" text color to accent color
9. **Lines ~348-383**: Style footer address as bold, add badge styling for "Report Generated On"
10. **Lines ~599-610**: Adjust signature position and center text under the line

### Multi-Page Verification
The existing `didDrawPage` callback and footer loop already handle multi-page reports. The watermark loop at the end (lines 613-616) applies to all pages. These changes don't affect pagination logic.

