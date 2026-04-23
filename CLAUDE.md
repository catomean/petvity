@~/.claude/CLAUDE.md

## Mission

Petvity gives pet owners a single place to monitor their pet's daily wellness, connect with local vets and sitters, and manage the full care journey — from health logs and vaccinations to marketplace orders and cross-border adoption. Success means any owner can check their pet's signal in seconds, understand why it changed, and take immediate action without leaving the platform.

# Petvity — Project Standards & Agentic Runbook

**What this is:** Global pet care platform. Owners manage multi-species pet profiles, track physical + emotional health KPIs, connect with vets/sitters (Phase 2), access a marketplace (Phase 3), and list pets for cross-border adoption (Phase 4). Pets can have public "influencer profiles." Long-term vision: digital twins (IoT sensors, cameras, emotional state). Part of the same ecosystem as VitaReBa and Surf Your Life.

**Deployed URLs:**
- Production: https://petvity.vercel.app
- GitHub: https://github.com/g-but/petvity
- Vercel team: orangecat
- Neon project: `odd-star-07028207` (region: us-east-1)

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Neon PostgreSQL ·
Drizzle ORM · NextAuth 5 · Resend email · Vercel Blob (pet photos) · next-intl
(9 languages: EN DE FR ES JA ZH KO TR AR — AR is RTL) · Lucide React icons · Recharts · Zod · Vercel

---

## Development Workflow

```bash
pnpm dev          # local dev (localhost:3000)
pnpm build        # production build — MUST pass before every push
pnpm lint         # eslint
pnpm db:push      # push schema changes to Neon (uses .env.local)
pnpm db:generate  # generate migration files
pnpm db:studio    # Drizzle Studio (visual DB explorer)
pnpm test         # vitest unit tests

git push && vercel --prod --scope orangecat --yes   # deploy
```

**Before every push:** `pnpm build` must pass with zero TypeScript errors. Never rely on Vercel to catch TS errors.

**After every deployment:** verify `vercel inspect <url> --scope orangecat` shows `status: Ready`.

---

## Environment Variables

### Set in Vercel production ✓
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string (project odd-star-07028207) |
| `NEXTAUTH_SECRET` | Set |
| `CRON_SECRET` | Set |
| `NEXT_PUBLIC_APP_URL` | https://petvity.vercel.app |

### NOT YET configured (needed for full functionality)
| Variable | Where to get it | Impact if missing |
|----------|----------------|-------------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console | Google OAuth login disabled |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Google OAuth login disabled |
| `RESEND_API_KEY` | resend.com dashboard | Welcome/alert emails silently dropped |
| `RESEND_FROM` | Resend verified domain | Emails use fallback |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob dashboard | Pet avatar upload fails |
| `ADMIN_EMAILS` | Set to owner's email | No admin access |

Set missing vars: `echo "value" | vercel env add VAR_NAME production --scope orangecat`
Then redeploy: `vercel --prod --scope orangecat --yes`

---

## Architecture

