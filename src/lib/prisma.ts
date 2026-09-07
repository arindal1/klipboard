import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaKeepAlive: NodeJS.Timeout | undefined;
}

// In local dev, `@prisma/client` throws at construction time if `prisma
// generate` was never run (e.g. blocked by a firewall - see
// docs/memorybank.md). Rather than crash every page that transitively
// imports this module, fall back to a stub that only throws once a query
// is actually attempted, so unrelated routes/pages keep working. This
// fallback never applies in production - a missing generated client in
// production must fail loudly, not silently.
let isGenerated = true;
function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient();
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    isGenerated = false;
    console.warn(
      "[prisma] Client not generated - run `npx prisma generate`. " +
        "Database calls will fail until then. (" +
        (err instanceof Error ? err.message : String(err)) +
        ")"
    );
    return new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Prisma Client is not generated. Run `npx prisma generate` first."
          );
        },
      }
    ) as PrismaClient;
  }
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// Managed Postgres providers (e.g. Neon) suspend the compute after a short
// idle window (Neon: 5 minutes), causing cold-start latency on the next
// request. A lightweight periodic query keeps the connection warm. Cached
// on `globalThis` (like the client above) so dev HMR doesn't stack up
// duplicate intervals, and `unref()`'d so it never keeps a process alive
// by itself (safe for scripts, tests, and serverless shutdown).
const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000;

if (isGenerated && !globalThis.__prismaKeepAlive) {
  globalThis.__prismaKeepAlive = setInterval(() => {
    prisma.$queryRaw`SELECT 1`.catch(() => {
      // Best-effort keep-alive - a failed ping just means the next real
      // query pays the cold-start cost; nothing to recover here.
    });
  }, KEEPALIVE_INTERVAL_MS);
  globalThis.__prismaKeepAlive.unref();
}