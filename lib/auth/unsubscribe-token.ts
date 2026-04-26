/**
 * One-click unsubscribe tokens for email links.
 *
 * Token = HMAC-SHA256(userId, NEXTAUTH_SECRET). The recipient is the only
 * one who needs to authenticate; we don't need a scope yet because there's
 * a single opt-out toggle (digestOptOut). Add a scope arg if/when we
 * support per-category opt-outs.
 */

import crypto from "node:crypto";
import { APP_URL } from "@/lib/config/app";

/** Returns undefined if NEXTAUTH_SECRET isn't set — caller should treat as
 *  "no unsubscribe link" rather than failing the email send entirely. The
 *  secret is required for NextAuth itself to function, so production never
 *  hits this; it only matters for tests/dev without the env var loaded. */
export function makeUnsubscribeToken(userId: string): string | undefined {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return undefined;
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = makeUnsubscribeToken(userId);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function makeUnsubscribeUrl(userId: string): string | undefined {
  const token = makeUnsubscribeToken(userId);
  if (!token) return undefined;
  return `${APP_URL}/unsubscribe?u=${encodeURIComponent(userId)}&t=${token}`;
}