```
proxy.ts               → Middleware: auth-guard + locale routing (see routing rules below)

app/
  (auth)/              → NON-LOCALIZED auth pages: /login /register /forgot-password /reset-password
  (portal)/            → Auth-guarded portal (ALL routes must be under /portal/)
    layout.tsx         → Sidebar nav (desktop) + bottom nav (mobile) via SidebarNav client component
    dashboard/         → Pet grid with wellness signals
    pets/              → Pet list + CRUD
      new/             → Add pet form
      [petId]/         → Pet profile (hero header, section cards)
        edit/          → Edit pet + delete (PATCH/DELETE /api/pets/[petId])
        health/        → Metrics chart + history table
          log/         → Daily health log form
        records/       → Vet visit records
        vaccinations/  → Vaccination schedule
    checkin/           → Multi-pet daily check-in shortcut
    settings/          → Account settings (name + password)
    find/              → Browse vets + sitters, book via modal
    bookings/          → User's bookings + review modal
    shop/              → Product catalogue + cart + checkout
    orders/            → User's order history
    adopt/             → Browse adoption listings (public listings, no auth needed to browse)
      [listingId]/     → Listing detail + apply form (auth required to apply)
    adoptions/         → Owner's listings + applications management
    pets/[petId]/
      list-for-adoption/ → Create adoption listing for a pet
    professional-profile/ → Vet/sitter profile editor (role-gated)
  (admin)/admin/       → Admin area (role=admin only)
    users/             → User list + role management
    products/          → Product CRUD + stock management
    orders/            → Fulfillment workflow + revenue stats
    adoptions/         → Adoption listings moderation + status management
  [locale]/            → Localized marketing (en/de/fr/es/ja/zh/ko/tr/ar)
    (marketing)/       → features, about, pricing, species guides
    (public)/pets/[handle]/ → Public influencer pet profile (no auth, isPublic=true only)
    (public)/adopt/    → Public adoption browse (SSR, no auth)
      [listingId]/     → Listing detail + sign-up CTA
    (public)/pros/[userId]/ → Public vet/sitter profile
  api/
    auth/[...nextauth] → NextAuth (ALWAYS public — never auth-guard this)
    account/           → POST: registration, PATCH: update name/password (no auth on POST)
    pets/              → GET list, POST create
    pets/[petId]/      → GET, PATCH, DELETE (owner-scoped)
    pets/[petId]/avatar → POST: upload to Vercel Blob
    health/metrics/[petId] → POST upsert daily health log
    health/records/    → Health records CRUD
    health/records/[recordId] → PATCH/DELETE (owner-scoped)
    vaccinations/      → Vaccination CRUD
    vaccinations/[vaccinationId] → PATCH/DELETE
    medications/       → Medication CRUD
    medications/[medicationId] → PATCH/DELETE
    vets/              → GET public vet list
    vets/me/           → GET/POST/PATCH own vet profile
    sitters/           → GET public sitter list
    sitters/me/        → GET/POST/PATCH own sitter profile
    bookings/          → GET list, POST create
    bookings/[bookingId] → PATCH status, DELETE
    reviews/           → POST (linked to completed booking)
    products/          → GET public list (active only)
    products/[productId] → GET single product
    orders/            → GET user's orders, POST place order
    orders/[orderId]   → PATCH status (user cancel pending; admin any transition)
    adoptions/         → GET public available listings, POST create (auth)
    adoptions/[listingId] → GET public, PATCH/DELETE (owner or admin)
    adoptions/[listingId]/apply → POST (auth, one per user)
    adoptions/[listingId]/applications → GET (owner/admin), PATCH approve/reject
    public/pets/[handle] → Public pet data (no auth)
    admin/users/       → GET list, PATCH role
    admin/users/[userId] → PATCH (role change)
    admin/products/    → Full product CRUD + stock
    admin/orders/      → All orders with customer + items
    admin/adoptions/   → All listings with pet, owner, application counts
    admin/professionals/[userId] → PATCH verify/unverify
    cron/emails        → Process welcome email queue (Bearer CRON_SECRET)
    cron/health-alerts → Flag out-of-range metrics (Bearer CRON_SECRET)
    cron/vaccination-reminders → Remind about due vaccines (Bearer CRON_SECRET)

components/
  portal/
    SidebarNav.tsx     → Client component: sidebar (desktop) + top/bottom nav (mobile)

lib/
  db/schema.ts         → SSOT: ALL Drizzle table definitions
  db/index.ts          → Lazy Neon singleton (Proxy pattern — no eager connection)
  auth/index.ts        → NextAuth config (functional pattern — adapter called lazily)
  auth/edge.ts         → Edge-compatible auth config (no bcrypt/DB) — used by proxy.ts only
  auth/guards.ts       → requireSession() / requireRole() / requireAdmin()
  auth/types.ts        → Session type augmentation (adds id, role, emailVerified)
  config/
    species.ts         → SSOT: 4 species (dog, cat, horse, other), breeds, emoji, lifespan, normal ranges
    health-metrics.ts  → SSOT: 7 KPIs, units, toDisplay/toStorage converters, normal ranges
    pet-signal.ts      → SSOT: signal thresholds, labels, Tailwind bg classes
    locales.ts         → SSOT: 9 locales, RTL_LOCALES list
    app.ts             → APP name, emails, URL (NEXT_PUBLIC_APP_URL)
    auth.ts            → BCRYPT_SALT_ROUNDS, PASSWORD_MIN_LENGTH
  domain/
    auth.ts            → loginSchema, registerSchema, resolveRole()
    pet-signal.ts      → computePetSignal() — pure, injected, unit-tested
    pet-signal.test.ts → 9 vitest tests
    health.ts          → isMetricInRange(), computeWellnessScore()
    pets.ts            → createPetHandle(), validateSpeciesBreed()
    email-queue.ts     → enqueueWelcomeSequence()
  email/
    index.ts           → sendEmail() via Resend
    templates.ts       → All email templates (SSOT — never inline in API routes)
  utils/format.ts      → formatDateShort, formatWeight, formatTemperature
```

