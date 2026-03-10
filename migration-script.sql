-- ============================================================
-- MedLab Reporter — Complete Migration Script
-- Run this in your NEW independent Supabase project's SQL Editor
-- ============================================================
-- IMPORTANT: Run this ONCE on a fresh Supabase project.
-- Order matters — enums → functions → tables → triggers → RLS → seed data → storage
-- ============================================================


-- ============================================================
-- 1. CUSTOM ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'lab_technician', 'receptionist');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.report_type AS ENUM (
  'blood_test', 'urine_analysis', 'hormone_immunology', 'microbiology',
  'ultrasound', 'screening_tests', 'blood_group_typing', 'cbc', 'lft',
  'rft', 'lipid_profile', 'esr', 'bsr', 'bsf', 'serum_calcium', 'mp',
  'typhoid', 'hcv', 'hbsag', 'hiv', 'vdrl', 'h_pylori', 'blood_group',
  'ra_factor', 'combined'
);


-- ============================================================
-- 2. HELPER FUNCTIONS (created before tables so triggers/RLS can reference them)
-- ============================================================

-- 2a. Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2b. Get a user's clinic_id from profiles
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 2c. Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2d. Generate sequential patient ID (PT-YY-NNNN)
CREATE OR REPLACE FUNCTION public.generate_patient_id(_clinic_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 2e. Generate sequential report number (TYPE-MM-NNN)
CREATE OR REPLACE FUNCTION public.generate_report_number(_clinic_id uuid, _type_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 2f. Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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


-- ============================================================
-- 3. TABLES
-- ============================================================

-- 3a. Clinics
CREATE TABLE public.clinics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  address         text,
  phone           text,
  email           text,
  logo_url        text,
  header_text     text,
  footer_text     text,
  watermark_text  text,
  accent_color    text DEFAULT '#00968F',
  secondary_color text,
  tagline         text,
  website         text,
  doctor_name     text,
  font_size       text DEFAULT 'medium',
  page_size       text DEFAULT 'a4',
  border_style    text DEFAULT 'simple',
  pdf_style       text DEFAULT 'modern',
  contact_display_format text DEFAULT 'inline',
  signature_title_left   text DEFAULT 'Lab Technician',
  signature_title_right  text DEFAULT 'Pathologist',
  enable_qr_code         boolean DEFAULT false,
  show_logo_on_all_pages boolean DEFAULT true,
  show_abnormal_summary  boolean DEFAULT true,
  show_patient_id        boolean DEFAULT true,
  logo_watermark_enabled boolean DEFAULT false,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 3b. Profiles
CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE,
  clinic_id  uuid NOT NULL REFERENCES public.clinics(id),
  full_name  text NOT NULL,
  email      text NOT NULL,
  phone      text,
  username   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3c. User Roles (separate table — never on profiles)
CREATE TABLE public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role    app_role NOT NULL DEFAULT 'lab_technician',
  UNIQUE (user_id, role)
);

-- 3d. Patients
CREATE TABLE public.patients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid NOT NULL REFERENCES public.clinics(id),
  patient_id_number text,
  full_name         text NOT NULL,
  gender            gender NOT NULL,
  date_of_birth     date NOT NULL,
  phone             text,
  email             text,
  address           text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 3e. Reports
CREATE TABLE public.reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid NOT NULL REFERENCES public.clinics(id),
  patient_id       uuid NOT NULL REFERENCES public.patients(id),
  created_by       uuid,
  report_type      report_type NOT NULL,
  report_number    text NOT NULL,
  test_date        date NOT NULL DEFAULT CURRENT_DATE,
  referring_doctor text,
  clinical_notes   text,
  status           text NOT NULL DEFAULT 'draft',
  report_data      jsonb NOT NULL DEFAULT '{}'::jsonb,
  included_tests   text[],
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 3f. Report Images
CREATE TABLE public.report_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  uuid NOT NULL REFERENCES public.reports(id),
  image_url  text NOT NULL,
  caption    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3g. Custom Templates
CREATE TABLE public.custom_templates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      uuid REFERENCES public.clinics(id),
  base_template  text NOT NULL,
  customizations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 3h. Activity Logs
CREATE TABLE public.activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL REFERENCES public.clinics(id),
  user_id     uuid NOT NULL,
  user_name   text NOT NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  entity_name text,
  details     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3i. Saved Comparisons
CREATE TABLE public.saved_comparisons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.clinics(id),
  patient_id      uuid NOT NULL REFERENCES public.patients(id),
  name            text NOT NULL,
  report_ids      text[] NOT NULL,
  comparison_mode text NOT NULL DEFAULT 'dual',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-update updated_at on relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.custom_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.saved_comparisons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on new auth user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- ---- clinics ----
CREATE POLICY "Users can view their clinic" ON public.clinics
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic" ON public.clinics
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- ---- profiles ----
CREATE POLICY "Users can view profiles in their clinic" ON public.profiles
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.profiles
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can delete profiles via edge function" ON public.profiles
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (true);

-- ---- user_roles ----
CREATE POLICY "Users can view their own roles" ON public.user_roles
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role during registration" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---- patients ----
CREATE POLICY "Users can view patients in their clinic" ON public.patients
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patients in their clinic" ON public.patients
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patients in their clinic" ON public.patients
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete patients in their clinic" ON public.patients
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ---- reports ----
CREATE POLICY "Users can view reports in their clinic" ON public.reports
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert reports in their clinic" ON public.reports
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update reports in their clinic" ON public.reports
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete reports in their clinic" ON public.reports
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ---- report_images ----
CREATE POLICY "Users can view report images" ON public.report_images
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_images.report_id
      AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

CREATE POLICY "Users can insert report images" ON public.report_images
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_images.report_id
      AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

CREATE POLICY "Users can delete report images" ON public.report_images
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_images.report_id
      AND r.clinic_id = get_user_clinic_id(auth.uid())
  ));

