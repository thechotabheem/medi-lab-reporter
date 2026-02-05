

# Remove Logo Generator Page

## Summary

Remove the AI-powered logo generator feature that was recently added, including the page component, route, and edge function.

---

## Files to Modify/Delete

| File | Action | Changes |
|------|--------|---------|
| `src/pages/LogoGenerator.tsx` | Delete | Remove the entire file |
| `src/components/AnimatedRoutes.tsx` | Modify | Remove the LogoGenerator import and `/settings/logo` route |
| `supabase/functions/generate-logo/index.ts` | Delete | Remove the edge function |

---

## Changes Detail

### 1. AnimatedRoutes.tsx

Remove the import and route:

```typescript
// Remove this import
import LogoGenerator from "@/pages/LogoGenerator";

// Remove this route
<Route path="/settings/logo" element={<LogoGenerator />} />
```

### 2. Delete Files

- `src/pages/LogoGenerator.tsx`
- `supabase/functions/generate-logo/index.ts`

### 3. Delete Deployed Edge Function

Use the Supabase delete edge function tool to remove the deployed `generate-logo` function.

---

## Notes

- The Settings page does not have a link to the logo generator, so no additional cleanup is needed there
- The edge function will be deleted from the deployed environment as well

