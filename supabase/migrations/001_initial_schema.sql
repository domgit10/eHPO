-- HPO Sobilaznica — Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS peaks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hpo_number  integer UNIQUE NOT NULL,
  name_hr     text NOT NULL,
  name_en     text,
  latitude    float8 NOT NULL,
  longitude   float8 NOT NULL,
  elevation_m integer,
  section_hr  text,
  section_en  text,
  difficulty  text CHECK (difficulty IN ('easy', 'moderate', 'demanding')),
  description_hr text,
  description_en text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Planinar',
  avatar_url   text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  peak_id     uuid NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  visited_at  date NOT NULL,
  note        text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, peak_id)
);

CREATE TABLE IF NOT EXISTS visit_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id     uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption      text,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- TRIGGER: auto-create profile on first sign-in
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE peaks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_photos  ENABLE ROW LEVEL SECURITY;

-- peaks: public read, no user writes
CREATE POLICY "peaks_public_read" ON peaks
  FOR SELECT TO anon, authenticated USING (true);

-- profiles: public read, owner update
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- visits: public read, owner write
CREATE POLICY "visits_public_read" ON visits
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "visits_owner_insert" ON visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visits_owner_update" ON visits
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "visits_owner_delete" ON visits
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- visit_photos: public read, owner write (via visit ownership)
CREATE POLICY "visit_photos_public_read" ON visit_photos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "visit_photos_owner_insert" ON visit_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits v
      WHERE v.id = visit_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "visit_photos_owner_delete" ON visit_photos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits v
      WHERE v.id = visit_id AND v.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET: visit-photos
-- Run separately in Storage section or via SQL:
-- ============================================================

-- Create bucket (run this only if bucket doesn't exist yet)
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-photos', 'visit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "visit_photos_public_read_storage" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'visit-photos');

CREATE POLICY "visit_photos_owner_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'visit-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "visit_photos_owner_delete_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'visit-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_peak_id ON visits(peak_id);
CREATE INDEX IF NOT EXISTS idx_visit_photos_visit_id ON visit_photos(visit_id);
CREATE INDEX IF NOT EXISTS idx_peaks_hpo_number ON peaks(hpo_number);
