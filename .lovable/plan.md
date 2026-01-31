
# Medical Lab Report Generator
## Product Requirements Document (PRD) and Technical Specification Blueprint

---

# PART 1: EXECUTIVE SUMMARY

## 1.1 Product Overview
The Medical Lab Report Generator is an open-access Progressive Web Application (PWA) designed for medical laboratories to create, manage, and export professional lab reports. The application features a premium dark-themed UI with advanced micro-interactions, supports 17 different medical test types, and generates branded PDF reports with clinic letterheads.

## 1.2 Target Users
- Medical lab technicians
- Clinic receptionists
- Small to medium medical laboratories
- Maternity homes and diagnostic centers

## 1.3 Core Value Proposition
- No authentication required (open-access model)
- Professional branded PDF exports
- Customizable report templates
- Real-time abnormal value detection
- Mobile-responsive design with PWA installation support

---

# PART 2: FUNCTIONAL REQUIREMENTS

## 2.1 Patient Management Module

### FR-2.1.1 Patient Registration
```text
REQUIREMENT: Add new patients to the system
PRIORITY: Critical

INPUT FIELDS:
+------------------------+----------+-------------+------------------------+
| Field                  | Type     | Required    | Validation             |
+------------------------+----------+-------------+------------------------+
| Full Name              | Text     | Yes         | Non-empty string       |
| Age                    | Number   | Yes         | 0-150 years            |
| Gender                 | Select   | Yes         | male/female/other      |
| Patient ID Number      | Text     | No          | Optional identifier    |
| Phone                  | Tel      | No          | Any format accepted    |
| Email                  | Email    | No          | Valid email format     |
| Address                | Textarea | No          | Multi-line text        |
+------------------------+----------+-------------+------------------------+

BEHAVIOR:
1. System converts Age to date_of_birth using formula: current_year - age + "-01-01"
2. Patient is assigned a UUID on creation
3. Patient is linked to the global clinic ID
4. On success: Navigate to /patients, invalidate patients query cache
5. On error: Show toast with error message

DATA STORAGE:
- Table: patients
- Key: id (UUID, auto-generated)
- clinic_id: References the single global clinic
```

### FR-2.1.2 Patient List View
```text
REQUIREMENT: Display searchable list of all patients
PRIORITY: Critical

FEATURES:
- Search by name, patient ID, or phone number
- Debounced search (300ms) for performance
- Card-based layout with responsive grid
- Displays: Full name, Patient ID, Age, Gender, Phone, Email

UI BEHAVIOR:
- 3-column grid on desktop (lg:grid-cols-3)
- 2-column grid on tablet (sm:grid-cols-2)
- Single column on mobile
- Hover state: Border color change, shadow, scale(1.02)
- Click navigates to patient detail page

EMPTY STATE:
- Shows "No patients found" message
- If no search term: Shows "Add Patient" action button
```

### FR-2.1.3 Patient Detail View
```text
REQUIREMENT: View and edit individual patient records
PRIORITY: Critical

DISPLAY MODE:
- Patient information card with all fields
- Report history list with badges (draft/completed/verified)
- Quick action: Create new report for this patient

EDIT MODE:
- Toggle via "Edit" button
- All fields become editable
- Save/Cancel buttons appear
- Age field converts to/from date_of_birth internally

DELETE FUNCTIONALITY:
- Confirmation dialog required
- Deletes patient AND all associated reports (cascade behavior)
- Navigates to /patients on success
```

### FR-2.1.4 Inline Patient Registration
```text
REQUIREMENT: Register patients during report creation flow
PRIORITY: High

BEHAVIOR:
- PatientSelector component with two tabs: "New Patient" | "Existing Patient"
- New Patient tab shows minimal registration form
- On report save, patient is auto-registered before report creation
- Shows confirmation: "Patient will be auto-registered when you save"
```

---

## 2.2 Report Management Module

### FR-2.2.1 Report Creation Flow
```text
REQUIREMENT: Unified single-page report creation
PRIORITY: Critical

SECTION 1 - PATIENT SELECTION:
- Tab interface: New Patient / Existing Patient
- New patient requires: Full Name, Age, Gender
- Existing patient: Searchable list with selection

SECTION 2 - TEMPLATE SELECTION:
- 17 test types organized in 3 categories
- Visual card selection with icons
- Categories:
  * Value Based Tests (8): CBC, LFT, RFT, Lipid Profile, ESR, BSR, BSF, Serum Calcium
  * Screening Tests (7): MP, Typhoid, HCV, HBsAg, HIV, VDRL, H. Pylori
  * Blood Group & Typing (2): Blood Group, R.A Factor

SECTION 3 - REPORT DETAILS:
- Test Date (required, defaults to today)
- Referring Doctor (optional)
- Clinical Notes (optional, textarea)

SECTION 4 - TEST RESULTS (conditional):
- Only appears after patient AND template selected
- Dynamic form based on template fields
- Real-time abnormal value highlighting
- Auto-calculated fields where applicable

SAVE OPTIONS:
- "Save as Draft" button
- "Complete Report" button
- Footer is fixed/sticky at bottom

VALIDATION:
- Cannot save without: Patient + Template + Test Date
```

