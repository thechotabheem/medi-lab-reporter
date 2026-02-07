
# Multi-Report Comparison Feature

## Overview

Extend the current side-by-side comparison to support comparing **3 or more reports** simultaneously. This enables comprehensive patient history analysis by tracking lab value trends across multiple time points in a single view.

---

## Current State

The existing comparison feature:
- Compares exactly 2 reports (Report A vs Report B)
- Uses `useReportComparison` hook for dual-report logic
- Displays in `ReportComparisonTable` with two value columns
- Exports to PDF with two-column format

---

## User Flow

```text
1. User navigates to Patient Detail page
2. User clicks "Compare Reports" button  
3. New page opens with multi-select interface (default: 2 reports)
4. User can click "+ Add Report" to add more columns (up to 5)
5. Each report shows in its own column, ordered by date
6. Trend indicators show overall progression across all reports
7. User exports multi-report comparison PDF
```

---

## Technical Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useMultiReportComparison.ts` | New hook for comparing 3+ reports |
| `src/components/reports/MultiReportComparisonTable.tsx` | New table supporting N columns |
| `src/lib/multi-comparison-pdf-generator.ts` | PDF generator for multi-report comparisons |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CompareReports.tsx` | Replace dual-selector with multi-select, add mode toggle |
| `src/components/reports/ReportComparisonTable.tsx` | Refactor to support dynamic column count |

---

## Page Design Updates

### Multi-Report Selection UI

```text
+------------------------------------------------------------------+
|  [Back] Compare Reports                Patient: John Doe          |
+------------------------------------------------------------------+
|  View Mode:  [2 Reports] [Multi-Report (3-5)]                     |
+------------------------------------------------------------------+
|                                                                    |
|  +----------------+  +----------------+  +----------------+  [+]  |
|  | Report 1       |  | Report 2       |  | Report 3       |       |
|  | [Dropdown]     |  | [Dropdown]     |  | [Dropdown]     |       |
|  | Jan 15, 2025   |  | Jun 10, 2025   |  | Feb 5, 2026    |       |
|  | [×]            |  | [×]            |  | [×]            |       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                    |
+------------------------------------------------------------------+
|  Comparison Results                                                |
+------------------------------------------------------------------+
| Test          | Report 1  | Report 2  | Report 3  | Trend | Range |
|---------------|-----------|-----------|-----------|-------|-------|
| Hemoglobin    | 12.5      | 13.2      | 14.2      |  ↗    | 12-17 |
| WBC Count     | 8500      | 8200      | 7900      |  ↘    | 4K-11K|
+------------------------------------------------------------------+
```

### Mobile Responsive Design

On mobile, the multi-report view will:
- Stack report selectors vertically
- Use horizontal scroll for the comparison table
- Collapse to 2-report mode by default with option to expand

---

## Component Details

### 1. useMultiReportComparison Hook

```typescript
interface MultiComparisonResult {
  fieldName: string;
  fieldLabel: string;
  unit: string;
  values: (number | string | null)[];  // Array of values per report
  statuses: ('normal' | 'abnormal' | 'unknown')[]; // Status per report
  overallTrend: TrendType;  // Net trend from first to last
  normalRange: string;
  category: string;
  firstValue: number | string | null;
  lastValue: number | string | null;
  percentChangeOverall: number | null;
}

interface UseMultiReportComparisonResult {
  comparison: MultiComparisonResult[];
  commonFields: string[];
  fieldAvailability: Map<string, boolean[]>; // Which reports have which fields
  reportDates: string[];
}
```

**Trend Calculation for Multiple Reports:**
- **Overall Trend**: Compare first vs last report using existing algorithm
- **Trend Indicator**: Show net direction across all reports
- **Spark Visualization**: Mini trend line showing value progression (optional enhancement)

### 2. Report Selection State Management

```typescript
// In CompareReports.tsx
const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
const [comparisonMode, setComparisonMode] = useState<'dual' | 'multi'>('dual');

// Add report to comparison
const addReport = (reportId: string) => {
  if (selectedReportIds.length < 5 && !selectedReportIds.includes(reportId)) {
    setSelectedReportIds([...selectedReportIds, reportId]);
  }
};