---

## Middleware Routing (`proxy.ts`) — CRITICAL RULES

```
1. /api/auth/*          → ALWAYS pass through (NextAuth must be public)
2. /portal, /admin (PORTAL_PREFIXES)
   + /api/pets, /api/health, /api/vaccinations, /api/medications,
     /api/vets, /api/sitters, /api/bookings, /api/reviews,
     /api/orders, /api/cron, /api/admin (PRIVATE_API_PREFIXES)
                        → Auth-guard only, no locale routing
                        → Unauthenticated → /login?returnTo=<path>
                        → Non-admin at /admin → /portal/dashboard
3. /login, /register, /forgot-password, /reset-password
                        → Bypass intl routing (serve non-localized)
                        → Already-logged-in → redirect to dashboard
4. /api/* (catch-all)   → Pass through, no locale routing (public API routes)
   Public routes (NOT in PRIVATE_API_PREFIXES — self-guard via requireSession()):
     /api/account (registration), /api/public/* (public profiles),
     /api/products (public browse), /api/adoptions (public browse + self-guarded writes),
     /api/auth/forgot-password, /api/auth/reset-password
5. Everything else      → next-intl locale routing (marketing site)
```

**CRITICAL:** All portal routes MUST be under `/portal/`. Do NOT add individual paths to PORTAL_PREFIXES.

**CRITICAL:** `/api/auth` must remain before ALL other checks or NextAuth breaks.

**CRITICAL:** Adding a new private API route? Add its prefix to `PRIVATE_API_PREFIXES` in proxy.ts. Do NOT add `/api` as a blanket prefix — that would block public endpoints like registration.

---

## Database Schema

**Enums:** `user_role` (pet_owner|veterinarian|pet_sitter|admin), `species` (dog|cat|horse|bird|rabbit|guinea_pig|hamster|reptile|fish|other), `sex`, `health_record_type`, `vaccination_status`, `medication_status`, `email_queue_status`, `order_status`, `product_category`, `booking_status`, `adoption_listing_status`, `adoption_application_status`