### FR-2.2.2 Report Templates
```text
REQUIREMENT: Define test-specific field configurations
PRIORITY: Critical

TEMPLATE STRUCTURE:
{
  type: ReportType,
  name: string,
  categories: [
    {
      name: string,
      fields: [
        {
          name: string,          // Field identifier
          label: string,         // Display name
          unit?: string,         // e.g., "g/dL", "cells/μL"
          normalRange?: {
            min?: number,
            max?: number,
            male?: { min, max },   // Gender-specific
            female?: { min, max }
          },
          type: 'number' | 'text' | 'select' | 'textarea',
          options?: string[],    // For select type
          calculated?: boolean,  // Auto-calculated
          formula?: string       // Calculation formula
        }
      ]
    }
  ]
}

SUPPORTED TEST TYPES:
+-------------------+--------+------------------------------------------+
| Test Type         | Fields | Key Parameters                           |
+-------------------+--------+------------------------------------------+
| CBC               | 15     | Hemoglobin, RBC, WBC, Platelets, etc.   |
| LFT               | 11     | Bilirubin, SGOT, SGPT, ALP, etc.        |
| RFT               | 8      | Urea, BUN, Creatinine, Electrolytes     |
| Lipid Profile     | 7      | Cholesterol, TG, HDL, LDL, VLDL, Ratios |
| ESR               | 1      | ESR (1st Hour)                          |
| BSR               | 1      | Blood Sugar Random                      |
| BSF               | 1      | Blood Sugar Fasting                     |
| Serum Calcium     | 2      | Total and Ionized Calcium               |
| MP                | 3      | Malaria result, P. Vivax, P. Falciparum |
| Typhoid           | 6      | IgM, IgG, Widal test results            |
| HCV               | 1      | Anti-HCV (Reactive/Non-Reactive)        |
| HBsAg             | 1      | HBsAg status                            |
| HIV               | 1      | HIV I & II status                       |
| VDRL              | 1      | VDRL status                             |
| H. Pylori         | 2      | IgG and Antigen                         |
| Blood Group       | 2      | ABO Group, Rh Factor                    |
| R.A Factor        | 2      | RA value, Qualitative result            |
+-------------------+--------+------------------------------------------+
```

### FR-2.2.3 Auto-Calculations
```text
REQUIREMENT: Automatically calculate derived values
PRIORITY: High

SUPPORTED CALCULATIONS:
+-------------------+----------------------------------------+------------------+
| Field             | Formula                                | Condition        |
+-------------------+----------------------------------------+------------------+
| Indirect Bili     | total_bilirubin - direct_bilirubin    | Both values set  |
| Globulin          | total_protein - albumin               | Both values set  |
| A/G Ratio         | albumin / globulin                    | Globulin > 0     |
| VLDL              | triglycerides / 5                     | TG set           |
| LDL (Friedewald)  | TC - HDL - (TG/5)                     | TG <= 400        |
| TC/HDL Ratio      | total_cholesterol / hdl               | HDL > 0          |
| LDL/HDL Ratio     | ldl / hdl                             | HDL > 0          |
| BUN               | urea * 0.467                          | Urea set         |
+-------------------+----------------------------------------+------------------+

BEHAVIOR:
- Calculated fields are disabled (read-only)
- Display "Auto" badge next to field label
- Recalculate on every form value change
- Round to 2 decimal places
```

### FR-2.2.4 Abnormal Value Detection
```text
REQUIREMENT: Real-time flagging of out-of-range values
PRIORITY: High

DETECTION LOGIC:
1. Get field's normalRange configuration
2. Check for gender-specific ranges (male/female)
3. Apply appropriate range based on patient gender
4. Compare: value < min OR value > max = ABNORMAL

VISUAL INDICATORS:
- Normal: Green checkmark icon (CheckCircle)
- Abnormal: Red alert icon (AlertCircle), red border on input
- Unknown: No indicator (no range defined or empty value)

DISPLAY:
- Input field border turns red for abnormal
- Status icon in rightmost column
- Normal range displayed as text
```

