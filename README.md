# HPO Sobilaznica

Web app za praćenje posjeta vrhovima Hrvatske planinarske obilaznice (HPO) unutar grupe prijatelja.

> Track which of the 153 HPO peaks your friend group has visited, plan next trips, and share photos from the summits.

## Features

- **Interactive map** — all 153 HPO peaks on a map of Croatia
- **Per-person filters** — see which peaks each friend has visited
- **Unvisited highlight** — instantly see peaks no one has climbed yet
- **Visit log** — mark peaks as visited with date, note, and photos
- **Progress leaderboard** — who's closest to the full 153?
- **Bilingual** — Croatian and English UI

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — PostgreSQL database, magic-link auth, photo storage
- **Leaflet.js** — interactive map with OpenStreetMap tiles
- **Tailwind CSS v4** — styling
- **Vercel** — hosting (auto-deploy from GitHub)

## Local Development

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hpo-sobilaznica.git
   cd hpo-sobilaznica
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Run the database migrations in Supabase SQL Editor:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run in Supabase -> SQL Editor

5. Seed the peaks data:
   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your GitHub repo
3. Add environment variables from `.env.local` in Vercel project settings
4. Deploy — Vercel auto-deploys on every push to `main`

## HPO Data

The 153 peak coordinates in `supabase/seed/peaks.json` are compiled from public sources. Coordinates should be verified against the official HPS map at hps.hr/karta before relying on them for navigation.

## Contributing

This is a private project for a friend group. To add yourself: register via the app using your email — no invite needed.
