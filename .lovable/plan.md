

# Update Favicon & PWA Icons with Custom Logo

## Overview
Replace all existing favicon and PWA icons with the user's uploaded custom SVG logo.

## Current State
- Favicon: `/favicon.png` (PNG format)
- PWA Icons: `apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png`
- All using previously uploaded custom branding

## Implementation

### Step 1: Copy Icon to Public Directory

Copy the uploaded SVG to the public folder:
```
lov-copy user-uploads://icon.svg public/icon.svg
```

### Step 2: Update Favicon in index.html

**File: `index.html`**

Update the favicon link to use SVG format:
```html
<!-- Change from -->
<link rel="icon" type="image/png" href="/favicon.png">

<!-- Change to -->
<link rel="icon" type="image/svg+xml" href="/icon.svg">
```

### Step 3: Update PWA Manifest Icons

**File: `vite.config.ts`**

Update the PWA manifest configuration to include the SVG icon:

```typescript
icons: [
  {
    src: "icon.svg",
    sizes: "any",
    type: "image/svg+xml",
  },
  {
    src: "icon.svg",
    sizes: "any", 
    type: "image/svg+xml",
    purpose: "maskable",
  },
]
```

### Step 4: Update Apple Touch Icon

**File: `index.html`**

Update the apple-touch-icon reference:
```html
<link rel="apple-touch-icon" href="/icon.svg" />
```

**File: `vite.config.ts`**

Update includeAssets:
```typescript
includeAssets: ["favicon.ico", "icon.svg"],
```

---

## Important Note on Compatibility

SVG icons are well-supported for:
- Modern browser favicons (Chrome, Firefox, Edge, Safari)
- PWA icons in modern browsers

However, some older devices/browsers may have limited SVG support for PWA icons. If you experience any issues on specific devices, PNG versions at 192x192 and 512x512 pixels may be needed as fallbacks.

---

## Files to Modify

1. Copy `user-uploads://icon.svg` → `public/icon.svg`
2. `index.html` - Update favicon and apple-touch-icon links
3. `vite.config.ts` - Update PWA manifest icon configuration

## Result

Your custom logo will appear as:
- Browser tab favicon
- PWA app icon on home screens
- PWA splash screen icon
- Apple device bookmark icon

