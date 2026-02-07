-- Create table for saved comparison configurations
CREATE TABLE public.saved_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_ids UUID[] NOT NULL,
  comparison_mode TEXT NOT NULL DEFAULT 'dual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Anyone can view saved comparisons"
ON public.saved_comparisons
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert saved comparisons"
ON public.saved_comparisons
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update saved comparisons"
ON public.saved_comparisons
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete saved comparisons"
ON public.saved_comparisons
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_comparisons_updated_at
BEFORE UPDATE ON public.saved_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying
CREATE INDEX idx_saved_comparisons_patient_id ON public.saved_comparisons(patient_id);
CREATE INDEX idx_saved_comparisons_clinic_id ON public.saved_comparisons(clinic_id);