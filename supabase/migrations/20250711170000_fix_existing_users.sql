-- Fix existing users who registered before trigger implementation
-- This migration creates profiles for users who don't have them

-- Create profiles for existing users without profiles
INSERT INTO public.profiles (id, display_name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', 'User' || substring(u.id::text, 1, 8)) as display_name,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Log the number of profiles created
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE NOTICE 'Total profiles after migration: %', profile_count;
END $$;