-- ---- custom_templates ----
CREATE POLICY "Users can view templates in their clinic" ON public.custom_templates
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert templates in their clinic" ON public.custom_templates
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update templates in their clinic" ON public.custom_templates
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete templates in their clinic" ON public.custom_templates
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

-- ---- activity_logs ----
CREATE POLICY "Users can view activity logs in their clinic" ON public.activity_logs
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert activity logs in their clinic" ON public.activity_logs
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

-- ---- saved_comparisons ----
CREATE POLICY "Users can view comparisons in their clinic" ON public.saved_comparisons
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert comparisons in their clinic" ON public.saved_comparisons
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update comparisons in their clinic" ON public.saved_comparisons
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete comparisons in their clinic" ON public.saved_comparisons
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));


-- ============================================================
-- 7. SEED DATA — Default Clinic Record (CRITICAL)
-- ============================================================
-- The handle_new_user trigger hardcodes this UUID.
-- Without this row, new user signups will FAIL.

INSERT INTO public.clinics (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Clinic')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================
-- Run these in the Supabase SQL Editor or create via Dashboard → Storage

INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow authenticated users to upload/read
CREATE POLICY "Authenticated users can upload clinic logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clinic-logos');

CREATE POLICY "Anyone can view clinic logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'clinic-logos');

CREATE POLICY "Authenticated users can upload report images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-images');

CREATE POLICY "Anyone can view report images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'report-images');

CREATE POLICY "Authenticated users can delete report images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-images');


-- ============================================================
-- 9. REALTIME (optional — enable if you use realtime subscriptions)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;


-- ============================================================
-- DONE! Next steps:
-- ============================================================
-- 1. Create your first admin user via Supabase Auth → Users → Add User
-- 2. Manually insert their admin role:
--      INSERT INTO public.user_roles (user_id, role)
--      VALUES ('<user-uuid-from-step-1>', 'admin');
-- 3. Set edge function secrets in Supabase Dashboard → Settings → Edge Functions:
--      SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_RESET_CODE
-- 4. Deploy edge functions via Supabase CLI:
--      supabase functions deploy manage-staff
--      supabase functions deploy reset-clinic-data
--      supabase functions deploy lookup-username
-- 5. Update your frontend .env:
--      VITE_SUPABASE_URL=https://<project-id>.supabase.co
--      VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
--      VITE_SUPABASE_PROJECT_ID=<project-id>
-- 6. Import your CSV data in order:
--      clinics → profiles → user_roles → patients → reports →
--      report_images → custom_templates → activity_logs → saved_comparisons
