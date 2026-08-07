/**
 * Shared demo account — lets a visitor without a profile explore the product.
 *
 * The credentials are intentionally public: the login page signs visitors in
 * with them. The account is protected from lockout (password/email changes
 * and password reset are refused for it) and a daily cron wipes and reseeds
 * it, so drive-by edits never persist.
 */
export const DEMO_ACCOUNT = {
  email: "demo@petvity.com",
  password: "explore-petvity",
  name: "Demo Explorer",
} as const;

export function isDemoEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === DEMO_ACCOUNT.email;
}
