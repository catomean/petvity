/**
 * Shared demo account — lets a visitor without a profile explore the product.
 *
 * The credentials are intentionally public: the login page signs visitors in
 * with them. The account is protected from lockout (password/email changes
 * and password reset are refused for it) and a daily cron wipes and reseeds
 * it, so drive-by edits never persist.
 */
export const DEMO_ACCOUNT = {
  /**
   * Fixed id, deliberately not random.
   *
   * The reset deletes the user row so the FK graph cascades everything a
   * visitor touched, then inserts it again. With a generated id that insert
   * minted a NEW identity every run, while already-issued session tokens still
   * carried the old one — and sessions last 30 days against a reset that runs
   * every 2 hours. A returning visitor was signed in as a user that no longer
   * existed: every query scoped to their id came back empty, so the demo
   * looked like an empty product, and writes failed the owner FK outright.
   *
   * Pinning the id keeps the cascade (still a real wipe) while making the
   * identity survive it, so any session ever issued stays valid.
   */
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@petvity.com",
  password: "explore-petvity",
  name: "Demo Explorer",
} as const;

export function isDemoEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === DEMO_ACCOUNT.email;
}
