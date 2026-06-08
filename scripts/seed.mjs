import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Create a .env.local file and run: node -r dotenv/config scripts/seed.mjs');
  process.exit(1);
}

const supabase = createClient(url, key);

const peaks = JSON.parse(
  readFileSync(join(__dirname, '../supabase/seed/peaks.json'), 'utf8')
);

console.log(`Seeding ${peaks.length} peaks...`);

const { error } = await supabase.from('peaks').upsert(peaks, { onConflict: 'hpo_number' });

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log(`Done! ${peaks.length} peaks inserted/updated.`);
