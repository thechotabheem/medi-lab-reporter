

# Multi-Feature Implementation Plan

## Overview

This plan implements three key features:
1. **Multi-page PDF support** for reports with many test results
2. **Custom lab logo upload** with display in PDF report headers
3. **Draft report auto-save** using browser localStorage

---

## Feature 1: Multi-Page PDF Support

### Current Behavior
The PDF generator (`src/lib/pdf-generator.ts`) already has basic page-break logic at lines 234 and 274, but it only handles category boundaries. For very large reports (like CBC with 15 fields), individual tables can overflow the page.

### Changes Required

**File: `src/lib/pdf-generator.ts`**

1. **Add page tracking and footer/header functions**:
   - Create `drawHeader()` function to add clinic letterhead on new pages
   - Create `drawFooter()` function to add page numbers and footer text
   - Track current page number and add "Page X of Y" to footer

2. **Improve table pagination**:
   - Configure `jspdf-autotable` with `showHead: 'everyPage'` option to repeat table headers on page breaks
   - Use `didDrawPage` callback to add consistent headers/footers on every page
   - Adjust margins to leave space for headers/footers (top: 35mm, bottom: 25mm)

3. **Add final page count update**:
   - Use `doc.getNumberOfPages()` after rendering to update "Page X of Y" text

---

## Feature 2: Custom Lab Logo Upload

### Current Behavior
The clinic settings page (`src/pages/ClinicSettings.tsx`) has a `logo_url` text input field, but:
- Users must host their image externally
- The PDF generator doesn't use the logo

### Changes Required

**1. Create Storage Bucket for Clinic Logos**
- Create new migration to add a `clinic-logos` public storage bucket
- Since this is an open-access app (no auth), allow anonymous uploads/views

**2. File: `src/components/clinic/LogoUploader.tsx`** (new file)
- Create a drag-and-drop image upload component
- Accept PNG, JPG, WEBP formats (max 2MB)
- Display current logo preview
- Upload to Supabase Storage and return public URL
- Include delete/replace functionality

**3. File: `src/pages/ClinicSettings.tsx`**
- Replace the URL input with the new `LogoUploader` component
- Update form submission to handle the new logo URL from uploads

**4. File: `src/lib/pdf-generator.ts`**
- Add logo rendering in the header section
- Load image from URL, convert to base64, and embed in PDF
- Handle image load errors gracefully (fall back to text-only header)
- Position logo to the left of clinic name (or centered above)

**5. File: `src/pages/ReportView.tsx`**
- Add logo display in the on-screen clinic letterhead section

---

## Feature 3: Draft Report Auto-Save with localStorage

### Current Behavior
If users close the browser while creating a report, all progress is lost.

### Changes Required

**1. File: `src/hooks/useDraftReport.ts`** (new file)
Create a custom hook to manage draft persistence:
- Save draft to localStorage on every form change (debounced by 500ms)
- Load draft on component mount
- Clear draft on successful save
- Include draft metadata (timestamp, template type)

**2. File: `src/pages/CreateReport.tsx`**
- Integrate `useDraftReport` hook
- Show "Resume Draft" banner if saved draft exists
- Add "Clear Draft" button
- Auto-save on every change to: patient selection, template, details, and test results

**3. File: `src/components/reports/DraftBanner.tsx`** (new file)
- Display when a draft exists with timestamp
- "Resume" button to load draft data
- "Discard" button to clear and start fresh
- Show what template/patient the draft was for

---

## Implementation Files Summary

| File | Action | Feature |
|------|--------|---------|
| `src/lib/pdf-generator.ts` | Modify | Multi-page PDF, Logo in header |
| `src/components/clinic/LogoUploader.tsx` | Create | Logo upload |
| `src/pages/ClinicSettings.tsx` | Modify | Logo upload UI |
| `src/pages/ReportView.tsx` | Modify | Display logo in letterhead |
| `src/hooks/useDraftReport.ts` | Create | Draft auto-save |
| `src/pages/CreateReport.tsx` | Modify | Draft save/restore UI |
| `src/components/reports/DraftBanner.tsx` | Create | Draft resume banner |
| Database migration | Create | Storage bucket for logos |

---

## Technical Details

### PDF Multi-Page Implementation

```text
+------------------------+
|  [LOGO] CLINIC NAME    |  <- Repeated on each page
|  Header text / Contact |
+------------------------+
|                        |
|    Test Results        |
|    Table with          |
|    showHead: everyPage |
|                        |
+------------------------+
|   Page 1 of 3          |  <- Page number footer
|   Footer text          |
+------------------------+
```

### Logo Upload Flow

```text
User drops image
       |
       v
Validate (type, size)
       |
       v
Upload to clinic-logos bucket
       |
       v
Get public URL
       |
       v
Save URL to clinics.logo_url
       |
       v
Display in settings + PDF
```

### Draft Storage Structure

```json
{
  "version": 1,
  "savedAt": "2026-01-26T10:00:00Z",
  "patient": { "id": "...", "full_name": "..." } | null,
  "newPatientData": { "full_name": "...", "age": 35, ... } | null,
  "selectedTemplate": "cbc",
  "reportDetails": {
    "referring_doctor": "Dr. Smith",
    "clinical_notes": "...",
    "test_date": "2026-01-26"
  },
  "reportData": {
    "hemoglobin": 14.5,
    "rbc": 4.8,
    ...
  }
}
```

Key: `medilab-draft-report`

### Storage Bucket Migration

```sql
-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-logos', 'clinic-logos', true);

-- Allow public read access (open-access app)
CREATE POLICY "Anyone can view clinic logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'clinic-logos');

-- Allow public uploads (since no auth in this app)
CREATE POLICY "Anyone can upload clinic logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'clinic-logos');

-- Allow public delete
CREATE POLICY "Anyone can delete clinic logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'clinic-logos');
```

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Large logo files slow PDF generation | Limit upload to 2MB, resize on client side before upload |
| External logo URLs may have CORS issues | Convert to base64 with fallback to text header |
| localStorage quota exceeded | Limit draft size, compress data, show warning if near limit |
| Draft conflicts if editing same report | Store only one draft, show confirmation before overwriting |

