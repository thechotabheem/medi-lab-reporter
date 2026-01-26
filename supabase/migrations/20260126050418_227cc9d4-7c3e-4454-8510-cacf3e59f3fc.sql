-- Create default clinic if it doesn't exist
INSERT INTO public.clinics (id, name, address, phone, email, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Medical Lab',
  'Your Clinic Address',
  '+1 234 567 8900',
  'lab@example.com',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Drop old restrictive policies for patients
DROP POLICY IF EXISTS "Users can view patients in their clinic" ON patients;
DROP POLICY IF EXISTS "Users can insert patients in their clinic" ON patients;
DROP POLICY IF EXISTS "Users can update patients in their clinic" ON patients;
DROP POLICY IF EXISTS "Users can delete patients in their clinic" ON patients;

-- Create open access policies for patients
CREATE POLICY "Anyone can view patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Anyone can insert patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update patients" ON patients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete patients" ON patients FOR DELETE USING (true);

-- Drop old restrictive policies for reports
DROP POLICY IF EXISTS "Users can view reports in their clinic" ON reports;
DROP POLICY IF EXISTS "Users can insert reports in their clinic" ON reports;
DROP POLICY IF EXISTS "Users can update reports in their clinic" ON reports;
DROP POLICY IF EXISTS "Users can delete reports in their clinic" ON reports;

-- Create open access policies for reports
CREATE POLICY "Anyone can view reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reports" ON reports FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete reports" ON reports FOR DELETE USING (true);

-- Drop old restrictive policies for report_images
DROP POLICY IF EXISTS "Users can view report images in their clinic" ON report_images;
DROP POLICY IF EXISTS "Users can insert report images in their clinic" ON report_images;
DROP POLICY IF EXISTS "Users can delete report images in their clinic" ON report_images;

-- Create open access policies for report_images
CREATE POLICY "Anyone can view report images" ON report_images FOR SELECT USING (true);
CREATE POLICY "Anyone can insert report images" ON report_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete report images" ON report_images FOR DELETE USING (true);

-- Drop old restrictive policies for clinics
DROP POLICY IF EXISTS "Users can view their own clinic" ON clinics;
DROP POLICY IF EXISTS "Creators can view their own clinic" ON clinics;
DROP POLICY IF EXISTS "Admins can update their clinic" ON clinics;
DROP POLICY IF EXISTS "Users can create clinics with their user id" ON clinics;

-- Create open access policies for clinics
CREATE POLICY "Anyone can view clinics" ON clinics FOR SELECT USING (true);
CREATE POLICY "Anyone can update clinics" ON clinics FOR UPDATE USING (true);