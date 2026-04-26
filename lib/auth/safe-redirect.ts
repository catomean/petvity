/**
 * Validate a post-login `returnTo` URL to prevent open-redirect attacks.
 *
 * Accepts only same-origin paths. Rejects:
 *   - protocol-relative URLs (`//evil.com`) — browsers treat these as external
 *   - backslash-prefixed paths (`/\evil.com`) — some browsers parse these as
 *     protocol-relative
 *   - absolute URLs (`http://...`, `https://...`)
 *   - empty / non-path strings
 *
 * Returns the original value when safe, otherwise the supplied fallback
 * (typically the dashboard).
 */
export function safeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  // Protocol-relative: //host/path
  if (value.startsWith("//")) return fallback;
  // Backslash-prefixed: some browsers normalize "\\" → "//" before redirect
  if (value.startsWith("/\\")) return fallback;
  return value;
}
