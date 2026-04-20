@~/.claude/CLAUDE.md

# Petvity — Project Standards

**What this is:** Global pet care platform where owners manage multi-species pet profiles,
track physical and emotional health KPIs, connect with vets/sitters (Phase 2), access a
marketplace (Phase 3), and list pets for cross-border adoption (Phase 4). Pets can have
public "influencer profiles." Long-term vision: digital twins (IoT sensors, cameras, emotional state).
Part of the same ecosystem as VitaReBa and Surf Your Life.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Neon PostgreSQL ·
Drizzle ORM · NextAuth 5 · Resend email · Vercel Blob (pet photos) · next-intl
(9 languages: EN DE FR ES JA ZH KO TR AR — AR is RTL) · Recharts · Zod · Vercel

---

## Architecture

```
proxy.ts               → Auth guard (/portal /admin /api) + locale routing (marketing)

app/
  (auth)/              → Non-localized auth: /login /register /forgot-password /reset-password
  (portal)/            → Auth-guarded portal (all routes under /portal/)
    dashboard/         → Pet overview + wellness signals
    pets/              → Pet list + CRUD + health tracking
    checkin/           → Daily multi-pet check-in
    settings/          → Account settings
  (admin)/admin/       → Admin area (role=admin only)
  [locale]/            → Localized marketing site (en/de/fr/es/ja/zh/ko/tr/ar)
    (marketing)/       → features, about, pricing, species guides
    (public)/pets/[handle]/ → Public influencer pet profile (no auth)
  api/
    auth/              → NextAuth + password reset
    account/           → Registration
    pets/              → Pet CRUD + avatar upload
    health/metrics/    → Daily KPI log (upsert — one row per pet per day)
    health/records/    → Vet visits, procedures
    vaccinations/      → Vaccination schedule
    medications/       → Active/past medications
    public/pets/[handle]/ → Public pet data (no auth, isPublic=true only)
    admin/             → Admin-only endpoints
    cron/              → Scheduled jobs (Bearer CRON_SECRET)

lib/
  db/schema.ts         → SSOT: all Drizzle table definitions
  db/index.ts          → Lazy Neon singleton
  auth/                → NextAuth config, edge config, guards, types
  config/              → All SSOT constants (NEVER define config in components)
  domain/              → Business logic (no HTTP, no UI — pure, testable)
  email/               → Resend + templates
  utils/format.ts      → formatDateShort, formatWeight, formatTemperature
```

---

## SSOT — Where Each Thing Lives

| What | Where | NEVER in |
|------|-------|---------|
| Species, breeds, icons, lifespan | `lib/config/species.ts` | DB table, component |
| Health KPI defs, units, normal ranges | `lib/config/health-metrics.ts` | Component |
| Pet wellness signal thresholds | `lib/config/pet-signal.ts` | Cron route |
| Locales, RTL flag | `lib/config/locales.ts` | next-intl config |
| App name, emails, URL | `lib/config/app.ts` | Component |
| Auth guards | `lib/auth/guards.ts` | Page component |
| Signal computation | `lib/domain/pet-signal.ts` | API route |
| Weight storage | Integer grams | Float kg anywhere |
| Temperature storage | Integer centidegrees | Float °C anywhere |

**2-file test:** Adding a species = `lib/config/species.ts` + schema migration (enum).
Adding a health metric = `lib/config/health-metrics.ts` + schema column. More than 2 files → architecture is wrong.

---

## Middleware Routing (`proxy.ts`)

```
PORTAL_PREFIXES: /portal, /admin, /api
  → Auth-guard only, no locale routing
  → Unauthenticated → /login?returnTo=...
  → Non-admin at /admin → /portal/dashboard

Everything else → next-intl locale routing
```

**CRITICAL:** All portal routes must be under `/portal/` (single prefix). Do NOT add
individual route paths to PORTAL_PREFIXES.

---

## Database Schema (Phase 1)

**Enums:** `user_role` (pet_owner|veterinarian|pet_sitter|admin), `species`, `sex`,
`health_record_type`, `vaccination_status`, `medication_status`, `email_queue_status`

**Tables:** users, accounts, sessions, verificationTokens (NextAuth),
ownerProfiles, pets, healthMetrics (UNIQUE petId+date), healthRecords,
vaccinations, medications, emailQueue

**Numeric storage:**
- Weight: integer grams (3500 = 3.5 kg). Display: ÷ 1000
- Temperature: integer centidegrees (3850 = 38.50°C). Display: ÷ 100
- Emotional metrics: integer 1–5, no conversion

**Phase 2+:** vetProfiles, sitterProfiles, bookings, reviews
**Phase 3+:** products, orders, orderItems
**Phase 4+:** adoptionListings, adoptionApplications, digitalTwins

---

## Pet Wellness Signal

`lib/domain/pet-signal.ts` → `computePetSignal()` — pure function, unit tested.

| Signal | Condition |
|--------|-----------|
| `healthy` | All logged metrics within species-specific normal ranges |
| `watch` | ≥1 out-of-range metric, OR no log in 7 days, OR vaccination due soon |
| `concern` | ≥2 out-of-range metrics, OR overdue vaccination (escalates watch→concern) |

Species-specific normal ranges live in `lib/config/health-metrics.ts` → `normalRange[species]`.

---

## RTL Support (Arabic)

- `app/[locale]/layout.tsx` injects `dir="rtl"` for Arabic
- Use `ms-*` / `me-*` Tailwind classes (margin-start/end), NOT `ml-*` / `mr-*`
- RTL locales SSOT: `lib/config/locales.ts` → `RTL_LOCALES`

---

## Cron Jobs

All `/api/cron/*` routes require `Authorization: Bearer CRON_SECRET`.

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/emails` | `0 7 * * *` | Process welcome email queue |
| `/api/cron/health-alerts` | `0 8 * * *` | Flag out-of-range metrics, email owners |
| `/api/cron/vaccination-reminders` | `0 9 * * *` | Remind about vaccines due in 30 days |

---

## Commands

```bash
pnpm dev          # local dev (localhost:3000)
pnpm build        # production build — run before every push
pnpm lint         # eslint
pnpm db:push      # push schema to Neon
pnpm db:generate  # generate migration files
pnpm db:studio    # Drizzle Studio
pnpm test         # run unit tests (vitest)
```

**Before every push:** `pnpm build` must pass. Never rely on Vercel to catch TypeScript errors.

---

## Red Flags

- Species or breed hardcoded in a component → `lib/config/species.ts`
- Health metric unit or range hardcoded → `lib/config/health-metrics.ts`
- `ml-*` / `mr-*` Tailwind classes (not RTL-safe) → use `ms-*` / `me-*`
- New portal route not under `/portal/` → breaks middleware, unauthenticated users get 404
- Signal threshold in a cron route → `lib/config/pet-signal.ts`
- Email template inline in an API route → `lib/email/templates.ts`
- Weight stored as float → always integer grams
- Temperature stored as float → always integer centidegrees
- `computePetSignal` logic changed without updating `lib/domain/pet-signal.test.ts`
