/**
 * Postgres error codes we act on.
 *
 * A unique-constraint violation is usually a user-correctable mistake (a slug
 * already taken), not a server fault — telling them apart is the difference
 * between a helpful 409 and a 500.
 */
const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}
