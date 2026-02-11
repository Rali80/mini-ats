-- Fix Storage RLS policies for 'resumes' bucket
-- Run this in Supabase SQL Editor

-- 1. Ensure policies for the 'resumes' bucket exist
DO $$
BEGIN
    -- Drop existing to avoid conflicts
    DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to resumes" ON storage.objects; -- Just in case
END $$;

-- 2. Policy: Allow any authenticated user to upload (Insert)
CREATE POLICY "Authenticated users can upload resumes" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'resumes');

-- 3. Policy: Allow users to see their own files (Select)
-- The path in JS is user.id/filename, so we check if the path starts with their auth.uid()
CREATE POLICY "Users can view their own resumes" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Policy: Allow admins to see everything (Select)
-- (Optional, but good if you have an admin role)
CREATE POLICY "Admins can view all resumes" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'resumes' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
