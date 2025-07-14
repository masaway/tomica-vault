-- Rollback incorrect authentication changes
-- This migration removes the previously added user_id column and RLS policies
-- to prepare for the correct implementation based on design document

-- Step 1: Drop RLS policies (if they exist)
DROP POLICY IF EXISTS "Users can view own tomica" ON public.owned_tomica;
DROP POLICY IF EXISTS "Users can insert own tomica" ON public.owned_tomica;
DROP POLICY IF EXISTS "Users can update own tomica" ON public.owned_tomica;
DROP POLICY IF EXISTS "Users can delete own tomica" ON public.owned_tomica;

-- Step 2: Disable RLS (if enabled)
ALTER TABLE public.owned_tomica DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop index (if exists)
DROP INDEX IF EXISTS owned_tomica_user_id_idx;

-- Step 4: Drop user_id column (if exists)
ALTER TABLE public.owned_tomica DROP COLUMN IF EXISTS user_id;

-- Note: This prepares the database for the correct implementation
-- based on the design document with profiles and user_tomica_ownership tables