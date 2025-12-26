-- Allow authenticated users to insert clinics (needed for registration)
CREATE POLICY "Authenticated users can create clinics" 
ON public.clinics 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to insert their own user_roles
CREATE POLICY "Users can insert their own role during registration" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());