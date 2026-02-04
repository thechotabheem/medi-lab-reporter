
# Custom Test Types - Implementation Plan

## Overview

This plan covers two complementary features:

1. **Extend Template Editor** - Create entirely new test types from scratch in Settings
2. **Quick Custom Test** - Add one-off tests directly during report creation

Both features will store custom templates in the existing `custom_templates` table, but with a new approach that doesn't require mapping to the hardcoded `report_type` enum.

---

## Current Architecture Analysis

```text
┌─────────────────────────────────────────────────────────────┐
│                  CURRENT LIMITATION                          │
├─────────────────────────────────────────────────────────────┤
│  report_type ENUM (hardcoded in database)                   │
│  ├── cbc, lft, rft, lipid_profile, etc.                    │
│  └── combined (for multi-test reports)                      │
│                                                              │
│  Template Editor → Can only MODIFY existing types           │
│  Report Creation → Must select from predefined list         │
└─────────────────────────────────────────────────────────────┘
```

**Key insight**: The `custom_templates` table already stores complete template definitions in JSONB. We can leverage this to store fully custom test types without modifying the database enum.

---

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                   NEW ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────┤
│  custom_templates table                                      │
│  ├── base_template: "cbc" → Customization of CBC            │
│  ├── base_template: "custom" → Fully custom test type       │
│  │   └── customizations: {                                  │
│  │         name: "Thyroid Panel",                           │
│  │         categories: [...],                               │
│  │         isFullyCustom: true                              │
│  │       }                                                   │
│  └── base_template: "quick_custom" → One-off test           │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### Option 1: Use Existing Schema (Recommended)

No database migration needed. We'll use the existing `custom_templates` table with a special `base_template` value:

- `base_template = 'custom_<unique_id>'` for fully custom templates
- Store complete template definition in `customizations` JSONB

### Option 2: Add New Table (Alternative)

If cleaner separation is preferred, add a dedicated table:

```sql
CREATE TABLE clinic_custom_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  test_name TEXT NOT NULL,
  test_code TEXT NOT NULL UNIQUE,
  categories JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Recommendation**: Option 1 (use existing schema) to minimize database changes.

---

## Feature 1: Extend Template Editor

### UI Changes

Add a "Create New Template" section to the Template Editor page:

```text
┌─────────────────────────────────────────────────────────────┐
│  Template Editor                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [+] Create New Template                                 ││
│  │     "Design a completely custom test type"              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Select Existing Template:                                   │
│  [CBC] [LFT] [RFT] [Lipid] [Custom: Thyroid Panel] ...      │
└─────────────────────────────────────────────────────────────┘
```

### New Component: CreateCustomTemplateDialog

A multi-step wizard:

1. **Step 1: Basic Info**
   - Template Name (e.g., "Thyroid Panel")
   - Template Code (auto-generated, e.g., "thyroid_panel")
   - Description (optional)

2. **Step 2: Add Categories**
   - Category name input
   - Add multiple categories

3. **Step 3: Add Fields to Categories**
   - Uses existing `AddFieldDialog` component
   - Assign fields to categories
   - Configure field types, units, normal ranges

4. **Step 4: Preview & Save**
   - Show preview of the template
   - Save to `custom_templates` table

### Data Structure for Fully Custom Template

```typescript
interface FullyCustomTemplate {
  name: string;           // "Thyroid Panel"
  code: string;           // "custom_thyroid_panel"
  description?: string;
  categories: TestCategory[];
  isFullyCustom: true;    // Flag to identify custom templates
  createdAt: string;
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/template-editor/CreateCustomTemplateDialog.tsx` | Create | Multi-step wizard for new templates |
| `src/hooks/useCustomTemplates.ts` | Modify | Add hooks for CRUD on fully custom templates |
| `src/pages/TemplateEditor.tsx` | Modify | Add "Create New" button and show custom templates |
| `src/components/reports/TemplateSelector.tsx` | Modify | Include custom templates in selection list |
| `src/lib/report-templates.ts` | Modify | Add helper to merge custom templates into available list |

---

## Feature 2: Quick Custom Test During Report Creation

### UI Changes

Add a "Quick Custom Test" option to the template selector:

```text
┌─────────────────────────────────────────────────────────────┐
│  Select Test(s)                               [Combined: ON] │
├─────────────────────────────────────────────────────────────┤
│  [+] Quick Custom Test                                       │
│      "Add a one-off test with custom fields"                │
│                                                              │
│  Popular Tests:                                              │
│  [CBC] [LFT] [RFT] [Lipid Profile] ...                      │
└─────────────────────────────────────────────────────────────┘
```

### New Component: QuickCustomTestDialog

A lightweight dialog for quick test creation:

1. **Test Name** (required)
2. **Add Fields** (inline field editor)
   - Field name, type, unit, normal range
   - Add multiple fields
3. **Save option**: "Save as reusable template" checkbox

### Integration with Combined Reports

Quick custom tests can be added to combined reports:
- Stored in `report_data` under a custom namespace
- Uses existing `CombinedReportForm` accordion structure

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/QuickCustomTestDialog.tsx` | Create | Inline test builder dialog |
| `src/components/reports/TemplateSelector.tsx` | Modify | Add Quick Custom Test button |
| `src/pages/CreateReport.tsx` | Modify | Handle custom test in form state |
| `src/hooks/useCustomTemplates.ts` | Modify | Add hook to optionally save quick tests |

---

## Implementation Phases

### Phase 1: Database & Type Updates (30 min)
- Update TypeScript types to support custom templates
- Add helper functions in `useCustomTemplates.ts`

### Phase 2: Create Custom Template Wizard (2-3 hours)
- Build `CreateCustomTemplateDialog.tsx` with multi-step form
- Add category and field management UI
- Integrate with Template Editor page

### Phase 3: Quick Custom Test (1-2 hours)
- Build `QuickCustomTestDialog.tsx`
- Integrate with Template Selector
- Handle in report creation flow

### Phase 4: Template Selector Integration (1 hour)
- Show custom templates alongside built-in ones
- Support selecting custom templates in combined reports

### Phase 5: Testing & Polish (1 hour)
- End-to-end testing
- PDF generation for custom tests
- Edge cases (empty templates, duplicate names)

---

## Technical Considerations

### Unique Identifiers
Custom templates will use the format: `custom_<slug>_<timestamp>`

Example: `custom_thyroid_panel_1707052800000`

### Template Selector Logic

```typescript
// Merge built-in and custom templates
const allTemplates = [
  ...activeReportTypes.map(type => ({ type, ...reportTemplates[type] })),
  ...customTemplates.filter(t => t.customizations?.isFullyCustom),
];
```

### Report Data Storage
For reports using custom templates:
```json
{
  "report_type": "combined",
  "included_tests": ["cbc", "custom_thyroid_panel_123"],
  "report_data": {
    "cbc": { "hemoglobin": 14 },
    "custom_thyroid_panel_123": { "tsh": 2.5, "t3": 120 }
  }
}
```

---

## Summary

| Feature | Complexity | User Benefit |
|---------|------------|--------------|
| Create Custom Template (Template Editor) | Medium | Reusable custom test types |
| Quick Custom Test (Report Creation) | Low | One-off tests without leaving workflow |

Both features leverage the existing `custom_templates` table and JSONB storage, minimizing database changes while maximizing flexibility.