### FR-2.2.5 Draft Persistence
```text
REQUIREMENT: Auto-save work-in-progress reports
PRIORITY: Medium

STORAGE:
- localStorage key: "medilab-draft-report"
- Debounced save (500ms delay)
- Version tracking (version: 1)

SAVED DATA:
{
  version: 1,
  savedAt: ISO timestamp,
  patient: { id, full_name } | null,
  newPatientData: { full_name, age, gender, phone, patient_id } | null,
  selectedTemplate: ReportType | null,
  reportDetails: { referring_doctor, clinical_notes, test_date },
  reportData: Record<fieldName, value>
}

RESUME FLOW:
1. On CreateReport mount, check for existing draft
2. If draft exists and has content:
   - Show DraftBanner component
   - Options: "Resume Draft" | "Discard"
3. Resume: Populate all fields from draft
4. Discard: Clear localStorage and continue fresh
5. On successful save: Clear draft automatically
```

### FR-2.2.6 Report List View
```text
REQUIREMENT: Display filterable list of all reports
PRIORITY: Critical

FILTERS:
- Search: Report number, patient name, referring doctor
- Status: All / Draft / Completed / Verified
- Type: All / [17 test types]

DISPLAY COLUMNS:
- Test type name with icon
- Status badge (colored)
- Patient name
- Test date
- Report number (desktop only)
- Referring doctor (desktop only)

SORT: By created_at descending (newest first)

UI BEHAVIOR:
- Click row → Navigate to report detail
- Hover: Border color, shadow, scale(1.01)
- Staggered entrance animation (30ms delay per item)
```

### FR-2.2.7 Report Detail View
```text
REQUIREMENT: Professional report display with actions
PRIORITY: Critical

LAYOUT SECTIONS:
1. CLINIC LETTERHEAD:
   - Logo (if uploaded)
   - Clinic name
   - Header text / tagline
   - Contact info line (address | phone | email)

2. REPORT TITLE BAR:
   - Test type name
   - Report number
   - Status badge

3. PATIENT INFORMATION GRID:
   - Patient Name (clickable → patient detail)
   - Age / Gender
   - Patient ID
   - Test Date
   - Referring Doctor (if present)

4. ABNORMAL VALUES SUMMARY (conditional):
   - Red alert box if any abnormal values
   - Lists up to 5 abnormal values with ranges
   - Shows "+X more" if > 5

5. TEST RESULTS TABLE:
   - Column headers: Test | Result | Unit | Normal Range | Status
   - Abnormal values in bold red
   - Categories as section headers
   - Grouped by template categories

6. SIGNATURE LINES (PDF only):
   - Lab Technician signature
   - Pathologist signature

ACTIONS:
- Print (triggers browser print dialog)
- Download PDF
- Share via WhatsApp
- Delete (with confirmation)
- Mark Complete (if draft)
```

---

## 2.3 Template Customization Module

### FR-2.3.1 Template Editor
```text
REQUIREMENT: Customize report templates per clinic
PRIORITY: Medium

CUSTOMIZATION OPTIONS:
1. FIELD VISIBILITY:
   - Toggle fields on/off (hidden: true)

2. FIELD PROPERTIES:
   - Custom label (override default)
   - Custom unit (override default)
   - Custom normal range (min/max)

3. FIELD ORDERING:
   - Drag-and-drop reordering within categories
   - Persist order in fieldOrder map

4. CATEGORY ORDERING:
   - Drag-and-drop categories
   - Persist order in categoryOrder array

5. CUSTOM FIELDS:
   - Add new fields to any category
   - Specify: name, label, unit, type, options, normalRange
   - Can create new categories via custom fields

STORAGE:
- Table: custom_templates
- JSON structure:
  {
    fields: { [fieldName]: FieldCustomization },
    customFields: CustomField[],
    categoryOrder: string[],
    fieldOrder: { [categoryName]: string[] }
  }

ADVANCED FEATURES:
- Clone customizations from another template
- Preview mode with sample data
- Reset to default (delete customization record)
```

### FR-2.3.2 Template Preview
```text
REQUIREMENT: Preview template with sample data before saving
PRIORITY: Low

BEHAVIOR:
- Opens TemplatePreviewDialog
- Applies current (unsaved) customizations
- Renders form with placeholder values
- Shows how report entry will look
```

---

## 2.4 Clinic Settings Module

### FR-2.4.1 Basic Information
```text
FIELDS:
- Clinic Name (required)
- Phone
- Email
- Address (textarea)

IMPACT: Used in PDF letterhead, displayed on dashboard
```

### FR-2.4.2 Report Branding
```text
FIELDS:
- Logo Upload (image file → Supabase storage)
- Report Header Text (tagline/description)
- Report Footer Text (disclaimer/notes)

LOGO UPLOAD:
- Bucket: clinic-logos (public)
- Max size: Implied by Supabase limits
- Displayed in: PDF header, on-screen report view
```

