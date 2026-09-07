/**
 * Next.js instrumentation hook - runs once when the server starts.
 * Starts a self-ping keep-alive against `/api/health` so an already-awake
 * Render free-tier instance doesn't spin down after its 15-minute idle
 * window. Uses Render's auto-injected `RENDER_EXTERNAL_URL`, or a manual
 * `SELF_URL` override for other hosts. Limits: this cannot wake an
 * instance that has already gone to sleep - see docs/DEPLOYMENT.md.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const selfUrl = process.env.RENDER_EXTERNAL_URL ?? process.env.SELF_URL;
  if (!selfUrl) return;

  const PING_INTERVAL_MS = 10 * 60 * 1000;
  const healthUrl = new URL("/api/health", selfUrl).toString();

  const interval = setInterval(() => {
    fetch(healthUrl).catch(() => {
      // Best-effort - a failed ping just means we skip this cycle.
    });
  }, PING_INTERVAL_MS);
  interval.unref();
}