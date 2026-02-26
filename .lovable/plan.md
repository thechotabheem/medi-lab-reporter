

## Plan: Refine PDF Report Generator to Match Sample Template

### Summary
Update the PDF generator's fonts, colors, layout proportions, and typography to exactly match the provided sample template. This involves registering custom Google Fonts, updating all PDF components with new font families/sizes, changing the header/footer color to Dark Azure `#084c6e`, and adjusting spacing/layout proportions.

### Font Registration (`src/lib/pdf/fonts.ts`)
Register the following Google Fonts via `@react-pdf/renderer`'s `Font.register()`:
- **Garet** (Bold) — header doctor name, table header row, report title, footer timestamp
- **Inter** (Regular) — header contact/email
- **Work Sans** (Regular + Bold) — patient info box, table data, footer address
- **Source Sans 3** (Bold) — clinical notes heading
- **Be Vietnam Pro** (Regular) — "Authorized Signature" text
- **Bruel Grotesk** (if unavailable on Google Fonts, substitute with a similar geometric sans) — page badge pill

Note: "Sukar" is an Arabic-compatible font that may not be available on Google Fonts. Will use a close substitute or fetch from a CDN if possible.

Update the `FONTS` object to expose all these named font families.

### Color Change
- Header & footer banner color: `#003366` → `#084c6e`

### Component Changes

**ReportHeader.tsx**
- Banner background → `#084c6e`
- Doctor name: Garet Bold, 15pt, white
- Contact line: Inter Regular, 15pt, white  
- Email: Inter Regular, 15pt, white
- Logo stays on left, doctor info stays on right

**PatientInfoBox.tsx**
- All text: Work Sans Regular, 15pt, center-aligned within each column
- Labels remain bold (Work Sans Bold)
- Keep thick black rounded border

**CategoryHeader.tsx**
- Report title: Garet Regular/Bold, 16pt, centered, black
- Keep the two 1.25pt divider lines

**TestResultsTable.tsx**
- Table borders: 1pt (down from 1.2pt)
- Header row: Garet Bold, 14pt, center-aligned
- Data rows: Work Sans Regular, 12pt, center-aligned
- Cell padding: 3pt spacing
- Status colors unchanged (Low=red, High=purple, Normal=green)

**ClinicalNotesBox.tsx**
- Heading: Source Sans 3 Bold, 12.5pt
- Body text: Sukar Regular (or substitute), 11pt, justified

**ReportFooter.tsx**
- Page badge pill: Bruel Grotesk Bold (or substitute), 13pt, white on gray
- "Authorized Signature" line: 2pt thick horizontal line, Be Vietnam Pro, 13pt, black
- Reduce white space between pill and signature
- Footer banner → `#084c6e`
- Left 50%: "Address:" in Work Sans Bold 12pt + address in Work Sans Regular 12pt, white
- Right 30%: "Report Generated On:" in Garet Regular 12pt, white

**ReportDocument.tsx**
- `paddingBottom` adjusted to accommodate 13% footer height
- Page margins: 1-inch (72pt) on all sides (except top/bottom for header/footer banners which are full-width)

### Technical Details

- All custom fonts will be registered from Google Fonts CDN URLs using `Font.register({ family, fonts: [{ src, fontWeight, fontStyle }] })`
- For fonts not on Google Fonts (Garet, Bruel Grotesk, Sukar), will use the closest available alternatives or direct CDN links if publicly available
- The `FONTS` constant will be expanded with named entries for each usage context
- `@react-pdf/renderer` requires font URLs to return proper font files (TTF/OTF)

### Files to modify
1. `src/lib/pdf/fonts.ts` — register all custom fonts
2. `src/lib/pdf/components/ReportHeader.tsx` — color + font updates
3. `src/lib/pdf/components/PatientInfoBox.tsx` — font + alignment
4. `src/lib/pdf/components/CategoryHeader.tsx` — font update
5. `src/lib/pdf/components/TestResultsTable.tsx` — border weight, fonts, spacing
6. `src/lib/pdf/components/ClinicalNotesBox.tsx` — fonts, justification
7. `src/lib/pdf/components/ReportFooter.tsx` — color, fonts, signature line, layout
8. `src/lib/pdf/ReportDocument.tsx` — margin/padding adjustments

