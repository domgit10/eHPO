# HPO Sobilaznica — Architecture

## System Overview

```
Browser
  |
  +-- Vercel CDN (Next.js app)
        |
        +-- Server Components (SSR data fetch)  ----+
        |                                            |
        +-- Server Actions (mutations)         ------+-- Supabase
        |                                            |     +-- PostgreSQL (DB)
        +-- Client Components (Leaflet map)    ------+     +-- Auth (magic link)
                                                           +-- Storage (photos)
```

All compute is serverless. No persistent server to manage.

---

## Technology Choices

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | Full-stack in one deploy; Server Actions for mutations |
| Database | Supabase (PostgreSQL) | Free tier, built-in auth, storage, RLS |
| Auth | Supabase magic link | No password required; email only |
| Map | Leaflet + react-leaflet | Free tiles (OpenStreetMap), no API key |
| Hosting | Vercel | Auto-deploys from GitHub, free for hobby |
| Styling | Tailwind CSS v4 | Utility-first, responsive by default |
| i18n | next-intl | Lightweight, App Router support |
| Language | TypeScript | Type safety for DB rows and props |

---

## Database Schema

### `peaks` (seeded, read-only for users)
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
hpo_number  integer UNIQUE NOT NULL        -- official HPO number 1-153
name_hr     text NOT NULL                  -- Croatian name
name_en     text                           -- English name (may be same as Croatian)
latitude    float8 NOT NULL
longitude   float8 NOT NULL
elevation_m integer
section_hr  text                           -- one of 20 geographic sections
section_en  text
difficulty  text CHECK (difficulty IN ('easy','moderate','demanding'))
description_hr text
description_en text
```

### `profiles` (one per auth user)
```sql
id           uuid PRIMARY KEY REFERENCES auth.users
display_name text NOT NULL
avatar_url   text
created_at   timestamptz DEFAULT now()
```

### `visits` (one per user+peak combination)
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
peak_id     uuid NOT NULL REFERENCES peaks(id)
visited_at  date NOT NULL
note        text
created_at  timestamptz DEFAULT now()
UNIQUE(user_id, peak_id)
```

### `visit_photos`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
visit_id     uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE
storage_path text NOT NULL               -- path in Supabase Storage bucket
caption      text
created_at   timestamptz DEFAULT now()
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies:

**peaks**
- `SELECT`: anon + authenticated — everyone can read

**profiles**
- `SELECT`: anon + authenticated — everyone can read
- `UPDATE`: authenticated, `auth.uid() = id` — only own profile

**visits**
- `SELECT`: anon + authenticated — everyone can read
- `INSERT`: authenticated, `auth.uid() = user_id`
- `UPDATE`: authenticated, `auth.uid() = user_id`
- `DELETE`: authenticated, `auth.uid() = user_id`

**visit_photos**
- `SELECT`: anon + authenticated — everyone can read
- `INSERT`: authenticated, visit must belong to `auth.uid()`
- `DELETE`: authenticated, visit must belong to `auth.uid()`

**Storage bucket `visit-photos`**
- Public read (photos are publicly viewable via URL)
- Upload: authenticated, path must start with `auth.uid()/`

---

## Auth Flow

```
1. User enters email on /login
2. Supabase sends magic link email
3. User clicks link -> redirected to /auth/callback?code=...
4. /auth/callback exchanges code for session (PKCE flow)
5. Session stored in cookies via @supabase/ssr
6. Redirect to / (map)
7. If new user: database trigger auto-creates profiles row
```

The PKCE auth callback route is at `src/app/auth/callback/route.ts`.

---

## Data Flow — Map Page

```
Server Component (page.tsx)
  |-- fetch all peaks from Supabase (server client)
  |-- fetch all profiles (user list for filter)
  |-- fetch all visits (public data)
  |-- pass as props to MapWrapper (client)
        |
        Client Component (MapView.tsx)
          |-- renders Leaflet map
          |-- receives: peaks[], profiles[], visits[], currentUserId?
          |-- state: selectedUserIds[] (filter)
          |-- computes: visitedPeakIds per user
          |-- renders markers with color logic
          |-- on marker click: opens PeakPopup
```

---

## Visit Creation Flow

```
User clicks peak marker
  -> PeakPopup opens
  -> If logged in + not yet visited: "Mark as visited" button
  -> VisitForm opens (date, note, photos)
  -> On submit: Server Action
        |-- createVisit(peakId, date, note)
        |-- uploadPhotos(visitId, files[])
        |-- revalidatePath('/')
  -> Map updates (server re-render)
```

---

## Environment Variables

Required in `.env.local` (never committed):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...    # only for seed script, never exposed to browser
```

---

## Deployment Pipeline

```
git push origin main
  -> GitHub receives push
  -> Vercel detects push (webhook)
  -> Vercel builds Next.js app
  -> Vercel deploys to global CDN
  -> Live at hpo-sobilaznica.vercel.app in ~60 seconds
```

Supabase is independent — it runs continuously, unaffected by deployments.

---

## Free Tier Limits (Supabase)

| Resource | Free Limit | Expected Usage |
|---|---|---|
| Database | 500 MB | ~1 MB for 153 peaks + 20 users + 3000 visits |
| Storage | 1 GB | ~500 MB for photos (avg 500KB × 1000 photos) |
| Auth | 50,000 users | Well within limit |
| API requests | 2M/month | ~10K/month for a friend group |

**Conclusion:** The free tier is sufficient indefinitely for this use case.

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-08 | Magic link auth, no passwords | Simpler UX, user request |
| 2026-06-08 | Open registration (no invite system) | Easier onboarding, user request |
| 2026-06-08 | Both HR and EN language | Language switcher requested |
| 2026-06-08 | Leaflet + OSM tiles (not Mapbox) | Free, no API key needed |
| 2026-06-08 | next-intl without routing middleware | Simpler setup, no URL locale prefix |
| 2026-06-08 | One visit per (user, peak) | Simplest data model, matches real HPO |
