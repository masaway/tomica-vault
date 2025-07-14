-- Phase 1: Basic Authentication Foundation
-- Based on authentication and user management design document
-- This implements the core authentication tables and relationships

-- ================================
-- 1. PROFILES TABLE
-- ================================

CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Profiles table indexes
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- ================================
-- 2. USER_TOMICA_OWNERSHIP TABLE
-- ================================

CREATE TABLE public.user_tomica_ownership (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tomica_id INTEGER NOT NULL REFERENCES public.owned_tomica(id) ON DELETE CASCADE,
  family_id UUID DEFAULT NULL, -- Reserved for Phase 2 family features
  is_shared_with_family BOOLEAN DEFAULT false, -- Reserved for Phase 2
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tomica_id)
);

-- User_tomica_ownership table indexes
CREATE INDEX idx_ownership_user_id ON public.user_tomica_ownership(user_id);
CREATE INDEX idx_ownership_tomica_id ON public.user_tomica_ownership(tomica_id);
CREATE INDEX idx_ownership_family_id ON public.user_tomica_ownership(family_id);
CREATE INDEX idx_ownership_is_shared ON public.user_tomica_ownership(is_shared_with_family);

-- ================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on user_tomica_ownership table
ALTER TABLE public.user_tomica_ownership ENABLE ROW LEVEL SECURITY;

-- User_tomica_ownership RLS policies
CREATE POLICY "Users can view their ownerships" ON public.user_tomica_ownership
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their ownerships" ON public.user_tomica_ownership
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their ownerships" ON public.user_tomica_ownership
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their ownerships" ON public.user_tomica_ownership
  FOR DELETE USING (user_id = auth.uid());

-- Enable RLS on owned_tomica table
ALTER TABLE public.owned_tomica ENABLE ROW LEVEL SECURITY;

-- Owned_tomica RLS policies (access through ownership table)
CREATE POLICY "Users can access owned tomica" ON public.owned_tomica
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_tomica_ownership 
      WHERE tomica_id = owned_tomica.id 
      AND user_id = auth.uid()
    )
  );

-- ================================
-- 4. AUTOMATION TRIGGERS
-- ================================

-- Function: Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User' || substring(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

-- Trigger: Create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: Update updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger: Update updated_at on user_tomica_ownership
CREATE TRIGGER ownership_updated_at
  BEFORE UPDATE ON public.user_tomica_ownership
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE public.profiles IS 'User profile information (Phase 1: Basic Auth)';
COMMENT ON TABLE public.user_tomica_ownership IS 'User-Tomica ownership relationships (Phase 1: Individual ownership, Phase 2: Family sharing)';

COMMENT ON COLUMN public.user_tomica_ownership.family_id IS 'Reserved for Phase 2: Family group sharing feature';
COMMENT ON COLUMN public.user_tomica_ownership.is_shared_with_family IS 'Reserved for Phase 2: Family sharing flag';

-- Note: This migration implements Phase 1 of the authentication system
-- Phase 2 will add family tables (families, family_members) and extend sharing capabilities