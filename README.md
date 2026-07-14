# Back in the Game

A personal fitness + recovery tracker. The primary use is gym workout
logging (`/` — pick or add an exercise, log sets of weight × reps, see
progress charts), alongside an L4-L5 herniated-disc recovery tracker
(`/recovery` — pain check-in, leg map, phase-based checklist, relocation
to-dos for a Tokyo → Kuala Lumpur move). Single user, no login system — a
passcode gate protects the data since the app runs on a public URL.

- **`/` (Workouts)** — log exercises/sets, edit or delete past sets, add
  custom exercises on the fly.
- **`/recovery`** — the original sciatica tracker: pain intensity, leg-map
  reach, phase tabs (pre-flight/flight/in-KL), daily checklist, relocation
  to-dos, red-flags safety footer.
- **`/history`** — toggles between a Workouts view (per-exercise progress
  chart + session table) and a Recovery view (pain/reach charts, stats,
  editable entries table, CSV export).
- **`/videos`** — exercise form references (YouTube), plus optional
  Instagram Reel quick-links per exercise.

## Tech stack

- Next.js 15 (App Router, TypeScript, `src/` dir)
- Tailwind CSS v4
- Neon Postgres, accessed via Drizzle ORM (`drizzle-orm` + `@neondatabase/serverless`)
- Migrations via `drizzle-kit`
- `recharts` for the history charts
- `web-push` + a hand-rolled service worker for the daily reminder / PWA
- Deployed to Vercel, with Neon provisioned via the Vercel Marketplace integration

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll land on the passcode gate first — enter
whatever you set as `ACCESS_CODE` (see below).

### Env vars

Copy `.env.example` to `.env.local` and fill in the values, or (if the Vercel
project is already linked) just run:

```bash
vercel env pull .env.local
```

This pulls `DATABASE_URL` and the Neon-integration variables automatically.
You still need to set these app-specific ones yourself (locally and in Vercel
— see below):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (auto-injected by the Vercel Neon integration) |
| `ACCESS_CODE` | The passcode checked by the privacy gate |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push VAPID key pair (server-side) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same public key, exposed to the browser for `pushManager.subscribe()` |
| `CRON_SECRET` | Shared secret Vercel Cron sends as `Authorization: Bearer <value>` when it calls `/api/cron/reminder` |

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

### Database commands

```bash
npm run db:generate   # generate a new migration from src/db/schema.ts
npm run db:migrate    # apply migrations to DATABASE_URL
npm run db:seed       # idempotently seed todos + the settings row
npm run db:studio     # open Drizzle Studio against DATABASE_URL
```

### Tests

```bash
npm test              # vitest — pure logic (centralization, stats, dates)
```

## Neon setup (one-time)

The Neon database is provisioned through the **Vercel Marketplace
integration** rather than Neon's own console, so `DATABASE_URL` (and related
`PG*`/`POSTGRES_*` vars) are injected into all Vercel environments
automatically. To set it up on a fresh project:

1. In the Vercel dashboard, open your project → **Storage** tab.
2. Click **Create Database** → choose **Neon** → follow the prompts to
   authorize and provision.
3. Vercel automatically adds `DATABASE_URL` (and friends) to Production,
   Preview, and Development environment variables.
4. Locally, run `vercel env pull .env.local` to get the same values.
5. Run `npm run db:migrate && npm run db:seed` once against that database.

(This can also be done from the CLI with `vercel install neon`, which is what
was used to set up this project.)

## Deploying to Vercel

This repo is already linked to a Vercel project (`vercel link`) with the
GitHub repo connected for auto-deploys on push to `main`. To redo this setup
elsewhere:

```bash
vercel link --yes --project <project-name>   # creates the project + links this repo
vercel install neon                          # provisions Neon + injects DATABASE_URL
vercel env add ACCESS_CODE production
vercel env add ACCESS_CODE preview
vercel env add ACCESS_CODE development
# ...repeat for VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, CRON_SECRET
vercel env pull .env.local
npm run db:migrate
npm run db:seed
vercel --prod
```

Vercel Cron (configured in `vercel.json`) hits `/api/cron/reminder`; the
route itself decides whether the current hour matches
`settings.reminder_time` in `settings.timezone` before sending anything.

**Hobby plan constraint:** Vercel's Hobby (free) plan only allows a cron to
run once per day, so `vercel.json` fires at `0 0 * * *` (00:00 UTC = 08:00
Asia/Kuala_Lumpur, matching the default `reminder_time`) instead of hourly.
If you change `reminder_time` to something that doesn't fall in that same
hour, reminders won't fire until you either update the cron schedule in
`vercel.json` to match (and redeploy) or upgrade to a Pro plan and switch
the schedule back to `0 * * * *` for true hourly checking.

## Push reminders on iOS

Web Push on iOS Safari **only works after the app has been installed to the
home screen** (Add to Home Screen), and requires iOS 16.4 or later. Opening
the site in a regular Safari tab will not deliver notifications — install
the PWA first, then tap "Enable reminders" from inside the installed app.

## Adding Instagram Reel links

The video library (`src/lib/content.ts`, `VIDEO_LIBRARY`) supports an
optional `reelUrls: string[]` field per exercise group — empty by default.
To add a quick Reel alongside the existing YouTube links, add the URL(s) to
the relevant group's `reelUrls` array and redeploy; it'll show up on
`/videos` and next to that exercise's "▶ watch form" link on `/recovery`.

## Privacy gate

There's no user table or auth library — `src/middleware.ts` checks for a
`bitg_auth` cookie and, if absent, serves a single passcode field
(`/gate`) that's checked against `ACCESS_CODE`. On success it sets a
long-lived `httpOnly` cookie. This is meant to keep casual visitors out of
personal health data on an otherwise-public URL, not to be a hardened auth
system.
