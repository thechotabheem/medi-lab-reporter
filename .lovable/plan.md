
# Professional Logo Design for Zia Clinic & Maternity Home

## Overview

I'll use the AI image generation capabilities (Lovable AI) to create a professional, eye-catching logo for Zia Clinic & Maternity Home that aligns with the existing design system and medical aesthetic.

---

## Design Direction

### Brand Identity Elements
- **Name**: Zia Clinic & Maternity Home
- **Industry**: Medical/Healthcare (Clinic + Maternity Services)
- **Current Color Palette**: 
  - Primary Teal: `#14b8a6` / `hsl(162, 84%, 42%)`
  - Background: `#090a0d` (dark)
  - Text: `#f8fafc` (light)

### Logo Concept Ideas
1. **Medical + Maternity Fusion**: Combine medical elements (cross, heartbeat) with maternal symbols (mother & child silhouette, heart)
2. **Monogram Style**: Stylized "Z" or "ZC" with medical/maternity accents
3. **Abstract Symbol**: Modern geometric shape representing care, protection, and health
4. **Icon + Wordmark**: Clean symbol that works standalone and with text

---

## Implementation Plan

### Step 1: Generate Logo Options
Create an edge function or use client-side AI to generate multiple logo concepts:
- Use `google/gemini-2.5-flash-image` or `google/gemini-3-pro-image-preview` for image generation
- Generate 2-3 variations with different styles

### Step 2: Create Logo Generation Page
Add a temporary page or dialog for logo generation:
- Allow regeneration with different prompts
- Preview logos on both light and dark backgrounds
- Download selected logo

### Step 3: Integrate Selected Logo
- Save the final logo to Supabase storage (or as SVG)
- Update `public/icon.svg` with the new logo
- Ensure PWA icons are updated

---

## Technical Approach

### Option A: Edge Function (Recommended)
Create `supabase/functions/generate-logo/index.ts`:
- Accepts logo description/style parameters
- Uses Lovable AI gateway for image generation
- Returns base64 image for preview
- Uploads final selection to storage

### Option B: Client-Side Component
Create a logo generator component:
- Uses fetch to Lovable AI gateway directly
- Displays generated options in a gallery
- Allows selection and upload to storage

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/generate-logo/index.ts` | Create | Edge function for AI logo generation |
| `src/pages/LogoGenerator.tsx` | Create | UI for generating and selecting logos |
| `src/App.tsx` | Modify | Add route for logo generator |
| `public/icon.svg` | Replace | Update with selected final logo |

---

## Suggested Logo Prompt

```text
Create a professional, modern logo for "Zia Clinic & Maternity Home". 
Style: Clean, minimalist medical/healthcare design.
Colors: Teal (#14b8a6) on transparent or dark background.
Elements: Subtly combine medical symbolism (health, care) with maternity theme (motherhood, nurturing).
Format: Simple icon that works at small sizes, suitable for app icon and favicon.
No text in the logo - symbol only.
```

---

## Alternative: Manual Design

If you prefer, I can create a hand-crafted SVG logo using:
- Clean geometric shapes
- The teal brand color
- Medical/maternity symbolism
- Optimized for all sizes (favicon to splash screen)

This would be a code-based SVG without AI generation.
