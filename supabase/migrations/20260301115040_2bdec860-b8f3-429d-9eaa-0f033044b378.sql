
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinics;
DROP POLICY IF EXISTS "Admins can update their clinic" ON public.clinics;

CREATE POLICY "Users can view their clinic"
  ON public.clinics FOR SELECT TO authenticated
  USING (id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic"
  ON public.clinics FOR UPDATE TO authenticated
  USING (id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
