import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * The one place a cron request is authorised.
 *
 * Every cron route previously inlined this:
 *
 *     if (auth !== `Bearer ${process.env.CRON_SECRET}`) return 401
 *
 * which fails **open**. With `CRON_SECRET` unset, `process.env.CRON_SECRET` is
 * `undefined`, the template literal becomes the string `"Bearer undefined"`, and
 * anyone sending exactly that header is authorised. The routes behind this gate
 * wipe and reseed the demo account and email every opted-in owner, so the blast
 * radius of a missing environment variable was "a stranger can mass-mail your
 * users".
 *
 * A secret that is absent must deny everything, not accept a guessable string.
 * That is the whole reason this is a function instead of a line of code repeated
 * seven times: an invariant that lives in seven places is seven chances to get
 * it wrong, and it was already wrong in all seven.
 */

export type CronAuthResult = { ok: true } | { ok: false; response: NextResponse };

const unauthorized = () =>
  NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

/**
 * Compare without leaking length or content through timing.
 *
 * Over TLS this is close to unexploitable, so it is not the point — the point is
 * that a comparison helper which is obviously correct removes the need for
 * anyone to reason about whether it matters here.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireCronAuth(req: Request): CronAuthResult {
  const expected = process.env.CRON_SECRET;

  // Fail closed. An unconfigured secret is a broken deployment, not an open door.
  if (!expected || expected.trim().length === 0) {
    console.error(
      "CRON_SECRET is not set — refusing every cron request. " +
        "This is a deployment fault: the timers will fail loudly until it is configured.",
    );
    return { ok: false, response: unauthorized() };
  }

  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return { ok: false, response: unauthorized() };
  }

  return secretsMatch(header.slice("Bearer ".length), expected)
    ? { ok: true }
    : { ok: false, response: unauthorized() };
}
