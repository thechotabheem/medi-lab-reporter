
# Remove Light Theme - Dark Only Mode

## Overview

This plan removes all light theme support from the application, making dark mode the only available theme. This simplifies the codebase and ensures a consistent dark aesthetic across the entire application.

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/ThemeContext.tsx` | Simplify | Remove theme switching logic, always use dark |
| `src/components/ui/theme-toggle.tsx` | Delete | No longer needed |
| `src/pages/Dashboard.tsx` | Modify | Remove ThemeToggle from header |
| `src/pages/Settings.tsx` | Modify | Remove entire Appearance settings card |
| `src/components/ui/sonner.tsx` | Modify | Hardcode dark theme |
| `src/components/ui/chart.tsx` | Modify | Remove light theme from THEMES constant |
| `src/index.css` | Modify | Remove `.light` class CSS variables |

---

## Implementation Details

### 1. Simplify ThemeContext (`src/contexts/ThemeContext.tsx`)

The context will be simplified to always apply dark theme on mount without any user-selectable options:

- Remove `Theme` type with multiple options
- Remove `setTheme` function and localStorage logic
- Keep `resolvedTheme` always returning `'dark'`
- On mount, ensure `document.documentElement` has the `dark` class
- Remove system preference media query listener

### 2. Delete ThemeToggle Component

Remove `src/components/ui/theme-toggle.tsx` entirely as it's no longer needed.

### 3. Update Dashboard (`src/pages/Dashboard.tsx`)

- Remove the `ThemeToggle` import
- Remove `<ThemeToggle />` from the header (line 49)
- Keep only `<PWAInstallPrompt />` in that area

### 4. Update Settings Page (`src/pages/Settings.tsx`)

- Remove the `ThemeToggle` import
- Remove the `Palette` icon import (no longer needed)
- Remove the entire "Appearance" card section (lines 130-153)
- This leaves only "Clinic Settings" and "Notifications" cards

### 5. Update Sonner Toast Component (`src/components/ui/sonner.tsx`)

- Remove the `useTheme` import from `next-themes`
- Hardcode `theme="dark"` on the Sonner component
- Note: This file incorrectly imports from `next-themes` instead of our ThemeContext

### 6. Update Chart Component (`src/components/ui/chart.tsx`)

- Change the `THEMES` constant from `{ light: "", dark: ".dark" }` to only `{ dark: "" }`
- Since dark is now the default (on `:root`), the dark selector becomes empty string
- This ensures chart theme colors work correctly

### 7. Clean Up CSS (`src/index.css`)

- Remove the entire `.light` class definition (lines 106-169)
- Keep only `:root` with dark theme values (already defined)
- Remove the duplicate `.dark` class (lines 171-234) since `:root` already has the dark values

---

## Technical Flow After Changes

```text
App loads
    |
    v
ThemeProvider mounts
    |
    v
Adds 'dark' class to <html>
    |
    v
CSS uses :root variables (dark theme)
    |
    v
All components render with dark styling
```

---

## Code Changes Summary

### ThemeContext (Simplified)

The new ThemeContext will:
- Export `useTheme()` hook returning `{ theme: 'dark', resolvedTheme: 'dark' }`
- Export `ThemeProvider` that only ensures dark class is applied
- No state management, no localStorage, no system preference detection

### CSS Structure (After Cleanup)

```text
:root {
  /* Dark theme variables - the only theme */
  --background: 220 15% 4%;
  --foreground: 210 20% 98%;
  ... (all current dark values)
}

/* No .light or .dark classes needed */
```

---

## Impact

- **Removed**: Theme toggle button from Dashboard header
- **Removed**: Appearance settings card from Settings page
- **Simplified**: No localStorage theme preference storage
- **Consistent**: Always dark theme, no visual switching
- **Cleaner code**: ~150 lines of CSS removed, component deleted

---

## Notes

- The PWA manifest in `vite.config.ts` already uses dark colors (`#0a0c10` background) so no changes needed there
- The `tailwind.config.ts` can keep `darkMode: ["class"]` for compatibility, though it becomes effectively unused
- Any localStorage entries with key `app-theme` will be ignored (harmless legacy data)