**Tables:**
| Table | Key columns | Notes |
|-------|-------------|-------|
| `users` | id (uuid), email, password, name, role | name derived from email if not provided |
| `accounts` | NextAuth standard | |
| `sessions` | NextAuth standard | |
| `verificationTokens` | NextAuth standard | |
| `ownerProfiles` | userId, phone, city, country (ISO2), timezone, bio | |
| `pets` | id, ownerId, name, species, breed, birthDate, sex, weightGrams, bio, avatarUrl, isPublic, handle (unique), lastKnownSignal | |
| `healthMetrics` | petId, date, weightGrams, temperatureCentidegrees, heartRateBpm, energy/mood/anxiety/socialization (1–5) | UNIQUE(petId, date) |
| `healthRecords` | petId, type, title, date, vetName, clinic, notes | |
| `vaccinations` | petId, name, administeredDate, nextDueDate, status | |
| `medications` | petId, name, dosage, frequency, startDate, endDate, status | |
| `emailQueue` | userId, templateKey, sendAt, sentAt, status, payload (jsonb) | |
| `vetProfiles` | userId (unique), specialty, clinicName, clinicAddress, city, country, phone, bio, isVerified, isAcceptingClients | |
| `sitterProfiles` | userId (unique), bio, services (csv), pricePerDay (cents), city, country, phone, isVerified, isAcceptingClients | |
| `bookings` | id, petId, ownerId, professionalId, startDate, endDate, status, notes | |
| `reviews` | id, bookingId (unique), reviewerId, professionalId, rating (1–5), comment | |
| `products` | id, name, description, priceCents, stock, imageUrl, category, isActive | |
| `orderItems` | id, orderId, productId, quantity, priceCents | |
| `orders` | id, userId, totalCents, status, notes | |
| `adoptionListings` | id, petId, ownerId (denorm), status, title, description, feeCents (null=free), location, requiresExperience, goodWithKids/Dogs/Cats | |
| `adoptionApplications` | id, listingId, applicantId, status, message, experience, housingType | |

**Numeric storage conventions (NEVER violate):**
- Weight: integer grams (3500 = 3.5 kg). Display: ÷ 1000. `toDisplay()` / `toStorage()` in health-metrics.ts.
- Temperature: integer centidegrees (3850 = 38.50°C). Display: ÷ 100.
- Emotional metrics: integer 1–5 (1=low, 5=high). Exception: anxiety is inverted (5=very anxious).
- Rationale: exact integer comparisons for alert thresholds, zero float drift.

---

## Design System

**Color variables (globals.css):**
```
--teal: #0D6E78          Brand (nav, links, focus rings, active states)
--teal-dark: #0A5860     Brand hover
--teal-light: #E3F4F6    Brand backgrounds, hover fills
--accent: #E06B3A        Primary action buttons (Add, Save, Log today, Create account)
--accent-dark: #C85E30   Accent hover
--accent-light: #FEF0E8  Accent backgrounds
--off: #FAF8F5           Page background (warm cream)
--card: #FFFFFF          Card background
--border: #E8E2D9        Default border
--ink: #1C1917           Primary text (warm charcoal)
--ink2: #44403C          Secondary text
--muted: #78716C         Placeholder/helper text
--faint: #C4BBB3         Disabled/decorative
--green: #16A34A         Healthy signal, success
--warn: #D97706          Watch signal, warning
--danger: #DC2626        Concern signal, error
```

**Utility classes (globals.css):**
- `.card` — white card with border + soft shadow + 16px radius
- `.btn-primary` — coral accent fill button (use for all primary actions)
- `.btn-outline` — bordered ghost button (use for secondary/cancel actions)
- `.btn-ghost` — transparent button for tertiary actions
- `.form-input` — styled input/select/textarea (focus ring = teal)
- `.alert-error` / `.alert-success` — inline feedback messages
- `.signal-healthy` / `.signal-watch` / `.signal-concern` — pill badges

**Navigation pattern:**
- Desktop: Fixed 240px left sidebar (`components/portal/SidebarNav.tsx` — client component)
- Mobile: Fixed top bar (h-14) + fixed bottom tab bar
- Portal layout offsets: `lg:ps-60 pt-14 lg:pt-0 pb-20 lg:pb-0`

**Typography:** System font stack (Inter, -apple-system, BlinkMacSystemFont, Segoe UI)

**RTL:** Arabic only. `app/[locale]/layout.tsx` injects `dir="rtl"`. Use `ms-*`/`me-*`/`ps-*`/`pe-*` Tailwind classes (logical props), NEVER `ml-*`/`mr-*`/`pl-*`/`pr-*`.

---

## Pet Wellness Signal

`lib/domain/pet-signal.ts` → `computePetSignal()` — pure function, unit tested.

