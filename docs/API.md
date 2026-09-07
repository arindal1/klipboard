# API Reference

All routes are Next.js Route Handlers under `src/app/api/**`. Unless noted,
requests/responses are JSON. Authenticated routes derive the session
server-side via `auth()` (Auth.js) - they never trust a client-supplied
user ID.

## Conventions

- **Auth failure:** `401 { "error": "Unauthorized" }`
- **Not found / not owned:** `404 { "error": "Not found" }` - a notepad
  belonging to another user returns 404, not 403, to avoid confirming
  existence.
- **Validation failure:** `400 { "error": "<first zod issue message>" }`
- **Rate limited:** `429 { "error": "<message>" }` - in-memory, per-instance
  fixed-window limiter (`src/lib/rateLimit.ts`); see per-route limits below.
- Success bodies wrap the resource in a named key (`user`, `notepad`,
  `notepads`) rather than returning bare arrays/objects.

---

## Auth

### `POST /api/auth/signup`

Create a new credentials-based account. Does **not** sign the user in -
the client is expected to call `signIn("credentials", …)` afterward.

**Body**
```json
{ "username": "string, 3-24 chars, [a-zA-Z0-9_]", "email": "string, valid email", "password": "string, min 8 chars" }
```

**Responses**
| Status | Body | Meaning |
|---|---|---|
| 201 | `{ "user": { "id", "username", "email" } }` | Account created |
| 400 | `{ "error": "<message>" }` | Failed validation |
| 409 | `{ "error": "Email already in use" \| "Username already taken" }` | Duplicate |
| 429 | `{ "error": "Too many signup attempts. Try again later." }` | Rate limited: 5 attempts / 10 min per IP |

### `GET /api/auth/[...nextauth]`, `POST /api/auth/[...nextauth]`

Standard Auth.js (NextAuth v5) catch-all - handles credentials callback,
OAuth redirect/callback (GitHub, Google), session/JWT issuance, and
sign-out. Not called directly; use the `next-auth/react` client helpers
(`signIn`, `signOut`) or `auth()` server-side.

Configured providers (`src/lib/auth.ts`):
- `credentials` - email + password, validated against `User.passwordHash`.
- `github` - env `GITHUB_ID` / `GITHUB_SECRET`.
- `google` - env `GOOGLE_ID` / `GOOGLE_SECRET`.

Session strategy: JWT, augmented with `session.user.id`.

---

## Notepads

All routes below require an authenticated session and only ever operate on
notepads owned by the caller.

### `GET /api/notepads`

List the current user's notepads, newest-updated first. Supports search
and filtering via query params (combinable):

| Param | Meaning |
|---|---|
| `q` | Full-text match against `title` OR `content`, case-insensitive (Postgres `ILIKE` via Prisma `contains`/`insensitive`) |
| `kind` | `TEXT` or `CODE` - exact match |
| `language` | Exact match |
| `tag` | Notepads whose `tags` array contains this value |

Example: `GET /api/notepads?q=todo&kind=CODE&tag=work`

**Response `200`**
```json
{ "notepads": [ { "id", "title", "content", "kind", "language", "tags", "color", "userId", "createdAt", "updatedAt" } ] }
```

### `POST /api/notepads`

Create a notepad. Rate limited: 60 writes / minute per user (shared with
`PUT`/`DELETE` below).

**Body**
```json
{ "title": "string, 1-120 chars (default \"Untitled\")", "kind": "\"TEXT\" | \"CODE\" (default \"TEXT\")", "language": "string, max 40 chars (optional)", "tags": "string[], max 20 items, each 1-30 chars (optional)", "color": "string, hex e.g. #7ef2c9 (optional)" }
```

**Responses**: `201 { "notepad": { … } }` · `429 { "error": "Too many requests. Slow down." }`

### `GET /api/notepads/[id]`

Fetch a single notepad. `404` if it doesn't exist or isn't owned by the
caller.

**Response `200`**: `{ "notepad": { … } }`

### `PUT /api/notepads/[id]`

Partial update - any subset of the fields below. Rate limited: 60 writes /
minute per user. When the client is offline, the service worker
(`public/sw.js`) intercepts this request, queues it in IndexedDB, and
returns a synthetic `202` with header `X-Queued-Offline: true` instead of
failing - the client treats this the same as a successful save. The queue
is replayed via Background Sync (or the next successful `PUT`) once back
online.

**Body**
```json
{ "title": "string, 1-120 chars", "content": "string", "kind": "\"TEXT\" | \"CODE\"", "language": "string, max 40 chars, or null", "tags": "string[], max 20 items, each 1-30 chars (optional)", "color": "string, hex e.g. #7ef2c9, or null (optional)" }
```

**Responses**: `200 { "notepad": { … } }` (fresh `updatedAt`) · `202` (queued offline, no body change) · `429 { "error": "Too many requests. Slow down." }`

### `DELETE /api/notepads/[id]`

Delete a notepad. Rate limited: 60 writes / minute per user (shared
bucket with create/update).

**Responses**: `200 { "ok": true }` · `429 { "error": "Too many requests. Slow down." }`

---

## Notepad resource shape

```ts
type Notepad = {
  id: string;
  title: string;
  content: string;
  kind: "TEXT" | "CODE";
  language: string | null;
  tags: string[];
  color: string | null; // accent tint hex, tints the notepad's Panel shadow/border
  userId: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
```

## Auth-protected pages (not API, but session-gated)

| Route | Guard |
|---|---|
| `/dashboard` | `src/middleware.ts` (redirect) + re-checked in `dashboard/page.tsx` via `auth()` |

---

## Health

### `GET /api/health`

Unauthenticated liveness probe with no DB dependency. Used by the
self-ping keep-alive (`src/instrumentation.ts`) to stop Render's free tier
from spinning the instance down after 15 minutes idle - see
[docs/DEPLOYMENT.md](./DEPLOYMENT.md).

**Response `200`**: `{ "status": "ok" }`