// Remove report from comparison
const removeReport = (reportId: string) => {
  setSelectedReportIds(selectedReportIds.filter(id => id !== reportId));
};
```

### 3. MultiReportComparisonTable Component

```typescript
interface MultiReportComparisonTableProps {
  reports: Report[];  // Ordered by date
  comparison: MultiComparisonResult[];
  reportLabels: string[];  // Date labels for each report
  onRemoveReport?: (index: number) => void;
}
```

**Table Structure:**
- Dynamic column headers based on report count
- Sticky first column (parameter name) on horizontal scroll
- Color-coded cells for abnormal values
- Overall trend column showing net change

### 4. Multi-Report PDF Generator

Update PDF generation to:
- Handle N report columns (up to 5)
- Adjust column widths dynamically
- Show overall trend calculation
- Include date span in header (First report → Last report)

---

## UI Components

### Mode Toggle (Tabs)

```tsx
<Tabs value={comparisonMode} onValueChange={setComparisonMode}>
  <TabsList>
    <TabsTrigger value="dual">
      <span>2 Reports</span>
    </TabsTrigger>
    <TabsTrigger value="multi" disabled={reports?.length < 3}>
      <span>Multi-Report (3-5)</span>
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### Add Report Button

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowAddReport(true)}
  disabled={selectedReportIds.length >= 5}
  className="border-dashed"
>
  <Plus className="h-4 w-4 mr-1" />
  Add Report
</Button>
```

### Report Card with Remove

```tsx
<Card className="relative">
  <Button
    variant="ghost"
    size="icon"
    className="absolute top-1 right-1 h-6 w-6"
    onClick={() => removeReport(report.id)}
    disabled={selectedReportIds.length <= 2}
  >
    <X className="h-4 w-4" />
  </Button>
  {/* Report selector content */}
</Card>
```

---

## Comparison Logic Enhancements

### Finding Common Fields Across N Reports

```typescript
const findCommonFields = (reports: Report[]): string[] => {
  const fieldSets = reports.map(report => {
    const template = getTemplateForReport(report);
    const fields = new Set<string>();
    template?.categories.forEach(cat => 
      cat.fields.forEach(field => fields.add(field.name))
    );
    return fields;
  });
  
  // Intersection of all field sets
  return [...fieldSets[0]].filter(field =>
    fieldSets.every(set => set.has(field))
  );
};
```

### Overall Trend Calculation

```typescript
const calculateOverallTrend = (
  values: (number | null)[],
  field: TestField,
  gender: Gender
): TrendType => {
  // Filter to numeric values only
  const numericValues = values.filter(v => v !== null) as number[];
  if (numericValues.length < 2) return 'unchanged';
  
  const firstValue = numericValues[0];
  const lastValue = numericValues[numericValues.length - 1];
  
  // Use existing trend calculation
  return calculateTrend(firstValue, lastValue, field, gender);
};
```

---

## Entry Point Updates

### PatientDetail.tsx

Update the "Compare Reports" button to show report count:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => navigate(`/patients/${id}/compare`)}
  disabled={completedReports < 2}
>
  <GitCompare className="h-4 w-4 mr-2" />
  Compare ({completedReports} reports)
</Button>
```

---

## Summary of Changes

| Task | File | Description |
|------|------|-------------|
| 1 | `src/hooks/useMultiReportComparison.ts` | Create hook for N-report comparison logic |
| 2 | `src/components/reports/MultiReportComparisonTable.tsx` | Create table supporting dynamic columns |
| 3 | `src/pages/CompareReports.tsx` | Add mode toggle, multi-select UI, refactor state |
| 4 | `src/lib/multi-comparison-pdf-generator.ts` | Create multi-report PDF generator |
| 5 | `src/lib/comparison-pdf-generator.ts` | Refactor to share utilities with multi-generator |
| 6 | `src/pages/PatientDetail.tsx` | Show report count in compare button |

---

## Edge Cases Handled

1. **Less than 3 reports**: Multi-report tab is disabled, defaults to dual mode
2. **Maximum 5 reports**: Add button disabled when limit reached
3. **Reports with different tests**: Show values only where field exists, blank otherwise
4. **Removing reports**: Cannot go below 2 reports minimum
5. **Mobile view**: Horizontal scroll with sticky parameter column
6. **Same report twice**: Prevent duplicate selection with disabled state

---

## Technical Notes

- **Performance**: Memoize comparison calculations with useMemo based on report IDs
- **URL State**: Store selected report IDs in query params for shareable links: `?reports=uuid1,uuid2,uuid3`
- **Backwards Compatibility**: Existing `/compare?reportA=x&reportB=y` URLs continue to work
- **PDF Column Width**: Auto-calculate based on report count: `availableWidth / (reportCount + 2)`
