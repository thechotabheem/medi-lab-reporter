-- Add created_by column to clinics table
ALTER TABLE public.clinics ADD COLUMN created_by uuid;

-- Drop the existing INSERT policy that allows any authenticated user
DROP POLICY IF EXISTS "Authenticated users can create clinics" ON public.clinics;

-- Create new INSERT policy that requires created_by to match auth.uid()
CREATE POLICY "Users can create clinics with their user id"
ON public.clinics
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Add SELECT policy so creators can read their own just-created clinic
CREATE POLICY "Creators can view their own clinic"
ON public.clinics
FOR SELECT
TO authenticated
USING (created_by = auth.uid());