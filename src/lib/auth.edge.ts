import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe `auth()` used by `middleware.ts` only - must not import
// `@/lib/auth.ts` (pulls in Prisma/bcrypt, Node-only, breaks the Edge
// middleware bundle with "module is not defined"). No adapter, no
// providers needed here: middleware only reads the session JWT via the
// shared `jwt`/`session` callbacks, it never signs in.
export const { auth } = NextAuth(authConfig);