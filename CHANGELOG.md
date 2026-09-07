# Changelog 

## 0.1.1

- **Framework migration**: Replaced the bare Vite + React + TS scaffold with Next.js 15 App Router to support full-stack requirements (auth, Postgres, API routes) in one deployable unit. Removed old Vite config/entry files.
- **Auth session strategy**: Adopted JWT sessions (`session: { strategy: "jwt" }`) in auth.ts despite using `PrismaAdapter`, to avoid a DB round-trip per request; `session.user.id` carried via `jwt`/`session` callbacks.
- **Ownership checks**: Kept notepad ownership verification in route handlers (`getOwnedNotepad()` in route.ts) rather than middleware, since middleware can't cheaply do DB-backed checks. Missing/foreign notepad returns `404` (not `403`) to avoid leaking existence.
- **Autosave added (reversing earlier "no autosave" decision)**: Dashboard editor now autosaves 1.2s after typing stops (`AUTOSAVE_DELAY_MS` in `dashboard-client.tsx`), alongside the existing manual Save/Cmd+S with toast/sound/haptic feedback. Real-time multi-device sync (websockets/CRDT) still not implemented - this is single-device debounced autosave only.

## 0.1.0

- **Schema change (unverified)**: Added `tags String[]` and `color String?` to `Notepad` in schema.prisma, but `npx prisma generate`/`prisma migrate dev` couldn't be run (sandbox network block on `binaries.prisma.sh`), so the generated client is unverified against this change.
- **Rate limiting**: Implemented in-memory, per-instance fixed-window rate limiting in rateLimit.ts keyed by IP (signup) or user ID (notepad mutations) - not Redis-backed; would under-count on horizontal scaling.
- **Typing-activity → shader**: `useTypingActivity` uses a `useRef` (not state) bumped on keystroke and decayed per-frame in `NeumorphicBackground`'s `useFrame`, avoiding React re-renders per keystroke in the heavy R3F/WebGL tree.
- **Design system finalized, `/lab` deleted**: Chose "Soft Tactile / Dark Neumorphism" (formerly `05-soft-neumorphic`) as the production direction. Rebuilt as reusable production components: neumorphic tokens in globals.css, Panel.tsx/Button.tsx, shared motion in gsap.ts/motion.ts/useScrollReveal.ts/RevealText.tsx, and NeumorphicBackground.tsx always consumed via BackgroundCanvas.tsx (lazy `next/dynamic({ ssr: false })`, `useSyncExternalStore`-based reduced-motion fallback).

## 0.0.1

- **Auth-redirect centralization**: middleware.ts now redirects unauthenticated `/dashboard/*` requests to `/login?callbackUrl=...`, and redirects already-authenticated requests away from `/login`/`/signup` to `/dashboard`. Homepage handles its own `auth()`-based redirect as a Server Component since it's not covered by the middleware matcher.
- **Prisma client dev fallback**: prisma.ts now catches `PrismaClient` construction failures in non-production (when `prisma generate` hasn't run) and substitutes a `Proxy` that only throws on actual query use, so unrelated routes don't crash; production still fails fast. Keep-alive `setInterval` skipped when the fallback is active.
- **Split Auth.js config for Edge compatibility**: Because `middleware.ts` runs in the Edge runtime (can't load `@prisma/client`), split into auth.config.ts (edge-safe config), auth.edge.ts (edge `auth()` for middleware), and auth.ts (full config with Prisma adapter + providers, for Node.js routes/Server Components).

**Known gaps / deferred**: no automated tests, OAuth needs real `GITHUB_ID/SECRET`/`GOOGLE_ID/SECRET`, `prisma generate` unusable in this sandbox, real-time multi-device sync not implemented, rate limiting is per-instance only.