-- HPO Sobilaznica — Migration 002
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================================
-- Add new columns to visits
-- ============================================================
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS companions text,
  ADD COLUMN IF NOT EXISTS start_point text,
  ADD COLUMN IF NOT EXISTS weather text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- ============================================================
-- Add hiking_club to profiles
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hiking_club text;

-- ============================================================
-- Update trigger: use Google full_name when available
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Planinar'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
