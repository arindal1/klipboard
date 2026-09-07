# Deployment

Clip deploys as a single Next.js service (Render, free tier) backed by a
managed Postgres instance (Neon, free tier). Both free tiers suspend the
compute after a period of inactivity, which this doc covers.

## Environment variables

Set these in the Render dashboard (or your host's equivalent):

| Var | Notes |
|---|---|
| `DATABASE_URL` | Neon connection string (use the pooled connection string, not the direct one). |
| `AUTH_SECRET` | `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Public URL of the deployed app, e.g. `https://clip.onrender.com`. |
| `GITHUB_ID` / `GITHUB_SECRET` | OAuth app credentials, callback `https://<host>/api/auth/callback/github`. |
| `GOOGLE_ID` / `GOOGLE_SECRET` | OAuth client credentials, callback `https://<host>/api/auth/callback/google`. |
| `NEXT_PUBLIC_SITE_URL` | Same as `NEXTAUTH_URL` - used for SEO metadata, `sitemap.xml`, `robots.txt`. |
| `SELF_URL` | Optional. Only needed if not on Render (Render auto-injects `RENDER_EXTERNAL_URL`). |

Build command: `npm run build` (runs `prisma generate` via `postinstall` if
configured, otherwise run `npm run prisma:generate` in the build step).
Start command: `npm run start`.

## Idle/cold-start problem

- **Neon (free tier):** suspends the compute after **5 minutes** with no
  queries. The next query pays a cold-start penalty (typically 1-3s).
- **Render (free tier):** spins the web service down after **15 minutes**
  with no inbound HTTP traffic. The next request pays a much larger
  cold-start penalty (the whole container restarts, often 30s+).

Two independent keep-alive mechanisms address each layer:

### 1. DB keep-alive ping (`src/lib/prisma.ts`)

A `setInterval` runs `SELECT 1` every 5 minutes on module load, alongside
the existing Prisma client singleton. It's:

- **Cached on `globalThis`**, like the Prisma client itself, so dev HMR
  doesn't stack up duplicate intervals.
- **`unref()`'d**, so it never keeps a script, test runner, or serverless
  shutdown alive by itself.
- **Best-effort** - a failed ping is swallowed; the next real query just
  pays the cold-start cost instead.

This keeps Neon's compute warm *as long as the Next.js server process
itself is running*. It does nothing if the whole Render instance has
spun down (no process = no interval running).

### 2. App self-ping keep-alive (`src/instrumentation.ts` + `/api/health`)

`src/instrumentation.ts` implements Next.js's `register()` hook, which
runs once when the server boots. In production, if a self URL is
available (`RENDER_EXTERNAL_URL`, auto-injected by Render, or a manual
`SELF_URL` for other hosts), it starts a `setInterval` that `fetch`es
`GET /api/health` every 10 minutes - comfortably inside Render's
15-minute idle window. `/api/health` has no auth or DB dependency, so this
ping alone also indirectly keeps the DB keep-alive interval's process
alive.

**Limits:**
- This can only keep an *already-running* instance from going idle. It
  **cannot wake an instance that has already spun down** - there's no
  process left to run the interval. The first request after a genuine
  cold start still pays the full penalty.
- Render's free tier does not guarantee the instance stays up indefinitely
  regardless of traffic; treat this as harm reduction, not a guarantee.
- For a hard guarantee of no cold starts, use an external uptime pinger
  (e.g. cron-job.org, UptimeRobot) hitting `/api/health`, or upgrade off
  the free tier.

## Deploy checklist

1. Push to the connected Git branch (Render auto-deploys) or trigger a
   manual deploy.
2. Run `prisma migrate deploy` (not `migrate dev`) against the production
   `DATABASE_URL` - either as a Render pre-deploy command or manually.
3. Verify `GET /api/health` returns `{ "status": "ok" }` on the deployed
   URL.
4. Verify `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` resolve
   correctly (Next.js file-convention routes, no manual setup needed
   beyond `NEXT_PUBLIC_SITE_URL` being set).