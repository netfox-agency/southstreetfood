import type { NextRequest } from "next/server";

/**
 * Minimal in-memory rate limiter (fixed window) scoped per-process.
 *
 * Good enough to stop trivial scripted abuse of public POST routes on a
 * single-region deployment. For multi-region or high-fanout, swap the
 * `buckets` Map for Upstash Ratelimit (Redis) or Vercel KV — the public API
 * of this module does not need to change.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic sweep to bound memory — at most ~6k distinct (ip, scope) keys
// per minute, cleaned every 5 minutes.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: NextRequest): string {
  // Prefer trusted proxy headers set by the hosting platform (not spoofable
  // by the client). Falls back to x-forwarded-for which can be spoofed when
  // there is no reverse proxy, but is still useful for single-origin setups.
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();

  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real;

  return "unknown";
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterSec: number };

/**
 * @param scope logical bucket name (e.g. "orders.create", "reservations.post")
 * @param key usually the client IP — any stable identifier
 * @param limit max requests allowed per window
 * @param windowMs window size in milliseconds
 */
export function rateLimit(
  scope: string,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucketKey = `${scope}:${key}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}
