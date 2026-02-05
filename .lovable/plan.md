
# Edit Custom Templates & Report Validation Plan

## Summary

This plan adds two important features:
1. **Edit Existing Custom Templates** - Allow users to modify custom templates after creation
2. **Report Validation** - Prevent saving reports with completely empty test results

---

## Feature 1: Edit Custom Templates

### New File: `EditCustomTemplateDialog.tsx`

Create a new dialog component that mirrors the structure of `CreateCustomTemplateDialog.tsx` but:
- Pre-populates with existing template data
- Uses an update mutation instead of insert
- Preserves the original template code

### Changes to `useCustomTemplates.ts`

Add a new mutation hook for updating fully custom templates:

```typescript
export const useUpdateFullyCustomTemplate = () => {
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();

  return useMutation({
    mutationFn: async ({ 
      code, 
      templateData 
    }: { 
      code: string; 
      templateData: Omit<FullyCustomTemplateData, 'isFullyCustom' | 'createdAt'> 
    }) => {
      const customizations: FullyCustomTemplateData = {
        ...templateData,
        isFullyCustom: true,
        createdAt: new Date().toISOString(), // Keep updated time
      };

      const { data, error } = await supabase
        .from('custom_templates')
        .update({ 
          customizations: customizations as unknown as Json,
          updated_at: new Date().toISOString() 
        })
        .eq('clinic_id', clinicId)
        .eq('base_template', code)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fully-custom-templates'] });
      queryClient.invalidateQueries({ queryKey: ['custom-templates'] });
      toast.success('Custom template updated successfully');
    },
  });
};
```

### Changes to `TemplateEditor.tsx`

Add an Edit button next to each custom template in the "Your Custom Templates" section:

```typescript
<div className="flex gap-1">
  <EditCustomTemplateDialog 
    template={t}
    onSave={updateFullyCustomTemplate}
    isSaving={isUpdating}
  />
  <AlertDialog>
    {/* existing delete button */}
  </AlertDialog>
</div>
```

---

## Feature 2: Report Validation

### Changes to `CreateReport.tsx`

Add validation before saving to ensure at least one field has data:

```typescript
const validateReportData = (): boolean => {
  if (isCombinedMode) {
    // Check if any test has at least one non-empty value
    const hasData = Object.values(combinedReportData).some(testData => 
      Object.values(testData).some(value => 
        value !== null && value !== '' && value !== undefined
      )
    );
    if (!hasData) {
      toast.error('Please fill in at least one test value before saving');
      return false;
    }
  } else {
    // Single test mode
    const hasData = Object.values(reportData).some(value => 
      value !== null && value !== '' && value !== undefined
    );
    if (!hasData) {
      toast.error('Please fill in at least one test value before saving');
      return false;
    }
  }
  return true;
};

// In handleSave function:
const handleSave = async (status: 'draft' | 'completed') => {
  // Skip validation for drafts
  if (status === 'completed' && !validateReportData()) {
    return;
  }
  // ... rest of save logic
};
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/template-editor/EditCustomTemplateDialog.tsx` | Create | New dialog for editing existing custom templates |
| `src/hooks/useCustomTemplates.ts` | Modify | Add `useUpdateFullyCustomTemplate` mutation hook |
| `src/pages/TemplateEditor.tsx` | Modify | Add Edit button, import and use the new dialog |
| `src/pages/CreateReport.tsx` | Modify | Add validation function, call before save |

---

## Implementation Details

### EditCustomTemplateDialog Component

The dialog will:
- Accept an existing template object as a prop
- Use the same 4-step wizard UI as the create dialog
- Pre-populate all fields (name, categories, fields)
- Keep the original template code unchanged
- Show "Update Template" instead of "Create Template" in the button

### Validation Rules

For completed reports:
- At least one field must have a non-empty value
- Empty strings, null, and undefined are considered empty
- Numbers (including 0) are considered valid values
- Drafts can be saved without validation

---

## Technical Notes

- The edit dialog reuses most of the UI from `CreateCustomTemplateDialog`
- Template code is preserved during edits to maintain report associations
- Validation runs client-side for immediate feedback
- Drafts bypass validation to allow partial saves
