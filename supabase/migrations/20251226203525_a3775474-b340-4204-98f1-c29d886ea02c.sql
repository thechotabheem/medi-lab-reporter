-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'lab_technician', 'receptionist');

-- Create report_type enum
CREATE TYPE public.report_type AS ENUM ('blood_test', 'urine_analysis', 'hormone_immunology', 'microbiology', 'ultrasound');

-- Create gender enum
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- Clinics table
CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    header_text TEXT,
    footer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'lab_technician',
    UNIQUE (user_id, role)
);

-- Patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id_number TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender gender NOT NULL,
    date_of_birth DATE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_type report_type NOT NULL,
    report_number TEXT NOT NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    referring_doctor TEXT,
    clinical_notes TEXT,
    status TEXT DEFAULT 'draft' NOT NULL,
    report_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Report images table
CREATE TABLE public.report_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_images ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user's clinic
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT clinic_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Clinics policies (users can only view their own clinic)
CREATE POLICY "Users can view their own clinic" ON public.clinics
    FOR SELECT USING (id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic" ON public.clinics
    FOR UPDATE USING (id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view profiles in their clinic" ON public.profiles
    FOR SELECT USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Patients policies (clinic-scoped)
CREATE POLICY "Users can view patients in their clinic" ON public.patients
    FOR SELECT USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patients in their clinic" ON public.patients
    FOR INSERT WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patients in their clinic" ON public.patients
    FOR UPDATE USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete patients in their clinic" ON public.patients
    FOR DELETE USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Reports policies (clinic-scoped)
CREATE POLICY "Users can view reports in their clinic" ON public.reports
    FOR SELECT USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert reports in their clinic" ON public.reports
    FOR INSERT WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update reports in their clinic" ON public.reports
    FOR UPDATE USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete reports in their clinic" ON public.reports
    FOR DELETE USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Report images policies
CREATE POLICY "Users can view report images in their clinic" ON public.report_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_id AND r.clinic_id = public.get_user_clinic_id(auth.uid())
        )
    );

CREATE POLICY "Users can insert report images in their clinic" ON public.report_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_id AND r.clinic_id = public.get_user_clinic_id(auth.uid())
        )
    );

CREATE POLICY "Users can delete report images in their clinic" ON public.report_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.reports r 
            WHERE r.id = report_id AND r.clinic_id = public.get_user_clinic_id(auth.uid())
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for report images
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);

-- Storage policies
CREATE POLICY "Users can view report images" ON storage.objects
    FOR SELECT USING (bucket_id = 'report-images');

CREATE POLICY "Authenticated users can upload report images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their report images" ON storage.objects
    FOR DELETE USING (bucket_id = 'report-images' AND auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_reports_clinic ON public.reports(clinic_id);
CREATE INDEX idx_reports_patient ON public.reports(patient_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_profiles_clinic ON public.profiles(clinic_id);