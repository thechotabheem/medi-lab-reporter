
# Template Editor Bug Fixes and Enhancement Plan

## Summary

After thorough investigation of the Template Editor and related components, I identified several critical bugs and areas for improvement. The main issue is that **fully custom templates** (created from scratch in the Template Editor) are not properly integrated with the existing template lookup system, causing them to fail silently or show incorrectly in various parts of the application.

## Issues Identified

### Critical Bugs

1. **Custom templates don't render in report forms**
   - `useCustomizedTemplate` hook (line 478) uses `reportTemplates[reportType]` which returns `undefined` for custom templates
   - `CombinedReportForm.tsx` (lines 34, 72) skips custom templates entirely
   - `DynamicReportForm.tsx` relies on `useCustomizedTemplate` which fails for custom templates

2. **Custom templates don't appear in PDF generation**
   - `buildCombinedTemplate()` in `report-templates.ts` (line 364) only looks up built-in templates
   - Custom templates are skipped when generating combined report PDFs

3. **Report type name lookup fails for custom templates**
   - `getReportTypeName()` returns the raw code instead of the template name for custom templates

4. **TestSelectionSummary shows incorrect field counts**
   - `TestSelectionSummary.tsx` (line 59) uses hardcoded `reportTemplates` lookup

### UX Issues

5. **No ability to edit existing custom templates**
   - Users can create custom templates but cannot modify them later
   
6. **No confirmation when deleting custom templates**
   - Deletion is instant without warning

7. **Quick Custom Test only works in combined mode**
   - Users cannot use Quick Custom Test for single-test reports

## Solution Architecture

```text
+------------------------+     +---------------------------+
|   reportTemplates      |     |   custom_templates DB     |
|   (built-in types)     |     |   (user-created types)    |
+------------------------+     +---------------------------+
            |                              |
            v                              v
+----------------------------------------------------------+
|            getTemplateForReport(type)                     |
|   - Checks built-in templates first                      |
|   - Falls back to database custom templates              |
|   - Returns complete ReportTemplate structure            |
+----------------------------------------------------------+
```

## Implementation Details

### Phase 1: Core Template Resolution (High Priority)

**File: `src/hooks/useCustomTemplates.ts`**

Add a new hook and helper functions:

```typescript
// New: Fetch a fully custom template by its code
export const useFullyCustomTemplateByCode = (code: string | null) => {
  const { clinicId } = useClinic();
  
  return useQuery({
    queryKey: ['fully-custom-template', clinicId, code],
    queryFn: async () => {
      if (!code || !isFullyCustomTemplate(code)) return null;
      
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('base_template', code)
        .maybeSingle();
        
      if (error || !data) return null;
      
      const parsed = parseFullyCustomTemplate(data.customizations);
      return parsed ? fullyCustomToReportTemplate(parsed) : null;
    },
    enabled: !!code && isFullyCustomTemplate(code),
  });
};
```

Update `useCustomizedTemplate` to handle both built-in and custom templates:

```typescript
export const useCustomizedTemplate = (reportType: ReportType | null) => {
  const { data: customTemplate, isLoading: loadingCustom } = useCustomTemplate(reportType);
  const { data: fullyCustom, isLoading: loadingFully } = useFullyCustomTemplateByCode(
    reportType && isFullyCustomTemplate(reportType) ? reportType : null
  );
  
  const isLoading = loadingCustom || loadingFully;
  
  if (!reportType || isLoading) {
    return { template: null, isLoading };
  }
  
  // Check if it's a fully custom template first
  if (isFullyCustomTemplate(reportType) && fullyCustom) {
    return { template: fullyCustom, isLoading: false };
  }
  
  // Fall back to built-in template with customizations
  const baseTemplate = reportTemplates[reportType];
  if (!baseTemplate) {
    return { template: null, isLoading: false };
  }
  
  const customizations = parseCustomizations(customTemplate?.customizations);
  const template = applyCustomizations(baseTemplate, customizations);
  
  return { template, isLoading, customizations };
};
```

### Phase 2: Fix Report Type Name Resolution

**File: `src/lib/report-templates.ts`**

Create a new async-aware name resolver that the sync version falls back to:

```typescript
export const getReportTypeName = (type: ReportType | string): string => {
  // Check built-in templates first
  const builtIn = reportTemplates[type as ReportType];
  if (builtIn) return builtIn.name;
  
  // For custom templates, return a formatted version of the code
  if (type.startsWith('custom_') || type.startsWith('quick_')) {
    // Extract name from code: "custom_thyroid_panel_123" -> "Thyroid Panel"
    const parts = type.replace(/^(custom_|quick_)/, '').replace(/_\d+$/, '');
    return parts.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  
  return type;
};
```

