
-- ============================================================
-- FIX: Convert ALL restrictive RLS policies to PERMISSIVE
-- PostgreSQL requires at least one PERMISSIVE policy to grant
-- access. RESTRICTIVE policies only narrow existing access.
-- ============================================================

-- ==================== CLINICS ====================
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;
DROP POLICY IF EXISTS "Admins can update their clinic" ON public.clinics;

CREATE POLICY "Users can view their clinic"
  ON public.clinics FOR SELECT TO authenticated
  USING (id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic"
  ON public.clinics FOR UPDATE TO authenticated
  USING (id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- ==================== PATIENTS ====================
DROP POLICY IF EXISTS "Users can view patients in their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can insert patients in their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can update patients in their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can delete patients in their clinic" ON public.patients;

CREATE POLICY "Users can view patients in their clinic"
  ON public.patients FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patients in their clinic"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patients in their clinic"
  ON public.patients FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete patients in their clinic"
  ON public.patients FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ==================== REPORTS ====================
DROP POLICY IF EXISTS "Users can view reports in their clinic" ON public.reports;
DROP POLICY IF EXISTS "Users can insert reports in their clinic" ON public.reports;
DROP POLICY IF EXISTS "Users can update reports in their clinic" ON public.reports;
DROP POLICY IF EXISTS "Users can delete reports in their clinic" ON public.reports;

CREATE POLICY "Users can view reports in their clinic"
  ON public.reports FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert reports in their clinic"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update reports in their clinic"
  ON public.reports FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete reports in their clinic"
  ON public.reports FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Users can view profiles in their clinic" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profiles via edge function" ON public.profiles;

CREATE POLICY "Users can view profiles in their clinic"
  ON public.profiles FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can delete profiles via edge function"
  ON public.profiles FOR DELETE TO authenticated
  USING (true);

-- ==================== USER_ROLES ====================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role during registration" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role during registration"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==================== CUSTOM_TEMPLATES ====================
DROP POLICY IF EXISTS "Users can view templates in their clinic" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can insert templates in their clinic" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can update templates in their clinic" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can delete templates in their clinic" ON public.custom_templates;

CREATE POLICY "Users can view templates in their clinic"
  ON public.custom_templates FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert templates in their clinic"
  ON public.custom_templates FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update templates in their clinic"
  ON public.custom_templates FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete templates in their clinic"
  ON public.custom_templates FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ==================== SAVED_COMPARISONS ====================
DROP POLICY IF EXISTS "Users can view comparisons in their clinic" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Users can insert comparisons in their clinic" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Users can update comparisons in their clinic" ON public.saved_comparisons;
DROP POLICY IF EXISTS "Users can delete comparisons in their clinic" ON public.saved_comparisons;

CREATE POLICY "Users can view comparisons in their clinic"
  ON public.saved_comparisons FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert comparisons in their clinic"
  ON public.saved_comparisons FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update comparisons in their clinic"
  ON public.saved_comparisons FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete comparisons in their clinic"
  ON public.saved_comparisons FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ==================== REPORT_IMAGES ====================
DROP POLICY IF EXISTS "Users can view report images" ON public.report_images;
DROP POLICY IF EXISTS "Users can insert report images" ON public.report_images;
DROP POLICY IF EXISTS "Users can delete report images" ON public.report_images;

CREATE POLICY "Users can view report images"
  ON public.report_images FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_images.report_id
    AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

CREATE POLICY "Users can insert report images"
  ON public.report_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_images.report_id
    AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

CREATE POLICY "Users can delete report images"
  ON public.report_images FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_images.report_id
    AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

-- ==================== ACTIVITY_LOGS ====================
DROP POLICY IF EXISTS "Users can view activity logs in their clinic" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert activity logs in their clinic" ON public.activity_logs;

CREATE POLICY "Users can view activity logs in their clinic"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert activity logs in their clinic"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));
