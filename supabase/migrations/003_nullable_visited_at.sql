-- Allow visits to be logged without a known date
ALTER TABLE visits ALTER COLUMN visited_at DROP NOT NULL;
