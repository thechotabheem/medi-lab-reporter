
# Unify Templates: Make Custom Templates First-Class Citizens

## The Problem

Currently, the app has two separate systems for templates:

1. **Built-in templates** - hardcoded in `report-templates.ts` with their own type enum in the database (`cbc`, `lft`, etc.)
2. **Custom templates** - stored in `custom_templates` table with `custom_` or `quick_` prefixes, forced to use the `combined` report type as a workaround

This creates complexity everywhere: special prefix checks (`custom_`, `quick_`), separate UI sections ("Your Custom Templates" vs "Built-in Tests"), different data storage patterns, and workarounds to fit custom templates into the rigid database enum.

## The Solution

Merge both systems so custom templates appear and behave identically to built-in ones -- a single flat list, no "Custom" badges or separate sections, and a unified data flow.

### What Changes

**1. TemplateSelector.tsx -- Single unified list**
- Remove the separate "Your Custom Templates" and "Built-in Tests" sections
- Render one flat list combining both built-in and database custom templates, sorted alphabetically
- Remove "Custom" badges -- all templates look the same to the user
- Keep the search/filter which already works across both

**2. report-templates.ts -- Dynamic template registry**
- Add a runtime registry that custom templates get merged into when loaded
- Update `getReportTypeName()` to check the registry
- Update `activeReportTypes` to be dynamically built (merging hardcoded + loaded custom templates)

**3. useCustomTemplates.ts -- Simplified resolution**
- `useCustomizedTemplate` already handles both paths; simplify so custom templates return in the same format as built-in ones without the `isFullyCustom` flag mattering to consumers
- Remove `quick_` prefix handling (convert existing quick templates to use the same code pattern)

**4. CreateReport.tsx and EditReport.tsx -- Uniform save logic**
- Custom templates will continue using `combined` report type in the database (this is unavoidable without a DB enum change), but the branching logic will be simplified into a single helper function instead of scattered `startsWith('custom_')` checks

**5. CombinedReportForm.tsx -- Remove "Custom" badge**
- Remove the `isFullyCustomTemplate` check and "Custom" badge display

**6. Template Editor page -- Remove section separation**
- Merge "Your Custom Templates" and "Built-in Templates" into one list
- Custom templates show an "Edit" option; built-in ones show "Customize"

## Technical Details

### Files to modify:
- `src/components/reports/TemplateSelector.tsx` -- merge lists, remove separate sections
- `src/lib/report-templates.ts` -- add `registerCustomTemplates()` and `getAllActiveTemplates()` helpers
- `src/hooks/useCustomTemplates.ts` -- add a hook that merges custom templates into the registry on load
- `src/pages/CreateReport.tsx` -- extract `isCustomTemplate` check into a shared util, simplify branching
- `src/pages/EditReport.tsx` -- same simplification
- `src/components/reports/CombinedReportForm.tsx` -- remove Custom badge
- `src/pages/TemplateEditor.tsx` -- unified template list
- `src/hooks/usePatientHistory.ts` -- use the shared util instead of inline prefix checks

### Data compatibility:
- No database migration needed -- custom templates still use `combined` report type with `included_tests`
- Existing reports and custom templates continue working without changes
- The `custom_` prefix convention stays in the database, but the UI no longer exposes this distinction to users