### FR-2.4.3 Advanced PDF Options
```text
FIELDS:
- Watermark Text (diagonal overlay on PDF)
- Accent Color (color picker, default #00968F)
- QR Code Toggle (planned feature flag)

ACCENT COLOR USAGE:
- PDF header backgrounds
- Table header backgrounds
- Border colors in PDF
```

---

## 2.5 Data Reset Module

### FR-2.5.1 Database Reset
```text
REQUIREMENT: Securely clear all patient/report data
PRIORITY: Low

SECURITY:
- Requires ADMIN_RESET_CODE (backend secret)
- Requires typing "DELETE ALL DATA" exactly
- Two-factor confirmation in UI

DELETION ORDER (respects FK constraints):
1. Delete report_images for clinic's reports
2. Delete reports for clinic
3. Delete patients for clinic

PRESERVED:
- Clinic settings (name, logo, contact)
- Custom templates

POST-RESET:
- Invalidate all cached queries
- Show success toast with counts
- Navigate to dashboard
```

### FR-2.5.2 Local Draft Clear
```text
REQUIREMENT: Clear browser-cached drafts
PRIORITY: Low

BEHAVIOR:
- Clears localStorage draft keys
- Reloads page
- Does NOT affect database
```

---

## 2.6 Dashboard Module

### FR-2.6.1 Statistics Display
```text
METRICS:
+------------------+---------------------------+
| Stat             | Query                     |
+------------------+---------------------------+
| Total Reports    | COUNT(*) from reports     |
| Total Patients   | COUNT(*) from patients    |
| This Month       | Reports in current month  |
| Pending Drafts   | Reports with status=draft |
+------------------+---------------------------+

REFRESH: Via React Query with clinic-scoped key
CLICK BEHAVIOR: Navigate to filtered views
```

### FR-2.6.2 Quick Actions
```text
ACTIONS:
- New Report → /reports/new
- View Reports → /reports
- Patients → /patients
- Settings → /settings
```

### FR-2.6.3 Recent Reports Widget
```text
DISPLAY:
- 5 most recent reports
- Shows: test type, patient, date, status
- Click → report detail
```

### FR-2.6.4 Welcome Section
```text
COMPONENTS:
- Time-based greeting (Morning/Afternoon/Evening)
- Clinic name with shimmer effect
- Live clock (updates every minute)
- Current date (full format)
- Weather display (if available)
```

---

## 2.7 PDF Generation Module

### FR-2.7.1 PDF Structure
```text
LIBRARY: jsPDF + jspdf-autotable

PAGE LAYOUT:
- Margins: 15mm all sides
- Header height: 35mm (first page) / 15mm (continuation)
- Footer height: 20mm

FIRST PAGE HEADER:
- Clinic logo (if available, 20x20mm)
- Clinic name (22pt bold)
- Header text / tagline (10pt italic)
- Contact info line (8pt)
- Decorative double line

CONTINUATION PAGE HEADER:
- Compact: Small logo + clinic name + report number

FOOTER:
- Footer text (7pt italic, centered)
- Page numbering: "Page X of Y"

WATERMARK:
- Diagonal text across page center
- Light gray (200,200,200)
- 50pt bold
```

### FR-2.7.2 Report Content
```text
SECTIONS:
1. Report Title Bar (colored background)
2. Patient Information Grid
3. Clinical Notes (if present)
4. Abnormal Values Summary (if any)
5. Test Results Tables (per category)
6. Signature Section

TABLE FORMATTING:
- Auto-pagination with repeated headers
- Abnormal values: Red text, bold
- Alternating row colors
- Column widths: auto-sized
```

### FR-2.7.3 Export/Share Actions
```text
DOWNLOAD:
- Generates blob
- Triggers browser download
- Filename: {report_number}.pdf

WHATSAPP SHARE:
- Generates PDF blob
- Opens WhatsApp with attachment
- Pre-fills patient phone if available
```

---

# PART 3: NON-FUNCTIONAL REQUIREMENTS

## 3.1 Performance Requirements

### NFR-3.1.1 Page Load
```text
- Initial load: < 3 seconds on 3G
- Subsequent navigation: < 500ms (SPA transitions)
- PWA caching for offline assets
```

### NFR-3.1.2 Data Operations
```text
- Search debounce: 300ms
- Draft auto-save debounce: 500ms
- Query caching via React Query
- Optimistic updates for mutations
```