```
Input: { species, recentMetrics[], overdueVaccinations, now? }
Output: { signal: "healthy"|"watch"|"concern", reason: string, outOfRangeMetrics[] }

Algorithm:
1. No metrics logged in last 7 days → "watch"
2. Count out-of-range metrics vs species-specific normal ranges
3. ≥2 out-of-range → "concern"; ≥1 out-of-range → "watch"; else "healthy"
4. Any overdue vaccination → escalates signal by one level (healthy→watch, watch→concern)
```

**If you change `computePetSignal` you MUST update `lib/domain/pet-signal.test.ts`.**

---

## Auth & Role System

- **Credentials provider**: email/password with bcrypt (BCRYPT_SALT_ROUNDS=12)
- **Google OAuth**: configured in NextAuth but needs env vars set (GOOGLE_CLIENT_ID/SECRET)
- **Role resolution**: `ADMIN_EMAILS` env var → admin. All others → pet_owner. Vet/sitter set manually by admin (Phase 2).
- **Guards pattern** (same as VitaReBa):
  ```typescript
  const { session, error } = await requireSession();
  if (error) return error;
  // session is guaranteed non-null here
  ```
- **Session augmentation**: `lib/auth/types.ts` adds `id` (uuid), `role: UserRole`, `emailVerified` to session.

---

## SSOT Rules

**2-file test:** Adding a species = `lib/config/species.ts` + schema migration only. More files → architecture is wrong.

| What | Where | NEVER in |
|------|-------|---------|
| Species, breeds, icons, lifespan | `lib/config/species.ts` | DB table, component |
| Health KPI defs, units, ranges | `lib/config/health-metrics.ts` | Component |
| Signal thresholds, labels, colors | `lib/config/pet-signal.ts` | Cron route, component |
| Locales, RTL flag | `lib/config/locales.ts` | next-intl config |
| App name, email, URL | `lib/config/app.ts` | Component |
| Auth guards | `lib/auth/guards.ts` | Page component |
| Signal computation logic | `lib/domain/pet-signal.ts` | API route, cron |
| Email templates | `lib/email/templates.ts` | API route (inline) |

---

## Cron Jobs

