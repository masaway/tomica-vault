-- Add user authentication support to owned_tomica table
-- Created: 2025-07-11
-- Description: Add user_id column and configure Row Level Security (RLS)

-- Step 1: Add user_id column to owned_tomica table
ALTER TABLE public.owned_tomica 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for user_id (performance improvement)
CREATE INDEX IF NOT EXISTS owned_tomica_user_id_idx ON public.owned_tomica(user_id);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.owned_tomica ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies

-- Users can view only their own tomica
CREATE POLICY "Users can view own tomica" ON public.owned_tomica
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert only their own tomica
CREATE POLICY "Users can insert own tomica" ON public.owned_tomica
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update only their own tomica
CREATE POLICY "Users can update own tomica" ON public.owned_tomica
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own tomica
CREATE POLICY "Users can delete own tomica" ON public.owned_tomica
    FOR DELETE USING (auth.uid() = user_id);

-- Notes:
-- 1. Existing data will have user_id as NULL - handle manually after migration
-- 2. To make user_id NOT NULL, run separate migration after setting user_id for all existing data
-- 3. This migration keeps user_id as NULLABLE to preserve existing data