### Phase 3: Fix Combined Report Form

**File: `src/components/reports/CombinedReportForm.tsx`**

The component needs to handle custom templates. Since we need async data, we'll create a wrapper component:

```typescript
// Create a sub-component for each test section that handles its own template loading
const TestSection = ({ testType, patient, onChange, initialData }) => {
  const { template, isLoading } = useCustomizedTemplate(testType);
  
  if (isLoading) return <Skeleton />;
  if (!template) return null;
  
  return (
    <AccordionItem value={testType}>
      <AccordionTrigger>
        {template.name}
        <Badge>{template.categories.reduce((t, c) => t + c.fields.length, 0)} fields</Badge>
      </AccordionTrigger>
      <AccordionContent>
        <DynamicReportForm
          reportType={testType}
          patient={patient}
          onChange={onChange}
          initialData={initialData}
        />
      </AccordionContent>
    </AccordionItem>
  );
};
```

### Phase 4: Fix PDF Generation

**File: `src/lib/pdf-generator.ts`**

Add a function to resolve templates including custom ones. Since PDF generation happens in a synchronous context, we need to pass the resolved template data:

```typescript
// Modify generateReportPDF to accept an optional pre-resolved template
export const generateReportPDF = async (
  report: Report,
  patient: Patient,
  clinic: ClinicSettings,
  options?: { customTemplates?: Map<string, ReportTemplate> }
) => {
  // ... existing code ...
  
  // For included_tests, resolve each template
  if (report.included_tests) {
    for (const testType of report.included_tests) {
      const template = reportTemplates[testType] 
        || options?.customTemplates?.get(testType);
      // Use resolved template
    }
  }
};
```

### Phase 5: Add Edit Custom Template Feature

**File: `src/components/template-editor/EditCustomTemplateDialog.tsx`** (new file)

Create a dialog similar to `CreateCustomTemplateDialog` but pre-populated with existing template data and an update mutation.

**File: `src/pages/TemplateEditor.tsx`**

Add an "Edit" button next to each custom template in the list.

### Phase 6: Add Delete Confirmation

**File: `src/pages/TemplateEditor.tsx`**

Replace the direct delete with an AlertDialog confirmation:

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon" className="text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Custom Template?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "{templateName}". 
        Existing reports using this template will not be affected.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => deleteFullyCustomTemplate(code)}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Phase 7: Enable Quick Custom Test for Single-Test Mode

**File: `src/components/reports/TemplateSelector.tsx`**

Remove the `multiSelect` condition from the QuickCustomTestDialog rendering:

```typescript
// Before: {multiSelect && onAddCustomTest && (
// After:  {onAddCustomTest && (
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCustomTemplates.ts` | Add `useFullyCustomTemplateByCode` hook, update `useCustomizedTemplate` |
| `src/lib/report-templates.ts` | Update `getReportTypeName` and `buildCombinedTemplate` to handle custom templates |
| `src/components/reports/CombinedReportForm.tsx` | Create `TestSection` component that uses hooks for template resolution |
| `src/components/reports/TestSelectionSummary.tsx` | Use hook-based template resolution |
| `src/lib/pdf-generator.ts` | Accept custom template map for combined reports |
| `src/pages/ReportView.tsx` | Pass resolved custom templates to PDF generator |
| `src/pages/TemplateEditor.tsx` | Add edit button, delete confirmation dialog |
| `src/components/template-editor/EditCustomTemplateDialog.tsx` | New file - edit dialog |
| `src/components/reports/TemplateSelector.tsx` | Enable Quick Custom Test for single mode |

## Testing Checklist

After implementation, verify:

1. Create a new custom template from Template Editor wizard
2. Select the custom template in single-test mode and verify form renders
3. Select the custom template in combined mode with other tests
4. Save a report using the custom template
5. View the saved report and verify data displays correctly
6. Generate PDF for a report with custom template
7. Edit an existing custom template
8. Delete a custom template (confirm dialog appears)
9. Verify existing reports still work after template deletion
10. Test Quick Custom Test in single-test mode

## Implementation Order

1. Fix `useCustomizedTemplate` hook (critical - enables all other fixes)
2. Fix `getReportTypeName` function
3. Fix `CombinedReportForm` component
4. Fix `TestSelectionSummary` component
5. Fix PDF generation
6. Add edit functionality
7. Add delete confirmation
8. Enable Quick Custom Test for single mode

Total estimated time: 2-3 hours