All `/api/cron/*` routes require `Authorization: Bearer CRON_SECRET`.

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/emails` | `0 7 * * *` | Process welcome email queue |
| `/api/cron/health-alerts` | `0 8 * * *` | Flag out-of-range metrics, email owners |
| `/api/cron/vaccination-reminders` | `0 9 * * *` | Remind about vaccines due in 30 days |

---

## Phase Status

### Phase 1 — Complete ✓
- User auth (register/login/logout, forgot/reset password, credentials + Google OAuth shell)
- Species: dog, cat, horse, other — with breeds
- Health metrics logging (daily, upsert, with species-specific range hints)
- Pet wellness signal (healthy/watch/concern), cached to `lastKnownSignal` on log POST
- Digital Twin: emotional state (Thriving/Content/Attention/Struggling) with trend analysis
- Health charts (Recharts — 30-day trends for all 7 metrics, per-species normal range lines)
- Vaccination tracking (add + status badge)
- Health records (add, list with type icons)
- Medications (add, list with active/completed/discontinued status)
- Account settings (edit name, change password)
- Pet avatar upload (UI + API — needs BLOB_READ_WRITE_TOKEN in Vercel Dashboard)
- Email queue (welcome sequence) + cron jobs (health alerts, vaccination reminders)
- Public pet profiles (`/[locale]/pets/[handle]`)
- 9-language i18n with RTL Arabic
- Portal UI (dashboard with twin mini-bars, pets CRUD, health log, check-in)
- Marketing site (homepage, /features, /about, /pricing)
- Species guides (`/[locale]/species/[dog|cat|horse]`)
- Sidebar nav + mobile bottom nav + admin panel

### Env vars still needed (user action — no code change required)
- [ ] `BLOB_READ_WRITE_TOKEN` → Vercel Blob dashboard → enables pet avatar upload
- [ ] `ADMIN_EMAILS` → owner's email → enables admin panel access
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Google Cloud Console → enables Google OAuth
- [ ] `RESEND_API_KEY` + `RESEND_FROM` → resend.com → enables all transactional email

### Phase 2 — Complete ✓
- Vet profiles (create/edit at `/portal/professional-profile`, public at `/[locale]/pros/[userId]`)
- Sitter profiles (same)
- Find a Pro page (`/portal/find`) with booking modal
- Bookings management (`/portal/bookings`) with status flow + review modal
- Reviews (POST `/api/reviews`, linked to completed booking, avg shown on pro card)
- Admin professional verification (`/api/admin/professionals/[userId]`)

### Phase 3 — Complete ✓
- Product catalogue (`/portal/shop`) with cart drawer + checkout
- Order history (`/portal/orders`)
- Admin products panel (`/admin/products`) — CRUD + stock management
- Admin orders panel (`/admin/orders`) — fulfillment workflow + revenue stats
- Transactional emails: order confirmation + status updates (via Resend)

### Phase 4 — Complete ✓
- Adoption listings: owner creates at `/portal/pets/[petId]/list-for-adoption`, manages at `/portal/adoptions`
- Adoption applications: browser applies at `/portal/adopt/[listingId]`, owner approves/rejects
- Public browse: `/[locale]/adopt` + `/[locale]/adopt/[listingId]` (SSR, no auth)
- Admin moderation: `/admin/adoptions` — status management for all listings
- Transactional emails: application received (owner) + status change (applicant)

---

## Known Gotchas

1. **`/api/auth/*` must always be public** — NextAuth route. The middleware has an explicit early-return for this path. Never add `/api/auth` to any auth-guard list.

2. **Auth pages bypass intl routing** — `/login`, `/register` etc. live at non-localized paths `app/(auth)/`. They're excluded from next-intl in proxy.ts. If you add new auth pages, add them to `AUTH_PATHS` in `proxy.ts`.

3. **Lazy DB singleton** — `lib/db/index.ts` uses a Proxy to defer DB connection until first use. This prevents connection at build time. Always use `getInstance()` or the `db` proxy export, never instantiate `drizzle()` directly in a component/route.

4. **Functional NextAuth config** — `lib/auth/index.ts` uses `NextAuth(() => {...})` (function form) so the DrizzleAdapter is only called at runtime, not at module evaluation. Required to avoid build-time DB connection.

5. **Edge auth config** — `proxy.ts` imports from `lib/auth/edge.ts` (no bcrypt, no DB). Never import from `lib/auth/index.ts` in middleware.

6. **Weight/temperature are integers** — Always store as grams and centidegrees. `health-metrics.ts` has `toDisplay()` and `toStorage()` converters. Float storage will break alert threshold comparisons.

7. **Pet signal test must be updated** — Any change to `computePetSignal()` logic must be reflected in `lib/domain/pet-signal.test.ts`. Run `pnpm test` to verify.

8. **CRON_SECRET must not have trailing whitespace** — Vercel rejects it. Use `printf` not `echo` when setting via CLI.

---

## Red Flags

- Species or breed hardcoded in a component → move to `lib/config/species.ts`
- Health metric unit/range hardcoded → move to `lib/config/health-metrics.ts`
- `ml-*`/`mr-*`/`pl-*`/`pr-*` Tailwind classes → use logical props `ms-*`/`me-*`/`ps-*`/`pe-*`
- New portal route not under `/portal/` → breaks middleware, unauthenticated users get 404
- Signal threshold in a cron route → `lib/config/pet-signal.ts`
- Email template inline in an API route → `lib/email/templates.ts`
- Weight stored as float → always integer grams
- Temperature stored as float → always integer centidegrees
- `computePetSignal` changed without updating tests
- Importing `lib/auth/index.ts` in middleware → use `lib/auth/edge.ts`
- Any `/api/auth/*` route behind auth guard → NextAuth breaks entirely
