/**
 * A fixed-window rate limiter held in process memory.
 *
 * Scope, stated plainly: the app runs as a single systemd service (one Node
 * process), so one map is the whole picture today. If it is ever run with more
 * than one worker, each worker gets its own allowance and the effective limit
 * multiplies — at that point this needs to move to Postgres or Redis. It is
 * deliberately not presented as a security boundary: it exists to stop a
 * trivial script from draining a seller's stock through the unauthenticated
 * checkout, not to stop a determined attacker with many IPs.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Drop expired windows so the map cannot grow without bound. */
function prune(now: number) {
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  // Cheap amortised cleanup — the map only ever holds active windows.
  if (windows.size > 1000) prune(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}

/** Test seam — the module-level map would otherwise leak between test cases. */
export function __resetRateLimits() {
  windows.clear();
}

/**
 * Best-effort client address. Behind Caddy the socket address is always
 * localhost, so the proxy header is the only signal; the first entry is the
 * original client. Spoofable — see the caveat at the top of this file.
 */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
