

# Migration from jsPDF to @react-pdf/renderer + react-pdf-tailwind

## Overview

Replace the imperative jsPDF-based PDF generation system with a declarative React component approach using `@react-pdf/renderer` and `react-pdf-tailwind`. This gives you JSX-based PDF layouts styled with Tailwind-like classes, making future PDF design changes much easier and more maintainable.

## Scope of Changes

### Files to Rewrite (PDF generators)
1. `src/lib/pdf-generator.ts` -- Main report PDF (631 lines)
2. `src/lib/comparison-pdf-generator.ts` -- Dual comparison PDF (467 lines)
3. `src/lib/multi-comparison-pdf-generator.ts` -- Multi-report comparison PDF (467 lines)
4. `src/lib/prd-pdf-generator.ts` -- PRD documentation PDF (762 lines)

### Files to Update (consumers)
5. `src/pages/ReportView.tsx` -- Download/share report
6. `src/pages/CreateReport.tsx` -- Preview/export during creation
7. `src/pages/ClinicSettings.tsx` -- Full preview dialog
8. `src/pages/CompareReports.tsx` -- Comparison download/share
9. `src/components/reports/ReportPreviewThumbnail.tsx` -- Live preview thumbnail
10. `src/components/clinic-settings/PDFPreviewThumbnail.tsx` -- Clinic settings preview

### New Packages to Install
- `@react-pdf/renderer` -- React-based PDF rendering engine
- `react-pdf-tailwind` -- Tailwind CSS adapter for @react-pdf/renderer

### Packages to Remove
- `jspdf`
- `jspdf-autotable`

---

## Implementation Plan

### Step 1: Create shared PDF utilities and Tailwind config

Create `src/lib/pdf/tw-config.ts` with the react-pdf-tailwind `createTw()` setup containing your color palette (dark azure, accent colors, status colors, etc.).

Create `src/lib/pdf/utils.ts` with shared helpers: `hexToRgb`, `calculateAge`, `formatNormalRange`, `getDetailedValueStatus`, `loadImageAsBase64`, etc.

### Step 2: Build reusable PDF layout components

Create `src/lib/pdf/components/` with shared React PDF components:
- `ReportHeader` -- Dark azure header with logo (left half) and contact info (right, white text)
- `PatientInfoBox` -- Rounded bordered patient details with vertical divider
- `TestResultsTable` -- Table with columns: Test Name, Reference Range, Unit, Result, Status (color-coded)
- `CategoryHeader` -- Bold centered heading with divider line
- `ClinicalNotesBox` -- Bordered notes section
- `ReportFooter` -- Page badge, teal bar with address and timestamp, signature line
- `Watermark` -- Text or logo watermark overlay

### Step 3: Rebuild the main report PDF

Create `src/lib/pdf/ReportDocument.tsx` as a React component using `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>` from @react-pdf/renderer, styled with `react-pdf-tailwind`.

The layout will replicate the current design:
- Dark azure header with logo covering left half
- "Patient Report" centered heading
- Patient info box with rounded corners and vertical center divider
- Category headers with divider lines
- Test results tables with grid borders and color-coded status text
- Clinical notes box
- Authorized signature line
- Footer with page badge, address bar, and timestamp

### Step 4: Update the main generator API

Rewrite `src/lib/pdf-generator.ts` to:
- Export `generateReportPDF()` that renders `<ReportDocument>` to a blob using `pdf().toBlob()`
- Keep the same function signature so consumers don't break
- Return a blob instead of a jsPDF instance
- Update `downloadPDF()` and `sharePDFViaWhatsApp()` to work with blobs

### Step 5: Rebuild comparison PDFs

Rewrite `src/lib/comparison-pdf-generator.ts` and `src/lib/multi-comparison-pdf-generator.ts` using the same React PDF component pattern. Keep existing function signatures.

### Step 6: Rebuild PRD PDF

Rewrite `src/lib/prd-pdf-generator.ts` similarly.

### Step 7: Update all consumers

Update the 6 consumer files to work with the new blob-based API:
- `ReportView.tsx`, `CreateReport.tsx`, `ClinicSettings.tsx` -- adjust download/preview to use blob URLs
- `CompareReports.tsx` -- adjust comparison download/share
- `ReportPreviewThumbnail.tsx`, `PDFPreviewThumbnail.tsx` -- render blob URL in iframe (same approach, just different source)

---

## Technical Details

### API Change

The current API returns a `jsPDF` instance. The new API will return a `Blob`:

```text
// Before (jsPDF)
const doc: jsPDF = await generateReportPDF(options);
doc.save('filename.pdf');           // download
doc.output('blob');                 // get blob

// After (@react-pdf/renderer)
const blob: Blob = await generateReportPDF(options);
saveAs(blob, 'filename.pdf');      // download using URL.createObjectURL
```

The `downloadPDF` and `sharePDFViaWhatsApp` helper functions will be updated internally so most consumer code stays similar.

### Preview Thumbnails

The iframe-based preview approach will continue to work -- we generate a blob URL from the rendered PDF and display it in an iframe, exactly as before.

### Key Benefit

PDF layouts become JSX components with Tailwind-like styling, making them dramatically easier to read, modify, and maintain compared to the current imperative jsPDF coordinate-based approach.

