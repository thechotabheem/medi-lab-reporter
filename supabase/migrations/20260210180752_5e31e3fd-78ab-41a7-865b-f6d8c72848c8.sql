
-- Drop existing permissive policies on patients
DROP POLICY IF EXISTS "Anyone can view patients" ON public.patients;
DROP POLICY IF EXISTS "Anyone can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Anyone can update patients" ON public.patients;
DROP POLICY IF EXISTS "Anyone can delete patients" ON public.patients;

-- Create authenticated-only policies for patients
CREATE POLICY "Authenticated users can view patients"
ON public.patients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert patients"
ON public.patients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete patients"
ON public.patients FOR DELETE TO authenticated USING (true);

-- Drop existing permissive policies on reports
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can update reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can delete reports" ON public.reports;

-- Create authenticated-only policies for reports
CREATE POLICY "Authenticated users can view reports"
ON public.reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert reports"
ON public.reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update reports"
ON public.reports FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete reports"
ON public.reports FOR DELETE TO authenticated USING (true);

-- Drop existing permissive policies on report_images
DROP POLICY IF EXISTS "Anyone can view report images" ON public.report_images;
DROP POLICY IF EXISTS "Anyone can insert report images" ON public.report_images;
DROP POLICY IF EXISTS "Anyone can delete report images" ON public.report_images;

-- Create authenticated-only policies for report_images
CREATE POLICY "Authenticated users can view report images"
ON public.report_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert report images"
ON public.report_images FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete report images"
ON public.report_images FOR DELETE TO authenticated USING (true);

-- Drop existing permissive policies on saved_comparisons
DROP POLICY IF EXISTS "Anyone can view saved comparisons" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Anyone can insert saved comparisons" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Anyone can update saved comparisons" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Anyone can delete saved comparisons" ON public.saved_comparisons;

-- Create authenticated-only policies for saved_comparisons
CREATE POLICY "Authenticated users can view saved comparisons"
ON public.saved_comparisons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert saved comparisons"
ON public.saved_comparisons FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update saved comparisons"
ON public.saved_comparisons FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete saved comparisons"
ON public.saved_comparisons FOR DELETE TO authenticated USING (true);

-- Drop existing permissive policies on custom_templates
DROP POLICY IF EXISTS "Anyone can view custom templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Anyone can insert custom templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Anyone can update custom templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Anyone can delete custom templates" ON public.custom_templates;

-- Create authenticated-only policies for custom_templates
CREATE POLICY "Authenticated users can view custom templates"
ON public.custom_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert custom templates"
ON public.custom_templates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update custom templates"
ON public.custom_templates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete custom templates"
ON public.custom_templates FOR DELETE TO authenticated USING (true);

-- Drop existing permissive policies on clinics
DROP POLICY IF EXISTS "Anyone can view clinics" ON public.clinics;
DROP POLICY IF EXISTS "Anyone can update clinics" ON public.clinics;

-- Create authenticated-only policies for clinics
CREATE POLICY "Authenticated users can view clinics"
ON public.clinics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update clinics"
ON public.clinics FOR UPDATE TO authenticated USING (true);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, clinic_id, full_name, email)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
