# KlipBoard

KlipBoard is a cross-device clipboard: sign in, create a notepad (text or code), and
it's instantly available on every other device you sign into. Full-stack
Next.js app with PostgreSQL, custom credentials auth, and OAuth (GitHub/Google).

## Stack

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** via **Prisma**
- **Auth.js (NextAuth v5)** - credentials (bcrypt) + GitHub/Google OAuth
- **GSAP**, **Framer Motion**, **Three.js / React Three Fiber** for the UI

## Getting started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, and
   any OAuth client IDs/secrets you want to enable.
2. Install dependencies: `npm install`
3. Push the schema to your database: `npm run prisma:migrate`
4. Run the dev server: `npm run dev`

## App structure

- `src/app/api/auth/[...nextauth]` - Auth.js route handlers
- `src/app/api/auth/signup` - custom credentials signup
- `src/app/api/notepads` / `src/app/api/notepads/[id]` - notepad CRUD
- `src/app/dashboard` - authenticated dashboard (create/edit/delete notepads)
- `src/app/login`, `src/app/signup` - auth pages
- `prisma/schema.prisma` - User, Account, Session, Notepad models