## 3.2 Accessibility Requirements
```text
- Keyboard navigation support in forms (Enter → next field)
- Focus ring indicators (ring-2 ring-ring)
- Reduced motion detection (skip animations)
- Color contrast: WCAG AA compliant
- Screen reader labels on interactive elements
```

## 3.3 Security Requirements
```text
- RLS policies: Permissive (public access by design)
- Reset function: Requires backend secret
- No authentication (intentional for target use case)
- Clinic data isolation via clinic_id filtering
```

## 3.4 Responsiveness Requirements
```text
BREAKPOINTS:
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md/lg)
- Desktop: > 1024px (xl)

MOBILE OPTIMIZATIONS:
- Single-column layouts
- Touch-friendly targets (44x44px minimum)
- Safe area insets for notched devices
- Floating action button for primary action
```

---

# PART 4: TECHNICAL SPECIFICATIONS

## 4.1 Technology Stack

### Frontend
```text
+----------------------+-------------------+
| Technology           | Version           |
+----------------------+-------------------+
| React                | ^18.3.1           |
| TypeScript           | (via Vite)        |
| Vite                 | (bundler)         |
| Tailwind CSS         | (via config)      |
| React Router         | ^6.30.1           |
| TanStack Query       | ^5.83.0           |
| React Hook Form      | ^7.61.1           |
| date-fns             | ^3.6.0            |
| Zod                  | ^3.25.76          |
+----------------------+-------------------+
```

### UI Component Libraries
```text
+----------------------+-------------------+
| Library              | Purpose           |
+----------------------+-------------------+
| Radix UI             | Accessible primitives |
| shadcn/ui            | Component system  |
| Lucide React         | Icon library      |
| Sonner               | Toast notifications |
| cmdk                 | Command palette   |
| Vaul                 | Drawer component  |
| @dnd-kit             | Drag and drop     |
+----------------------+-------------------+
```

### PDF Generation
```text
+----------------------+-------------------+
| Library              | Purpose           |
+----------------------+-------------------+
| jspdf                | PDF creation      |
| jspdf-autotable      | Table generation  |
+----------------------+-------------------+
```

### PWA
```text
+----------------------+-------------------+
| Library              | Purpose           |
+----------------------+-------------------+
| vite-plugin-pwa      | Service worker    |
+----------------------+-------------------+
```

### Backend (Lovable Cloud / Supabase)
```text
- PostgreSQL database
- Edge Functions (Deno runtime)
- Storage buckets (public)
- Row Level Security (permissive)
```

---

## 4.2 Database Schema

### Table: clinics
```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  header_text TEXT,
  footer_text TEXT,
  watermark_text TEXT,
  accent_color TEXT DEFAULT '#00968F',
  enable_qr_code BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- RLS: Public read/update, no insert/delete
```

### Table: patients
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender USER-DEFINED NOT NULL, -- 'male' | 'female' | 'other'
  patient_id_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Public CRUD
```

### Table: reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  created_by UUID,
  report_number TEXT NOT NULL,
  report_type USER-DEFINED NOT NULL, -- ReportType enum
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  referring_doctor TEXT,
  clinical_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'completed' | 'verified'
  report_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Public CRUD
```

### Table: report_images
```sql
CREATE TABLE report_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Public read/insert/delete
```

### Table: custom_templates
```sql
CREATE TABLE custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  base_template TEXT NOT NULL, -- ReportType
  customizations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Public CRUD
```

---

## 4.3 API Layer (React Query Hooks)

### Patient Hooks
```typescript
usePatients()           // List all patients for clinic
usePatient(id)          // Single patient by ID
useUpdatePatient()      // Mutation to update patient
useDeletePatient()      // Mutation to delete patient
```

### Report Hooks
```typescript
useReports()            // List all reports for clinic
useReport(id)           // Single report with patient join
useCreateReport()       // Mutation to create report
useUpdateReport()       // Mutation to update status/data
useDeleteReport()       // Mutation to delete report
usePatientReports(id)   // Reports for specific patient
```

### Template Hooks
```typescript
useCustomTemplate(type)       // Get customization for type
useAllCustomTemplates()       // Get all customizations
useSaveCustomTemplate()       // Save/update customization
useDeleteCustomTemplate()     // Reset to default
useCustomizedTemplate(type)   // Get merged template
```

### Dashboard Hooks
```typescript
useDashboardStats()     // Aggregate counts
```

---

## 4.4 Component Architecture

### Page Components
```text
src/pages/
├── Dashboard.tsx           // Home page with stats
├── CreateReport.tsx        // Report creation flow
├── Reports.tsx             // Report list
├── ReportView.tsx          // Report detail
├── Patients.tsx            // Patient list
├── PatientDetail.tsx       // Patient detail/edit
├── AddPatient.tsx          // Standalone patient add
├── Settings.tsx            // Settings hub
├── ClinicSettings.tsx      // Clinic branding
├── TemplateEditor.tsx      // Template customization
├── Install.tsx             // PWA install page
└── NotFound.tsx            // 404 page
```

