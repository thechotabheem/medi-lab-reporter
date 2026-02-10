-- Allow deleting profiles (needed for admin to delete staff accounts)
CREATE POLICY "Admin can delete profiles via edge function"
ON public.profiles
FOR DELETE
USING (true);