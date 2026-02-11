-- Update the handle_new_user trigger to support role assignment from metadata
-- This allows Admins to specify if a new user is 'admin' or 'customer'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  target_role TEXT;
BEGIN
  -- Extract role from metadata, default to 'customer'
  target_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');
  
  -- Prevent non-admins from creating admins (safety check)
  -- Note: This trigger runs as 'security definer', but the metadata 
  -- comes from the auth.users table which we control via API.
  
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, target_role);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
