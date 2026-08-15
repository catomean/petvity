/**
 * Postgres error codes we act on.
 *
 * A unique-constraint violation is usually a user-correctable mistake (a slug
 * already taken), not a server fault — telling them apart is the difference
 * between a helpful 409 and a 500.
 */
const UNIQUE_VIOLATION = "23505";

/**
 * Drizzle wraps driver errors, so the pg error carrying `code` is normally the
 * `cause` of what the caller catches — sometimes nested more than once. Reading
 * only the top-level `code` looks correct in a unit test (where the error is
 * hand-built) and silently returns a 500 in production. Verified against the
 * live endpoint: a duplicate slug threw a wrapped error and answered 500 until
 * this walked the cause chain.
 */
export function isUniqueViolation(e: unknown): boolean {
  for (let cur: unknown = e, depth = 0; cur && depth < 5; depth++) {
    if (
      typeof cur === "object" &&
      "code" in cur &&
      (cur as { code?: unknown }).code === UNIQUE_VIOLATION
    ) {
      return true;
    }
    cur = typeof cur === "object" && "cause" in cur ? (cur as { cause?: unknown }).cause : null;
  }
  return false;
}
