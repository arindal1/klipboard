import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the Auth.js config: no Prisma adapter, no bcrypt, no
// database-backed providers. This is what `middleware.ts` uses (via
// `auth.edge.ts`) because Next.js middleware runs in the Edge runtime,
// which cannot load `@prisma/client` (Node-only, breaks with
// "module is not defined"). The full config in `auth.ts` extends this with
// the Prisma adapter and providers for use in Route Handlers/Server
// Components, which run in the Node.js runtime.
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;