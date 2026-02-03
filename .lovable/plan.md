
# Multi-Test Report Feature - Options & Implementation Plan

## Current Architecture

The current system has a **one-to-one relationship** between reports and test types:

```text
┌─────────────────────────────────────────────────────────────┐
│                       CURRENT STATE                          │
├─────────────────────────────────────────────────────────────┤
│  Report                                                      │
│  ├── id                                                      │
│  ├── patient_id                                              │
│  ├── report_type (ENUM) ─────► ONE test type only           │
│  └── report_data (JSONB) ────► Fields for that single test  │
└─────────────────────────────────────────────────────────────┘
```

Each report can only have **one test type** (CBC, LFT, RFT, etc.), and the `report_data` JSON stores only that test's fields.

---

## Two Approaches to Multi-Test Reports

### Option A: Combined Report (Single PDF with Multiple Tests)

A new "combined report" type that allows selecting multiple tests, storing all their data together, and generating a single unified PDF.

**Best for**: When you want one PDF document containing CBC + LFT + RFT results for the same patient visit.

```text
┌─────────────────────────────────────────────────────────────┐
│                    COMBINED REPORT                           │
├─────────────────────────────────────────────────────────────┤
│  Report                                                      │
│  ├── id                                                      │
│  ├── patient_id                                              │
│  ├── report_type: "combined" (new type)                     │
│  ├── included_tests: ["cbc", "lft", "rft"] ──► Array        │
│  └── report_data: {                                          │
│        cbc: { hemoglobin: 14, ... },                        │
│        lft: { total_bilirubin: 0.8, ... },                  │
│        rft: { urea: 25, ... }                               │
│      }                                                       │
└─────────────────────────────────────────────────────────────┘
```

### Option B: Quick Multi-Report Creation

Stay with single-test reports but streamline creating multiple reports for the same patient in one session.

**Best for**: When you want separate PDFs for each test but need to enter them efficiently.

```text
┌─────────────────────────────────────────────────────────────┐
│                 QUICK MULTI-CREATE                           │
├─────────────────────────────────────────────────────────────┤
│  Select Patient ──► Select Multiple Tests                   │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │   CBC   │  │   LFT   │  │   RFT   │                      │
│  │  Report │  │  Report │  │  Report │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
│       ↓            ↓            ↓                            │
│  Separate Reports (3 PDFs)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended: Option A - Combined Report

This provides maximum flexibility with a single unified document.

### Database Changes Required

1. Add a new `combined` value to the `report_type` enum
2. Add an `included_tests` column (text array) to store selected test types
3. Update the `report_data` structure to namespace fields by test type

### UI/UX Changes

1. **Template Selector**: Allow multi-select with checkboxes instead of single selection
2. **Dynamic Form**: Show accordion sections for each selected test
3. **Report View**: Display all test categories in one view
4. **PDF Generator**: Generate multi-section PDF with all tests

### Implementation Scope

| Component | Changes |
|-----------|---------|
| Database | Add enum value + new column |
| `TemplateSelector` | Add multi-select mode |
| `CreateReport` | Handle array of templates |
| `DynamicReportForm` | Render multiple test forms |
| `ReportView` | Display combined results |
| `pdf-generator` | Multi-section PDF layout |
| Types | Update TypeScript definitions |

---

## Summary

**Option A (Combined Report)** is recommended if you want:
- One PDF with all tests
- Single report record in database
- Unified patient report document

**Option B (Quick Multi-Create)** is better if you want:
- Separate PDFs per test
- Independent report records
- Simpler implementation

---

Would you like me to proceed with implementing **Option A (Combined Report)** or **Option B (Quick Multi-Create)**?
