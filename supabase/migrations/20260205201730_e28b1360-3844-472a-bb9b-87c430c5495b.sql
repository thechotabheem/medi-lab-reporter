-- Add new branding columns to clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS show_logo_on_all_pages BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS signature_title_left TEXT DEFAULT 'Lab Technician';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS signature_title_right TEXT DEFAULT 'Pathologist';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS page_size TEXT DEFAULT 'a4';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS show_abnormal_summary BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS show_patient_id BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS border_style TEXT DEFAULT 'simple';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS contact_display_format TEXT DEFAULT 'inline';