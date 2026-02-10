

# Make Number Input Fields Empty by Default

## Overview

Number input fields in the report form currently show "0.00" as placeholder text, which can be confused with an actual value. This change will make them clearly empty with a more descriptive placeholder.

---

## Changes

### 1. `src/components/reports/DynamicReportForm.tsx`

- **Line 268**: Change the placeholder from `'0.00'` to an empty string `''` so unfilled number fields appear completely blank
- This affects all number-type fields across all report templates (CBC, Lipid Panel, Liver Function, etc.)

### 2. Data Initialization Check

- The `value` binding on line 267 already uses `?? ''` which correctly maps `undefined`/`null` to empty string
- No changes needed to the value binding logic

---

## Result

- Number fields will appear completely empty when creating a new report
- When editing an existing report, only fields with actual saved values will show data
- No visual confusion between empty fields and zero values

