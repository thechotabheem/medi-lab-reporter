

# Add Preview & Export Buttons to Create Report Page

## Summary

Add **Preview PDF** and **Export PDF** buttons to the Create Report page footer, allowing users to preview their report before saving and export a PDF directly from the form. This provides immediate visual feedback on how the report will look.

---

## Changes Overview

### Location
The buttons will be added to the sticky footer of `src/pages/CreateReport.tsx`, alongside the existing "Save as Draft" and "Complete Report" buttons.

### New Buttons

| Button | Icon | Action |
|--------|------|--------|
| **Preview** | `Eye` | Opens the PDF in a new browser tab for preview |
| **Export** | `Download` | Downloads the PDF file directly |

---

## Implementation Details

### 1. Add New State Variables

```typescript
const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
const [isExporting, setIsExporting] = useState(false);
```

### 2. Create Mock Report Builder Function

A helper function `buildPreviewReport()` will construct a temporary Report object from the current form state:

- Uses current patient data (selected or new patient form)
- Uses current test template(s) selection
- Uses current report data values
- Generates a temporary report number
- Sets status as "draft"

### 3. Add Handler Functions

**Preview Handler:**
```typescript
const handlePreviewPDF = async () => {
  // Build mock report from current form state
  // Generate PDF using generateReportPDF()
  // Open in new tab using blob URL
};
```

**Export Handler:**
```typescript
const handleExportPDF = async () => {
  // Build mock report from current form state
  // Generate PDF using generateReportPDF()
  // Download using downloadPDF()
};
```

### 4. Update Footer UI

The footer will be reorganized with the new buttons:

```text
+--------------------------------------------------+
| [Eye] Preview | [Download] Export | [Save] Draft | [Check] Complete |
+--------------------------------------------------+
```

On mobile, the Preview and Export buttons will show only icons to save space.

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `generateReportPDF` | `@/lib/pdf-generator` | Generate PDF document |
| `downloadPDF` | `@/lib/pdf-generator` | Trigger file download |
| `Eye`, `Download` | `lucide-react` | Button icons |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateReport.tsx` | Add preview/export state, handlers, and footer buttons |

---

## Button Enable Conditions

The Preview and Export buttons will be enabled when:
- A patient is selected (existing or new)
- At least one test type is selected
- At least one test value has been entered

This matches the existing validation logic for saving reports.

---

## Clinic Branding Integration

The preview will fetch the current clinic settings to apply:
- Logo and letterhead
- Accent colors
- Signature titles
- Font size preferences
- Border styles
- All other branding options

This gives users an accurate preview of how the final report will look with their clinic's branding.

---

## User Experience

1. User fills in patient info, selects test type, enters results
2. User can click **Preview** at any time to see a draft version
3. If satisfied, user can **Export** to download immediately, or
4. User clicks **Complete Report** to save to database

This workflow allows users to verify the report appearance before committing to the database.