### Feature Components
```text
src/components/
├── reports/
│   ├── PatientSelector.tsx    // New/existing patient tabs
│   ├── TemplateSelector.tsx   // Test type grid
│   ├── DynamicReportForm.tsx  // Dynamic form renderer
│   └── DraftBanner.tsx        // Draft resume prompt
├── template-editor/
│   ├── FieldEditor.tsx        // Single field customizer
│   ├── SortableFieldEditor.tsx
│   ├── SortableCategoryEditor.tsx
│   ├── AddFieldDialog.tsx
│   ├── CloneTemplateDialog.tsx
│   └── TemplatePreviewDialog.tsx
├── settings/
│   └── ResetDataDialog.tsx
├── clinic/
│   └── LogoUploader.tsx
└── dashboard/
    └── RecentReportsWidget.tsx
```

### UI Components (shadcn/ui based)
```text
src/components/ui/
├── Core: button, input, label, textarea, select
├── Layout: card, dialog, sheet, separator
├── Navigation: tabs, accordion, breadcrumb
├── Feedback: toast, alert, skeleton, progress
├── Data: table, badge, avatar
├── Forms: form, checkbox, radio-group, switch
├── Custom: stat-card, action-card, icon-wrapper, 
│           page-header, empty-state, floating-action-button,
│           enhanced-page-layout, cursor-glow, sparkle-text
└── Animation: page-transition, success-animation, ripple
```

---

## 4.5 State Management

### Global State
```text
CONTEXT PROVIDERS:
1. QueryClientProvider (React Query)
   - Cache: Query results
   - Invalidation: On mutations

2. ClinicProvider (ClinicContext)
   - clinic: Clinic object
   - clinicId: UUID constant
   - isLoading: Boolean
   - refreshClinic(): Force refetch

3. ThemeProvider (ThemeContext)
   - Locked to dark theme
```

### Local State Patterns
```text
COMPONENT STATE:
- Form state via React Hook Form
- UI toggles via useState
- Derived/computed via useMemo
- Callbacks via useCallback

PERSISTENT STATE:
- Draft reports → localStorage
- Session splash flag → sessionStorage
- Notification preferences → localStorage
```

---

## 4.6 Routing Architecture

### Routes
```text
/                    → Dashboard
/dashboard           → Dashboard
/reports             → Reports list
/reports/new         → Create report
/reports/:id         → Report detail
/patients            → Patients list
/patients/new        → Add patient
/patients/:id        → Patient detail
/settings            → Settings hub
/settings/clinic     → Clinic settings
/settings/templates  → Template editor
/install             → PWA install info
*                    → 404 Not Found
```

### Page Transitions
```text
MECHANISM: AnimatedRoutes component
- Tracks location changes
- Triggers exit animation (200ms fade)
- Updates displayLocation
- Triggers enter animation

FALLBACK:
- 300ms timeout forces completion
- Prevents "stuck invisible" state
- Respects prefers-reduced-motion
```

---

## 4.7 Edge Functions

### reset-clinic-data
```text
ENDPOINT: POST /functions/v1/reset-clinic-data

REQUEST:
{
  resetCode: string,
  clinicId: string
}

VALIDATION:
1. Check resetCode matches ADMIN_RESET_CODE secret
2. Return 401 if mismatch

LOGIC:
1. Query all report IDs for clinic
2. DELETE from report_images WHERE report_id IN (...)
3. DELETE from reports WHERE clinic_id = clinicId
4. DELETE from patients WHERE clinic_id = clinicId

RESPONSE:
{
  success: boolean,
  deletedCounts: {
    reportImages: number,
    reports: number,
    patients: number
  },
  timestamp: string,
  error?: string
}
```

---

## 4.8 Styling System

### Design Tokens
```css
/* Core Colors (HSL) */
--background: 220 15% 4%       /* Deep black */
--foreground: 210 20% 98%      /* Near white */
--primary: 162 84% 42%         /* Teal accent */
--primary-glow: 162 84% 52%    /* Lighter teal */
--destructive: 0 72% 51%       /* Red */
--success: 142 70% 45%         /* Green */
--warning: 38 92% 50%          /* Amber */

/* Surfaces */
--card: 220 15% 7%
--popover: 220 15% 9%
--muted: 220 12% 18%
--border: 220 12% 16%
```

