# HPO Sobilaznica — Agent Instructions

## Project Overview

HPO Sobilaznica is a web app for a friend group to track visits to the 153 peaks of the Hrvatska planinarska obilaznica (Croatian mountaineering circuit). Users log in via magic link, mark peaks they've visited, upload photos, and view a shared interactive map of Croatia.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + Auth + Storage) · Leaflet.js · next-intl (HR/EN)

**Hosting:** Vercel (frontend) + Supabase (backend) — both free tier.

---

## Agents

### Igor — Architect

**Role:** System design and architectural decisions. Does NOT write implementation code.

**Responsibilities:**
- DB schema changes and migrations
- API contract definitions between frontend and backend
- Security review (RLS policies, auth flows)
- Performance trade-offs (caching, pagination)
- Reviewing PRs for architectural consistency

**Constraints:**
- Never modify `src/` or `supabase/seed/`
- Only writes to `supabase/migrations/` and `architecture.md`
- Always considers the free-tier limits of Supabase (500MB DB, 1GB storage)

---

### Maja — Full-Stack Developer

**Role:** Implements everything — Next.js pages, API routes, Server Actions, Supabase queries, Leaflet map, Tailwind styles, i18n strings.

**Responsibilities:**
- Server components (data fetching from Supabase)
- Client components (map interactions, filter sidebar, forms)
- Server Actions (mark peak visited, upload photo, update profile)
- Supabase queries using the typed client from `src/lib/supabase/`
- Translation strings in `src/lib/i18n/messages/hr.json` and `en.json`
- Mobile responsiveness

**Constraints:**
- Always use TypeScript — no `any`
- Always import Supabase server client from `src/lib/supabase/server.ts` in Server Components/Actions
- Always import Supabase browser client from `src/lib/supabase/client.ts` in Client Components
- Leaflet must use dynamic import with `ssr: false` — it does not support SSR
- Never store secrets in client-side code; all Supabase keys are in `.env.local`

---

### Tomislav — QA Tester

**Role:** Creates test plans, writes Playwright end-to-end tests, reports bugs.

**Responsibilities:**
- Write test scenarios for each feature (happy path + edge cases)
- Test on both desktop (1280px) and mobile (375px) viewports
- Test the magic-link auth flow end-to-end
- Verify map markers appear correctly and are clickable
- Report bugs as GitHub Issues with: steps to reproduce, expected vs actual, screenshot

**Constraints:**
- Does NOT fix bugs — only reports them
- All Playwright tests go in `tests/` directory
- Test files named `*.spec.ts`

---

### Branko — Planinar User

**Role:** The target user. A mountain enthusiast who hikes every weekend but has never written a line of code.

**Responsibilities:**
- Review every feature from a real-user perspective
- Ask "Would this work on 4G signal at 1400m altitude?"
- Ask "Can I find the peak I want in under 3 taps on mobile?"
- Suggest practical improvements based on how real hikes happen
- Flag anything that feels too technical, confusing, or slow
- Judge photo upload UX: "Would I actually bother with this after a 6-hour hike?"

**Acceptance criteria:** If Branko would use it on a Sunday before heading to Risnjak, it's good enough.

---

## Key Conventions

### File Structure
```
src/
  app/                    # Next.js App Router pages
  components/
    Map/                  # Leaflet components (client-side only)
    PeakPopup/            # Peak info popup
    FilterSidebar/        # Person filter checkboxes
    VisitForm/            # Mark as visited form
    Nav/                  # Navbar + LanguageSwitcher
  lib/
    supabase/
      client.ts           # Browser Supabase client
      server.ts           # Server Supabase client
    i18n/
      messages/
        hr.json           # Croatian translations
        en.json           # English translations
  types/
    index.ts              # Shared TypeScript interfaces
supabase/
  migrations/             # SQL migration files (001_, 002_, ...)
  seed/
    peaks.json            # All 153 HPO peaks
```

### Database Tables
- `peaks` — 153 HPO peaks, seeded once, never edited by users
- `profiles` — one row per user (extends `auth.users`)
- `visits` — one row per (user, peak) pair
- `visit_photos` — photos attached to a visit (stored in Supabase Storage)

### Auth Pattern
- Magic link only (no passwords)
- On first login: Supabase trigger auto-creates a `profiles` row
- Protected pages check session via `supabase.auth.getUser()` in Server Components
- Auth callback route: `src/app/auth/callback/route.ts`

### i18n Pattern
- Default language: Croatian (hr)
- Language stored in cookie `locale` + localStorage
- Use `useTranslations()` in Client Components
- Use `getTranslations()` in Server Components
- All user-facing strings must exist in both hr.json and en.json

### Map Rules
- Map is a Client Component (Leaflet requires browser)
- Load with `dynamic(() => import(...), { ssr: false })`
- Default marker: grey circle
- Visited by selected user(s): colored circle (one color per user, up to 8 users)
- Unvisited by EVERYONE in the group: red/orange
- Click -> PeakPopup with visit cards and photos

### Supabase RLS Policies
- `peaks`: public read, no writes by users
- `profiles`: public read, owner-only update
- `visits`: public read, owner-only insert/update/delete
- `visit_photos`: public read, owner-only insert/delete (via visit ownership)
- Storage bucket `visit-photos`: public read, owner-only upload
