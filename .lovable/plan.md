
# PRD Documentation PDF Generator

## Overview
Create a new page and PDF generator function that produces a comprehensive, printable Product Requirements Document for MedLab Reporter. The PDF will serve as offline technical reference documentation.

## What Will Be Created

### New Files
1. **`src/lib/prd-pdf-generator.ts`** - PDF generation logic for PRD documentation
2. **`src/pages/Documentation.tsx`** - Documentation page with download button

### Modified Files
1. **`src/App.tsx`** - Add route for `/documentation`

## PDF Document Structure

The PRD PDF will contain the following sections:

### Cover Page
- Title: "MedLab Reporter - Product Requirements Document"
- Version number and generation date
- Clinic branding (logo, name) if available

### Table of Contents
- Clickable navigation to all sections

### Section 1: Executive Summary
- Application overview and purpose
- Target users (lab technicians, pathologists)
- Key value propositions

### Section 2: Technology Stack
- Frontend: React 18, Vite, TailwindCSS, TypeScript
- Backend: Lovable Cloud (Supabase)
- PDF Generation: jsPDF, jspdf-autotable
- PWA: vite-plugin-pwa

### Section 3: Core Modules
- Dashboard with stats and quick actions
- Patient Management (CRUD operations)
- Report Management (create, view, export)
- Template Editor (field customization)
- Settings (clinic branding, notifications)

### Section 4: Supported Test Types (17 Types)
A detailed table for each test type showing:
- Test name and code
- All fields with units
- Normal ranges (gender-specific where applicable)
- Calculated fields with formulas

```text
Test Types to Document:
+------------------+--------------------------------+
| Code             | Name                           |
+------------------+--------------------------------+
| cbc              | Complete Blood Count           |
| lft              | Liver Function Test            |
| rft              | Renal Function Test            |
| lipid_profile    | Lipid Profile                  |
| esr              | ESR                            |
| bsr              | Blood Sugar Random             |
| bsf              | Blood Sugar Fasting            |
| serum_calcium    | Serum Calcium                  |
| mp               | Malaria Parasites              |
| typhoid          | Typhoid (IgM + IgG)            |
| hcv              | Hepatitis C Virus              |
| hbsag            | Hepatitis B Surface Antigen    |
| hiv              | HIV                            |
| vdrl             | VDRL                           |
| h_pylori         | Helicobacter Pylori            |
| blood_group      | Blood Group                    |
| ra_factor        | R.A Factor                     |
+------------------+--------------------------------+
```

### Section 5: Database Schema
- clinics table structure
- patients table structure
- reports table structure
- report_images table structure
- custom_templates table structure
- Relationships diagram

### Section 6: Auto-Calculation Formulas
- BUN = urea * 0.467
- Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
- Globulin = Total Protein - Albumin
- A/G Ratio = Albumin / Globulin
- VLDL = Triglycerides / 5
- LDL = TC - HDL - (TG/5)
- TC/HDL Ratio, LDL/HDL Ratio

### Section 7: UI/UX Specifications
- Color scheme (primary teal: #009688)
- Typography and spacing
- Component library (shadcn/ui)
- Responsive breakpoints
- Animation patterns

### Section 8: PDF Report Layout
- Letterhead specifications
- Patient info block layout
- Results table format
- Signature section
- Watermark and footer

### Section 9: Security Model
- Open-access model (no authentication required)
- RLS policies overview
- Admin reset code protection

---

## Technical Implementation

### PDF Generation Approach
Following the existing pattern in `pdf-generator.ts`:
- Use jsPDF for document creation
- Use autoTable for structured tables
- Multi-page support with headers/footers
- Page numbering with "Page X of Y"
- Professional styling matching app theme

### Documentation Page UI
Simple page with:
- Page header with icon
- Description of what the PDF contains
- "Download PRD PDF" button
- Loading state during generation
- Success toast after download

### Route Configuration
Add `/documentation` route in App.tsx routing configuration