### Animation Classes
```css
.animate-fade-in          /* Opacity 0→1 */
.animate-fade-in-up       /* Opacity + translateY */
.animate-pulse-glow       /* Subtle pulsing shadow */
.animate-sparkle          /* Rotating sparkle */
.text-gradient-shimmer    /* Moving gradient text */
.animate-ripple           /* Click ripple effect */
.animation-delay-{N}      /* 100-2000ms delays */
```

### Component Patterns
```css
.card-gradient-overlay    /* Diagonal gradient pseudo-element */
.glass                    /* Glassmorphism backdrop */
.page-container          /* Full height, dark background */
.app-header              /* Sticky top, blurred backdrop */
.app-footer              /* Fixed bottom, blurred backdrop */
```

---

# PART 5: USER FLOWS

## 5.1 Create Report (New Patient)

```text
1. User clicks "New Report" from Dashboard
2. System loads CreateReport page with empty state
3. (Optional) If draft exists, show DraftBanner
4. User selects "New Patient" tab
5. User enters: Full Name, Age (required), Gender (required)
6. UI shows: "Patient will be auto-registered when you save"
7. User scrolls to Template Selection
8. User clicks on test type card (e.g., CBC)
9. Card highlights, Section 4 (Test Results) appears
10. User enters Report Details (test date auto-filled)
11. User enters test results
    - Abnormal values flagged in red
    - Calculated fields auto-populate
12. User clicks "Complete Report" or "Save as Draft"
13. System creates patient record first
14. System creates report record with patient_id
15. Success animation plays
16. Navigate to Dashboard
17. Draft cleared from localStorage
```

## 5.2 Create Report (Existing Patient)

```text
1. User clicks "New Report"
2. User selects "Existing Patient" tab
3. User types in search box
4. Debounced search filters patient list
5. User clicks patient card → "Selected" state
6. User selects test type
7. User fills report details and results
8. User saves report
9. Report linked to existing patient
```

## 5.3 View and Export Report

```text
1. User navigates to Reports list
2. User clicks on a report row
3. ReportView page loads with full details
4. User sees clinic letterhead, patient info, results
5. Abnormal values highlighted in summary box
6. User clicks "PDF" button
7. System generates PDF with jsPDF
8. Browser downloads file
9. User clicks "Share" button
10. System generates PDF and opens WhatsApp
```

## 5.4 Customize Template

```text
1. User navigates Settings → Customize Templates
2. User selects template type (e.g., CBC)
3. Template editor loads with all fields
4. User expands category accordion
5. User drags field to reorder
6. User clicks field to edit label/unit/range
7. User toggles field visibility
8. User adds custom field via dialog
9. User drags categories to reorder
10. User clicks "Save"
11. Customizations stored in custom_templates table
12. Future reports use customized template
```

## 5.5 Reset Database

```text
1. User navigates Settings → Danger Zone
2. User clicks "Reset All Data"
3. Dialog opens with warnings
4. User enters ADMIN_RESET_CODE
5. User types "DELETE ALL DATA"
6. User clicks "Reset Data"
7. Edge function validates code
8. Edge function deletes data in order
9. Success toast shows counts
10. Queries invalidated
11. Dashboard shows 0 counts
```

---

# PART 6: ERROR HANDLING

## 6.1 API Error Handling
```text
PATTERN: Try-catch in mutation functions

ON ERROR:
1. Log to console
2. Show toast with error.message
3. Maintain UI state (don't navigate)

TOAST VARIANTS:
- success: Green icon, auto-dismiss
- destructive: Red icon, requires dismiss
```

## 6.2 Form Validation
```text
PATTERN: HTML5 validation + custom checks

VALIDATION POINTS:
- Required fields: HTML required attribute
- Age range: min=0, max=150
- Email format: type="email"
- Custom: Check in submit handler

ERROR DISPLAY:
- Toast notifications for submit errors
- Inline red borders for invalid inputs
```

## 6.3 Network Errors
```text
OFFLINE DETECTION:
- useNetworkStatus hook
- OfflineBanner component at app top
- Shows when navigator.onLine = false

RETRY STRATEGY:
- React Query default retry (3 attempts)
- Exponential backoff
```

---

# PART 7: TESTING CHECKLIST

## 7.1 Patient Module
```text
[ ] Create patient with all fields
[ ] Create patient with required fields only
[ ] Edit existing patient
[ ] Delete patient (verify reports deleted)
[ ] Search patients by name
[ ] Search patients by ID
[ ] Search patients by phone
```

## 7.2 Report Module
```text
[ ] Create report with new patient
[ ] Create report with existing patient
[ ] Save as draft
[ ] Resume draft
[ ] Discard draft
[ ] Mark draft as complete
[ ] View report detail
[ ] Download PDF
[ ] Share via WhatsApp
[ ] Print report
[ ] Delete report
[ ] Filter by status
[ ] Filter by type
[ ] Search reports
```

