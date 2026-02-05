

# Add More Branding Options to Clinic Settings

## Summary

Enhance the Clinic Settings page with additional branding customization options for a more professional and personalized PDF report experience. These new options will provide greater control over the visual appearance and content of generated reports.

---

## New Branding Options to Add

### 1. Report Appearance Section

| Field | Type | Purpose |
|-------|------|---------|
| `tagline` | Text | Short clinic tagline displayed below the name |
| `font_size` | Select | Report font size preference (Small/Medium/Large) |
| `show_logo_on_all_pages` | Toggle | Display logo on continuation pages |
| `signature_title_left` | Text | Custom title for left signature box (default: "Lab Technician") |
| `signature_title_right` | Text | Custom title for right signature box (default: "Pathologist") |

### 2. PDF Formatting Section

| Field | Type | Purpose |
|-------|------|---------|
| `page_size` | Select | Paper size (A4/Letter/Legal) |
| `show_abnormal_summary` | Toggle | Show/hide the abnormal values summary box |
| `show_patient_id` | Toggle | Include patient ID on reports |
| `border_style` | Select | Report border style (None/Simple/Double) |
| `secondary_color` | Color | Secondary accent color for borders/dividers |

### 3. Contact Display Section

| Field | Type | Purpose |
|-------|------|---------|
| `website` | Text | Clinic website URL |
| `contact_display_format` | Select | How to show contact info (Inline/Stacked/Hidden) |

---

## Database Changes

Add new columns to the `clinics` table:

```sql
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS show_logo_on_all_pages BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS signature_title_left TEXT DEFAULT 'Lab Technician';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS signature_title_right TEXT DEFAULT 'Pathologist';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS page_size TEXT DEFAULT 'a4';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS show_abnormal_summary BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS show_patient_id BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS border_style TEXT DEFAULT 'simple';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS contact_display_format TEXT DEFAULT 'inline';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ClinicSettings.tsx` | Add new form fields grouped into sections |
| `src/lib/pdf-generator.ts` | Use new branding options when generating PDFs |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |
| `src/contexts/ClinicContext.tsx` | Include new fields in clinic data |

---

## UI Organization

Reorganize settings into clearly labeled cards:

1. **Basic Information** (existing)
   - Clinic Name, Phone, Email, Address

2. **Report Branding** (enhanced)
   - Logo upload
   - Tagline
   - Header text, Footer text
   - Website

3. **Signature Configuration** (new)
   - Left signature title
   - Right signature title

4. **Visual Styling** (enhanced from "Advanced PDF Options")
   - Accent color
   - Secondary color
   - Border style
   - Font size preference

5. **PDF Options** (new)
   - Page size
   - Show logo on all pages
   - Show abnormal summary
   - Show patient ID
   - Watermark text
   - QR code toggle
   - Contact display format

---

## Technical Details

### ClinicSettings.tsx Changes

Add new state fields to `ClinicData` interface:

```typescript
interface ClinicData {
  // existing fields...
  tagline: string;
  font_size: string;
  show_logo_on_all_pages: boolean;
  signature_title_left: string;
  signature_title_right: string;
  page_size: string;
  show_abnormal_summary: boolean;
  show_patient_id: boolean;
  border_style: string;
  secondary_color: string;
  website: string;
  contact_display_format: string;
}
```

### PDF Generator Updates

Extend `ClinicWithBranding` interface and update rendering logic:

- Use `signature_title_left` and `signature_title_right` for signature boxes
- Apply `font_size` preference to body text
- Conditionally show abnormal summary based on `show_abnormal_summary`
- Apply `border_style` to tables and sections
- Display `website` in contact line
- Support `show_logo_on_all_pages` for continuation headers

---

## Preview Feature (Optional Enhancement)

Consider adding a "Preview PDF" button that generates a sample report with current settings, allowing users to see changes before saving.

