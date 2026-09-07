import { NextResponse } from "next/server";

/**
 * Lightweight liveness probe - no auth, no DB dependency. Used by the
 * self-ping keep-alive in `src/instrumentation.ts` to stop Render's free
 * tier from spinning the instance down after 15 minutes idle.
 */
export function GET() {
  return NextResponse.json({ status: "ok" });
}