## 7.3 Template Module
```text
[ ] Select template to edit
[ ] Hide/show field
[ ] Edit field label
[ ] Edit field unit
[ ] Edit normal range
[ ] Reorder fields
[ ] Reorder categories
[ ] Add custom field
[ ] Delete custom field
[ ] Clone from another template
[ ] Preview template
[ ] Reset to default
[ ] Save customizations
```

## 7.4 Settings Module
```text
[ ] Update clinic name
[ ] Upload logo
[ ] Set header/footer text
[ ] Set watermark
[ ] Change accent color
[ ] Reset database (with valid code)
[ ] Reset database (with invalid code)
[ ] Clear draft and reload
```

## 7.5 Responsive/PWA
```text
[ ] Mobile layout (360px)
[ ] Tablet layout (768px)
[ ] Desktop layout (1440px)
[ ] PWA install prompt
[ ] Offline banner
[ ] Print CSS
```

---

# PART 8: DEPLOYMENT ARCHITECTURE

```text
+------------------+     +-------------------+
|   Lovable.dev    |     |  Lovable Cloud    |
|   (Frontend)     |<--->|  (Supabase)       |
+------------------+     +-------------------+
        |                        |
        v                        v
+------------------+     +-------------------+
| Static Assets    |     | PostgreSQL DB     |
| - HTML/CSS/JS    |     | - clinics         |
| - Images         |     | - patients        |
| - Service Worker |     | - reports         |
+------------------+     | - custom_templates|
                         +-------------------+
                                 |
                         +-------------------+
                         | Edge Functions    |
                         | - reset-clinic-   |
                         |   data            |
                         +-------------------+
                                 |
                         +-------------------+
                         | Storage Buckets   |
                         | - clinic-logos    |
                         | - report-images   |
                         +-------------------+
```

---

# APPENDIX A: GLOSSARY

| Term | Definition |
|------|------------|
| CBC | Complete Blood Count |
| LFT | Liver Function Test |
| RFT | Renal Function Test |
| ESR | Erythrocyte Sedimentation Rate |
| BSR | Blood Sugar Random |
| BSF | Blood Sugar Fasting |
| HCV | Hepatitis C Virus |
| HBsAg | Hepatitis B Surface Antigen |
| VDRL | Venereal Disease Research Laboratory |
| MP | Malaria Parasites |
| PWA | Progressive Web Application |
| RLS | Row Level Security |

---

# APPENDIX B: FILE STRUCTURE

```text
src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── index.css                  # Global styles
├── vite-env.d.ts             # Vite types
├── components/
│   ├── ui/                   # UI primitives
│   ├── reports/              # Report features
│   ├── settings/             # Settings features
│   ├── clinic/               # Clinic features
│   ├── dashboard/            # Dashboard features
│   ├── template-editor/      # Template features
│   └── search/               # Search features
├── contexts/
│   ├── ClinicContext.tsx     # Clinic state
│   └── ThemeContext.tsx      # Theme (locked dark)
├── hooks/
│   ├── usePatients.ts        # Patient queries
│   ├── useReports.ts         # Report queries
│   ├── useCustomTemplates.ts # Template queries
│   ├── useDashboardStats.ts  # Stats queries
│   ├── useDraftReport.ts     # Draft persistence
│   └── [utility hooks]       # Various utilities
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── report-templates.ts   # Template definitions
│   └── pdf-generator.ts      # PDF generation
├── pages/
│   └── [all page components]
├── types/
│   └── database.ts           # TypeScript types
├── integrations/
│   └── supabase/
│       ├── client.ts         # Supabase client
│       └── types.ts          # Generated types
└── styles/
    └── print.css             # Print stylesheet

supabase/
├── config.toml               # Supabase config
├── migrations/               # DB migrations
└── functions/
    └── reset-clinic-data/
        └── index.ts          # Edge function
```

---

# APPENDIX C: IMPLEMENTATION STATUS

## Completed Features ✅
- [x] Patient CRUD operations
- [x] Report creation with 17 test types
- [x] Draft auto-save/resume
- [x] PDF generation with branding
- [x] Template customization with drag-and-drop
- [x] Clinic settings with logo upload
- [x] Data reset functionality
- [x] PWA configuration
- [x] Premium dark theme UI
- [x] Responsive layouts
- [x] Dashboard with statistics

## Planned Enhancements 🔮
- [ ] QR code on PDF reports
- [ ] Report verification workflow
- [ ] Bulk patient import
- [ ] Report analytics dashboard
- [ ] Email report sharing
