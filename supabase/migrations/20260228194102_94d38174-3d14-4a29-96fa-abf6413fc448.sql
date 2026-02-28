
-- 1. Fix RLS policies: scope by clinic_id for patients, reports, saved_comparisons, custom_templates
-- Drop existing overly-permissive policies and replace with clinic-scoped ones

-- PATIENTS
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;

CREATE POLICY "Users can view patients in their clinic" ON public.patients
  FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patients in their clinic" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patients in their clinic" ON public.patients
  FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete patients in their clinic" ON public.patients
  FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- REPORTS
DROP POLICY IF EXISTS "Authenticated users can view reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can delete reports" ON public.reports;

CREATE POLICY "Users can view reports in their clinic" ON public.reports
  FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert reports in their clinic" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update reports in their clinic" ON public.reports
  FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete reports in their clinic" ON public.reports
  FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- SAVED_COMPARISONS
DROP POLICY IF EXISTS "Authenticated users can view saved comparisons" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Authenticated users can insert saved comparisons" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Authenticated users can update saved comparisons" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Authenticated users can delete saved comparisons" ON public.saved_comparisons;

CREATE POLICY "Users can view comparisons in their clinic" ON public.saved_comparisons
  FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert comparisons in their clinic" ON public.saved_comparisons
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update comparisons in their clinic" ON public.saved_comparisons
  FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete comparisons in their clinic" ON public.saved_comparisons
  FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- CUSTOM_TEMPLATES
DROP POLICY IF EXISTS "Authenticated users can view custom templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Authenticated users can insert custom templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Authenticated users can update custom templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Authenticated users can delete custom templates" ON public.custom_templates;

CREATE POLICY "Users can view templates in their clinic" ON public.custom_templates
  FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert templates in their clinic" ON public.custom_templates
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update templates in their clinic" ON public.custom_templates
  FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete templates in their clinic" ON public.custom_templates
  FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ACTIVITY_LOGS
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;

CREATE POLICY "Users can view activity logs in their clinic" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert activity logs in their clinic" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

-- REPORT_IMAGES
DROP POLICY IF EXISTS "Authenticated users can view report images" ON public.report_images;
DROP POLICY IF EXISTS "Authenticated users can insert report images" ON public.report_images;
DROP POLICY IF EXISTS "Authenticated users can delete report images" ON public.report_images;

CREATE POLICY "Users can view report images" ON public.report_images
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_images.report_id 
    AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

CREATE POLICY "Users can insert report images" ON public.report_images
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_images.report_id 
    AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

CREATE POLICY "Users can delete report images" ON public.report_images
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_images.report_id 
    AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

-- 2. Add unique constraints for sequential IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_patient_id_number_unique 
  ON public.patients (clinic_id, patient_id_number) 
  WHERE patient_id_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_report_number_unique 
  ON public.reports (clinic_id, report_number);

-- 3. Create atomic ID generation functions
CREATE OR REPLACE FUNCTION public.generate_patient_id(_clinic_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _last_num int;
  _next_id text;
BEGIN
  _prefix := 'PT-' || to_char(now(), 'YY') || '-';
  
  SELECT COALESCE(
    MAX(
      NULLIF(regexp_replace(patient_id_number, '^' || _prefix, ''), patient_id_number)::int
    ), 0
  ) INTO _last_num
  FROM public.patients
  WHERE clinic_id = _clinic_id
    AND patient_id_number LIKE _prefix || '%';
  
  _next_id := _prefix || lpad((_last_num + 1)::text, 4, '0');
  RETURN _next_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_report_number(_clinic_id uuid, _type_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _last_num int;
  _next_id text;
BEGIN
  _prefix := _type_code || '-' || to_char(now(), 'MM') || '-';
  
  SELECT COALESCE(
    MAX(
      NULLIF(regexp_replace(report_number, '^' || _prefix, ''), report_number)::int
    ), 0
  ) INTO _last_num
  FROM public.reports
  WHERE clinic_id = _clinic_id
    AND report_number LIKE _prefix || '%';
  
  _next_id := _prefix || lpad((_last_num + 1)::text, 3, '0');
  RETURN _next_id;
END;
$$;
