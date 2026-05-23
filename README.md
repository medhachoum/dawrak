# دَوْرَك (Dawrak)

Digital queue system for service businesses in the Arab world (barbers, restaurants, clinics, salons).
Arabic-first, RTL-first, built on Next.js 14 App Router with end-to-end SSR + a real-time SSE event bus.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + shadcn/ui primitives
- **Prisma ORM** — SQLite (dev) / PostgreSQL (production)
- **Auth.js v5** (Credentials provider, JWT sessions, bcrypt hashed passwords)
- **Zod** for env + payload validation
- **Vitest** for pure-logic tests
- IBM Plex Sans Arabic (via `next/font/google`)

## Getting started (local dev)

```bash
cp .env.example .env.local
npm install
npm run db:migrate   # creates prisma/dev.db and applies migrations
npm run db:seed      # inserts sample businesses, queues, and demo owner accounts
npm run dev          # http://localhost:3000
```

The seed script prints two demo owner credentials on success — use them to log
in at `/dashboard/login`.

## Available scripts

| Command              | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Local dev server (hot reload).                     |
| `npm run build`      | Production build into `.next/standalone`.          |
| `npm run start`      | Run the production build.                          |
| `npm run lint`       | ESLint across the project.                         |
| `npm run typecheck`  | `tsc --noEmit`.                                    |
| `npm run test`       | Vitest unit tests (queue-utils, rate-limit, …).    |
| `npm run db:migrate` | `prisma migrate dev`.                              |
| `npm run db:seed`    | Reset + reseed demo data.                          |
| `npm run db:studio`  | Prisma Studio (DB browser).                        |

## Routes

### Public
- `/` — marketing landing page
- `/q/[slug]` — customer-facing queue view (e.g. `/q/salon-al-amir`)
- `/q/[slug]/recover` — recover a previous ticket by phone
- `/privacy`, `/terms` — legal pages

### Dashboard (auth-protected)
- `/dashboard` — main view (today’s stats, active queues, customer actions)
- `/dashboard/history` — historical entries with date filter
- `/dashboard/qr` — printable QR for the shop entrance
- `/dashboard/settings` — edit shop info, manage queues
- `/dashboard/login`, `/dashboard/signup`

### API (selected)
- `POST /api/queue/[queueId]/join` — join a queue (rate-limited, anti-duplicate)
- `GET  /api/queue/[queueId]/entry/[entryId]` — poll position; bumps `lastSeenAt`
- `GET  /api/queue/[queueId]/stream` — SSE stream of queue events
- `POST /api/auth/signup` — create owner account + business
- `POST /api/dashboard/queue/[queueId]/next` — call the next ticket (auth)
- `GET  /api/business/[slug]/qr` — PNG QR code (rate-limited)
- `POST /api/cron/cleanup` — token-protected; sweeps stale `waiting` entries
- `POST /api/cron/retention` — token-protected; PII anonymization + hard delete

## Production deployment

### Option A — Vercel (recommended for prototyping)

1. Push to a Git repo and connect it to Vercel.
2. Set required env vars (see `.env.example`). At minimum:
   - `DATABASE_URL` (PostgreSQL — Vercel Postgres / Neon / Supabase)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_BASE_URL` (full https URL of your deployment, e.g. `https://dawrak.app`)
   - `CRON_SECRET` (any long random string) — required to enable the cron routes
3. Add Vercel Cron jobs in `vercel.json` (or via dashboard) hitting:
   - `GET /api/cron/cleanup?token=$CRON_SECRET` every 5 minutes
   - `GET /api/cron/retention?token=$CRON_SECRET` daily

> Switch `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`
> before deploying — the schema fields are already Postgres-compatible.

### Option B — Docker (self-host)

A multi-stage `Dockerfile` is included; it builds with `output: "standalone"`
to produce a minimal runtime image (~150 MB).

```bash
# 1. Build
docker build -t dawrak:latest .

# 2. Run (point DATABASE_URL at any reachable Postgres)
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dawrak" \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXT_PUBLIC_BASE_URL="https://dawrak.example.com" \
  -e CRON_SECRET="$(openssl rand -base64 24)" \
  dawrak:latest
```

Run migrations against your production DB **before** starting the container
(this image does not migrate on boot, on purpose — that pattern would race in
multi-replica deployments):

```bash
DATABASE_URL=... npx prisma migrate deploy
```

For the cron endpoints, schedule any external cron (Kubernetes CronJob,
GitHub Actions, EasyCron, etc.) to hit:
- `GET /api/cron/cleanup?token=$CRON_SECRET` — every 5 minutes
- `GET /api/cron/retention?token=$CRON_SECRET` — once daily

If `CRON_SECRET` is unset, both routes return `503` (fail-closed).

## Security model — at a glance

- **Auth:** Auth.js v5 + Credentials provider; JWT sessions; passwords stored
  via bcrypt (cost 10).
- **Authorization:** Every `/api/dashboard/**` route runs through
  `requireBusinessMember(businessId)` or `requireQueueOwner(queueId)`; non-
  members get 403 even with a valid session.
- **CSRF / Origin:** All write endpoints (POST/PATCH/DELETE) check that
  `Origin`/`Referer` matches `Host`. Auth.js routes carry their own CSRF.
- **Rate limiting:** `lib/rate-limit.ts` token-bucket; applied to `/join`,
  `/qr`, login, and signup. Swap to Upstash Redis in `lib/rate-limit.ts`
  for multi-instance deployments.
- **PII retention:** Customer name + phone are anonymized after 30 days,
  rows hard-deleted after 365 days (configurable in
  `app/api/cron/retention/route.ts`).
- **Stale-entry cleanup:** Customers whose wait page hasn’t pinged
  `lastSeenAt` for `avg_service * (position + 5)` minutes are auto-marked
  `noshow` so the queue keeps moving.

## Testing

```bash
npm run test         # Vitest, ~30 tests across queue-utils, rate-limit, origin
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

## License

Proprietary — © دَوْرَك. All rights reserved.
