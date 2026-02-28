
-- Fix clinics RLS: scope UPDATE to admin role only, scope SELECT to user's clinic
DROP POLICY IF EXISTS "Authenticated users can view clinics" ON public.clinics;
DROP POLICY IF EXISTS "Authenticated users can update clinics" ON public.clinics;

CREATE POLICY "Users can view their clinic" ON public.clinics
  FOR SELECT TO authenticated
  USING (id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic" ON public.clinics
  FOR UPDATE TO authenticated
  USING (id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
