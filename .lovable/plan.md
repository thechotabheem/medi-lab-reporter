

# Use Uploaded Logo in PDF Reports

## Overview
Copy the uploaded Zia Clinic logo into the project and set it as the default/fallback logo used in PDF reports, so reports always show this logo even if no custom logo has been uploaded via the clinic settings.

## Changes

### 1. Copy Logo to Project
- Copy `user-uploads://report-logo.png` to `public/images/report-logo.png` so it's accessible as a static asset

### 2. Update PDF Generator (`src/lib/pdf-generator.ts`)
- Add a fallback: when no `clinic.logo_url` is set, use `/images/report-logo.png` as the default logo
- This ensures the Zia Clinic logo appears on all reports automatically

### 3. Also Remove Contact Display Format Setting
- Since it was discussed earlier, this is a good time to clean up the now-unused "Contact Display Format" dropdown from `PDFOptionsSection.tsx` and the related state in `ClinicSettings.tsx`

## Technical Details

### Files Modified
- **`public/images/report-logo.png`** -- New file (copied from upload)
- **`src/lib/pdf-generator.ts`** -- Add default logo fallback path when `logo_url` is empty
- **`src/components/clinic-settings/PDFOptionsSection.tsx`** -- Remove Contact Display Format dropdown
- **`src/pages/ClinicSettings.tsx`** -- Remove `contact_display_format` from form state

