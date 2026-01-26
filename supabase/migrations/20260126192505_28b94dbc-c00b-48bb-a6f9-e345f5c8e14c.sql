-- Add new branding columns to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS watermark_text TEXT,
ADD COLUMN IF NOT EXISTS enable_qr_code BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#00968F';

-- Create custom_templates table for template customization
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  base_template TEXT NOT NULL,
  customizations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on custom_templates
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_templates (open access like other tables)
CREATE POLICY "Anyone can view custom templates" ON public.custom_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert custom templates" ON public.custom_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update custom templates" ON public.custom_templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete custom templates" ON public.custom_templates FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_templates_updated_at
BEFORE UPDATE ON public.custom_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();