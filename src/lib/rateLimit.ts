// In-memory fixed-window rate limiter. Per-instance only - on a
// multi-instance deployment each instance has its own bucket map, so the
// effective limit is `limit * instanceCount`. Acceptable for KlipBoard's single
// free-tier Render instance (see docs/DEPLOYMENT.md); revisit with a
// shared store (Redis) before scaling horizontally.
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the action keyed by `key` is allowed under `limit`
 * requests per `windowMs`, incrementing the counter as a side effect.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

/** Best-effort client identifier for unauthenticated routes (e.g. signup). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}