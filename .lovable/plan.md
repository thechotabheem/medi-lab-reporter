
# Side-by-Side Report Comparison Feature

## Overview

Add a dedicated comparison view that allows users to select two reports from the same patient and view their results side-by-side. This feature enables tracking patient progress over time by highlighting differences, trends, and changes between test results.

---

## User Flow

```text
1. User navigates to Patient Detail page
2. User clicks "Compare Reports" button (visible when 2+ reports exist)
3. A new page/modal opens with two report selectors
4. User selects Report A (baseline) and Report B (current)
5. Side-by-side comparison table displays with:
   - Test parameter names
   - Report A values
   - Report B values
   - Change indicators (arrows, percentages)
   - Visual highlighting for significant changes
```

---

## Technical Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/CompareReports.tsx` | Main comparison page with dual report selection and comparison table |
| `src/components/reports/ReportComparisonTable.tsx` | Reusable comparison table component |
| `src/hooks/useReportComparison.ts` | Hook for fetching and comparing two reports |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/AnimatedRoutes.tsx` | Add route for `/patients/:id/compare` |
| `src/pages/PatientDetail.tsx` | Add "Compare Reports" button |
| `src/pages/ReportView.tsx` | Add "Compare with..." action button |

---

## Page Design: `/patients/:patientId/compare`

### Layout Structure

```text
+----------------------------------------------------------+
|  [Back] Compare Reports           Patient: John Doe       |
+----------------------------------------------------------+
|                                                           |
|  +------------------------+  +------------------------+   |
|  | Report A (Baseline)    |  | Report B (Current)     |   |
|  | [Dropdown: Select]     |  | [Dropdown: Select]     |   |
|  | Date: Jan 15, 2025     |  | Date: Feb 5, 2026      |   |
|  +------------------------+  +------------------------+   |
|                                                           |
+----------------------------------------------------------+
|  Comparison Results                                       |
+----------------------------------------------------------+
| Test          | Report A | Report B | Change   | Status   |
|---------------|----------|----------|----------|----------|
| Hemoglobin    | 12.5     | 14.2     | +13.6%   | Improved |
| WBC Count     | 8500     | 8200     | -3.5%    | Stable   |
| Platelets     | 180000   | 145000   | -19.4%   | Declined |
+----------------------------------------------------------+
|                                                           |
|  [Export Comparison PDF]  [Share]                         |
+----------------------------------------------------------+
```

### Mobile Responsive Design

On mobile devices, the comparison will use a stacked card layout instead of a wide table, showing each parameter as a card with both values and the change indicator.

---

## Component Details

### 1. CompareReports Page (`src/pages/CompareReports.tsx`)

**State Management:**
- `reportAId`: Selected first report UUID
- `reportBId`: Selected second report UUID
- Query params support: `?reportA=uuid&reportB=uuid` for direct linking

**Data Fetching:**
- Fetch patient data by ID
- Fetch all completed reports for the patient
- Fetch full report details for selected reports A and B

**Features:**
- Auto-select most recent two reports on load
- Swap reports button (A ↔ B)
- Only show comparable reports (same type or combined reports with overlapping tests)

### 2. ReportComparisonTable Component

**Props:**
```typescript
interface ReportComparisonTableProps {
  reportA: Report;
  reportB: Report;
  template: ReportTemplate;
  patientGender: Gender;
}
```

**Display Logic:**
- Iterate through template categories and fields
- For each field, show:
  - Field label and unit
  - Value from Report A
  - Value from Report B
  - Calculated difference (absolute and percentage)
  - Trend indicator icon
  - Normal range reference

**Visual Indicators:**
| Change | Color | Icon |
|--------|-------|------|
| Improved (toward normal) | Green | ↗ |
| Declined (away from normal) | Red | ↘ |
| Stable (< 5% change) | Gray | → |
| New value (was empty) | Blue | ★ |

### 3. useReportComparison Hook

**Functionality:**
```typescript
interface UseReportComparisonResult {
  reportA: Report | null;
  reportB: Report | null;
  comparison: ComparisonResult[];
  isLoading: boolean;
  commonFields: string[];
  uniqueToA: string[];
  uniqueToB: string[];
}

interface ComparisonResult {
  fieldName: string;
  fieldLabel: string;
  unit: string;
  valueA: number | string | null;
  valueB: number | string | null;
  absoluteChange: number | null;
  percentChange: number | null;
  trend: 'improved' | 'declined' | 'stable' | 'new' | 'removed';
  normalRange: string;
  statusA: 'normal' | 'abnormal' | 'unknown';
  statusB: 'normal' | 'abnormal' | 'unknown';
}
```

---

## Entry Points

### From Patient Detail Page

Add a "Compare Reports" button in the Report History section header:

```tsx
<Button 
  variant="outline" 
  size="sm" 
  onClick={() => navigate(`/patients/${id}/compare`)}
  disabled={reports?.length < 2}
>
  <GitCompare className="h-4 w-4 mr-2" />
  Compare
</Button>
```

### From Report View Page

Add "Compare with..." button in the action bar:

```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => navigate(`/patients/${report.patient_id}/compare?reportB=${report.id}`)}
>
  <GitCompare className="h-4 w-4 mr-2" />
  Compare
</Button>
```

---

## Comparison Logic

### Matching Fields Between Reports

For combined reports with different included tests:
1. Build templates for both reports
2. Find intersection of field names
3. Display common fields in comparison table
4. Show "Only in Report A" and "Only in Report B" sections for unique fields

### Trend Calculation

```typescript
function calculateTrend(
  valueA: number,
  valueB: number,
  normalRange: { min?: number; max?: number }
): 'improved' | 'declined' | 'stable' {
  const percentChange = ((valueB - valueA) / valueA) * 100;
  
  // Stable if change is less than 5%
  if (Math.abs(percentChange) < 5) return 'stable';
  
  // Determine if moving toward or away from normal range
  const midpoint = ((normalRange.min || 0) + (normalRange.max || 0)) / 2;
  const wasCloser = Math.abs(valueA - midpoint);
  const isCloser = Math.abs(valueB - midpoint);
  
  return isCloser < wasCloser ? 'improved' : 'declined';
}
```

---

## Route Configuration

Add to `AnimatedRoutes.tsx`:

```tsx
import CompareReports from "@/pages/CompareReports";

// Inside Routes
<Route path="/patients/:id/compare" element={<CompareReports />} />
```

---

## Summary of Changes

| Task | File | Description |
|------|------|-------------|
| 1 | `src/pages/CompareReports.tsx` | Create new comparison page with dual selectors and table |
| 2 | `src/components/reports/ReportComparisonTable.tsx` | Create reusable comparison table component |
| 3 | `src/hooks/useReportComparison.ts` | Create hook for comparison logic |
| 4 | `src/components/AnimatedRoutes.tsx` | Add comparison route |
| 5 | `src/pages/PatientDetail.tsx` | Add "Compare Reports" button |
| 6 | `src/pages/ReportView.tsx` | Add "Compare with..." action |

---

## Edge Cases Handled

1. **Different report types**: Show only matching fields, with sections for unique fields
2. **Combined vs single reports**: Extract overlapping test data for comparison
3. **Missing values**: Show "N/A" with appropriate styling
4. **Text-based fields** (Positive/Negative): Show text comparison without percentage
5. **Less than 2 reports**: Disable compare button with tooltip explanation
6. **Same report selected twice**: Prevent or show warning
