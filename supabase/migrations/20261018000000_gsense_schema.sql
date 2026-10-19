-- ==============================================================================
-- G-SENSE Database Schema & Row-Level Security (RLS) Migrations
-- Migration: 20261018000000_gsense_schema.sql
-- Description: Core tables for G-SENSE AdaptiveAssistant
--   - profiles
--   - user_preferences
--   - interaction_events (privacy-first interaction features, no raw text/keys)
--   - learning_summaries
--   - assistance_feedback
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  learning_status TEXT DEFAULT 'active' CHECK (learning_status IN ('active', 'paused', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistance_level TEXT DEFAULT 'balanced' CHECK (assistance_level IN ('step_by_step', 'hints_only', 'minimal')),
  interaction_pace TEXT DEFAULT 'standard' CHECK (interaction_pace IN ('relaxed', 'standard', 'fast')),
  hesitation_threshold_ms INTEGER DEFAULT 8000 CHECK (hesitation_threshold_ms BETWEEN 1000 AND 30000),
  repeat_attempts_trigger INTEGER DEFAULT 3 CHECK (repeat_attempts_trigger BETWEEN 2 AND 10),
  camera_sensing_enabled BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Interaction Events Table
-- STRICT PRIVACY POLICY: Never store passwords, raw keystrokes, personal messages, or clipboard data.
-- Only anonymized interaction features (navigation hops, attempts count, hesitation intervals, correction flags).
CREATE TABLE IF NOT EXISTS public.interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('navigation', 'repeat_attempt', 'hesitation_pause', 'correction', 'action_success', 'assistance_trigger', 'idle_pause', 'backtrack')),
  component_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  hesitation_ms INTEGER DEFAULT 0,
  is_correction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interaction events"
  ON public.interaction_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interaction events"
  ON public.interaction_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interaction events"
  ON public.interaction_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_interaction_events_user_time
  ON public.interaction_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interaction_events_session
  ON public.interaction_events (session_id);

-- 4. Learning Summaries Table
CREATE TABLE IF NOT EXISTS public.learning_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  total_events_analyzed INTEGER DEFAULT 0,
  avg_hesitation_ms NUMERIC(10, 2) DEFAULT 0,
  correction_rate NUMERIC(5, 4) DEFAULT 0,
  repeat_attempt_rate NUMERIC(5, 4) DEFAULT 0,
  confidence_score NUMERIC(5, 4) DEFAULT 0,
  recommended_assistance_level TEXT CHECK (recommended_assistance_level IN ('step_by_step', 'hints_only', 'minimal'))
);

ALTER TABLE public.learning_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning summaries"
  ON public.learning_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning summaries"
  ON public.learning_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning summaries"
  ON public.learning_summaries FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_summaries_user_time
  ON public.learning_summaries (user_id, computed_at DESC);

-- 5. Assistance Feedback Table
CREATE TABLE IF NOT EXISTS public.assistance_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  was_helpful BOOLEAN NOT NULL,
  user_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.assistance_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assistance feedback"
  ON public.assistance_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assistance feedback"
  ON public.assistance_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assistance feedback"
  ON public.assistance_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Trigger to automatically provision profile & preferences on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
