
-- Add PDF style template option: 'modern' (current) or 'classic'
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS pdf_style text DEFAULT 'modern';

-- Add logo watermark option (use logo as faint background on every page)
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS logo_watermark_enabled boolean DEFAULT false;
