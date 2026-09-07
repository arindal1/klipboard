# Repository Map

High-level guide to where things live. For *why* things are structured this
way, see [ARCHITECTURE.md](./ARCHITECTURE.md). For endpoint contracts, see
[API.md](./API.md).

```
clip/
├── prisma/
│   └── schema.prisma            # User, Account, Session, VerificationToken, Notepad
├── src/
│   ├── instrumentation.ts       # Next.js server-boot hook: self-ping keep-alive against /api/health (Render)
│   ├── middleware.ts            # Protects /dashboard/**, redirects to /login; redirects authenticated users away from /login,/signup
│   ├── lib/
│   │   ├── auth.config.ts       # Edge-safe NextAuth config (pages, jwt/session callbacks) - no Prisma/bcrypt
│   │   ├── auth.edge.ts         # Edge-safe `auth()` built from auth.config.ts - used by middleware.ts only
│   │   ├── auth.ts              # Full Auth.js (NextAuth v5) config: credentials + GitHub + Google + Prisma adapter (Node runtime only)
│   │   ├── prisma.ts            # Singleton PrismaClient + 5-min DB keep-alive ping (Neon)
│   │   ├── gsap.ts              # GSAP + ScrollTrigger setup, prefersReducedMotion()
│   │   ├── motion.ts            # Framer Motion spring/variant presets
│   │   ├── rateLimit.ts         # In-memory fixed-window rate limiter (signup, notepad mutations)
│   │   ├── tips.ts              # Static empty-dashboard tip copy
│   │   └── feedback.ts          # Opt-in Web Audio chime + vibration for save confirmation
│   ├── hooks/
│   │   ├── useScrollReveal.ts   # GSAP scroll-reveal hook for child elements
│   │   ├── useStaggerReveal.ts  # Mount-triggered stagger reveal (notepad list)
│   │   └── useTypingActivity.ts # Ref-based typing-activity decay, feeds the background shader
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Panel.tsx        # Neumorphic surface (raised/inset), used everywhere
│   │   │   ├── Button.tsx       # Neumorphic Button / ButtonLink
│   │   │   ├── Toast.tsx        # Save-confirmation toast stack (checkmark pulse, gentleSpring)
│   │   │   └── CommandPalette.tsx # Cmd/Ctrl+K quick-switch palette + hidden background-burst Easter egg
│   │   ├── motion/
│   │   │   ├── RevealText.tsx   # Per-word entrance animation for headlines
│   │   │   └── EmptyState.tsx   # Mount-triggered SVG/GSAP illustration for zero-notepad state
│   │   ├── three/
│   │   │   ├── NeumorphicBackground.tsx  # R3F + GLSL generative background, reacts to typing activity
│   │   │   └── BackgroundCanvas.tsx      # ssr:false wrapper + reduced-motion fallback
│   │   └── pwa/
│   │       └── RegisterSW.tsx   # Registers public/sw.js in production
│   ├── types/
│   │   └── next-auth.d.ts       # Augments Session/JWT with `user.id`
│   └── app/
│       ├── layout.tsx           # Root HTML shell, SEO metadata, PWA registration
│       ├── globals.css          # Soft Tactile / Dark Neumorphism tokens + shared classes
│       ├── page.tsx             # Root route - Server Component, redirects to /dashboard if signed in
│       ├── home-client.tsx      # Marketing homepage (hero, feature grid, CTA, footer credit)
│       ├── not-found.tsx        # 404 page
│       ├── error.tsx            # Route-segment error boundary
│       ├── global-error.tsx     # Root layout error boundary
│       ├── loading.tsx          # Root loading fallback
│       ├── robots.ts            # Generates /robots.txt
│       ├── sitemap.ts           # Generates /sitemap.xml
│       ├── manifest.ts          # Generates /manifest.webmanifest (PWA)
│       │
│       ├── login/page.tsx       # Credentials + OAuth sign-in form
│       ├── signup/page.tsx      # Username/email/password signup → auto sign-in
│       │
│       ├── dashboard/
│       │   ├── page.tsx             # Server Component: auth guard + initial notepad fetch
│       │   ├── loading.tsx          # Dashboard-segment loading fallback
│       │   └── dashboard-client.tsx # Client Component: sidebar, editor, CRUD actions
│       │
│       └── api/
│           ├── auth/
│           │   ├── [...nextauth]/route.ts  # Auth.js handlers (GET/POST)
│           │   └── signup/route.ts         # Custom credentials signup endpoint
│           ├── health/route.ts             # Unauthenticated liveness probe (keep-alive target)
│           └── notepads/
│               ├── route.ts                # GET (list mine) / POST (create)
│               └── [id]/route.ts           # GET / PUT / DELETE (owner-only)
│
├── public/
│   └── sw.js                    # Offline app-shell service worker (PWA) + IndexedDB queue for offline notepad PUT saves
├── docs/                        # This documentation set
├── .github/
│   ├── copilot-instructions.md  # Repo-specific agent rules
│   ├── skills/                  # Agent skills (e.g. immersive-web-design)
│   └── instructions/            # Mode/behavior instructions (caveman, security, etc.)
│
├── .env.example                 # DATABASE_URL, AUTH_SECRET, OAuth client vars, SITE_URL, SELF_URL
├── prisma/schema.prisma
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── eslint.config.js
└── package.json
```

## Where do I add a new feature?

| I want to… | Touch these files |
|---|---|
| Add a new notepad field (e.g. tags) | `prisma/schema.prisma` → migrate → `src/app/api/notepads/**` (zod schemas) → `dashboard-client.tsx` |
| Add a new OAuth provider | `src/lib/auth.ts` (`providers` array) → `.env.example` → `docs/API.md` |
| Add a new authenticated page | `src/app/<route>/page.tsx` → add matcher to `src/middleware.ts` `config.matcher` if it must be protected |
| Change the landing page | Edit `src/app/home-client.tsx`; reuse `Panel`/`Button`/`BackgroundCanvas` rather than inline styles |
| Add a new API resource | New folder under `src/app/api/<resource>/route.ts` (+ `[id]/route.ts`), follow the `notepads` pattern: `auth()` → ownership check → `zod` validate → Prisma |