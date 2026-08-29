/**
 * Who is buying, when they may not have an account.
 *
 * Requiring registration before a first purchase is the largest single source
 * of checkout abandonment, so a shop needs to represent a buyer who has an
 * email address and nothing else. The mistake that follows is modelling that as
 * a nullable user id plus a nullable email, which permits two states that must
 * never exist: an order belonging to both, and an order belonging to neither.
 *
 * An order nobody can be identified by cannot be repaired after the fact — the
 * money is taken and there is no one to ship to. So the identity is a
 * discriminated union here, and the matching database constraint is spelled out
 * below for the host schema to adopt.
 */

export type Buyer = { kind: "account"; userId: string } | { kind: "guest"; email: string };

export class BuyerError extends Error {
  override name = "BuyerError";
}

/** Narrow a row with two nullable columns back into the union, refusing the
 *  two states that should have been impossible. */
export function buyerFromRow(row: { userId?: string | null; guestEmail?: string | null }): Buyer {
  const hasAccount = row.userId != null && row.userId !== "";
  const hasEmail = row.guestEmail != null && row.guestEmail !== "";

  if (hasAccount && hasEmail) {
    throw new BuyerError("Order has both a user id and a guest email; exactly one is allowed");
  }
  if (!hasAccount && !hasEmail) {
    throw new BuyerError("Order has neither a user id nor a guest email; nobody can be reached");
  }
  return hasAccount
    ? { kind: "account", userId: row.userId! }
    : { kind: "guest", email: row.guestEmail! };
}

/** The columns to write, from the union. */
export function buyerToRow(buyer: Buyer): { userId: string | null; guestEmail: string | null } {
  return buyer.kind === "account"
    ? { userId: buyer.userId, guestEmail: null }
    : { userId: null, guestEmail: buyer.email.trim().toLowerCase() };
}

export const isGuest = (b: Buyer): b is { kind: "guest"; email: string } => b.kind === "guest";

/**
 * The constraint that makes the union true in the database rather than merely
 * true in TypeScript. Code paths can be added; a CHECK cannot be forgotten.
 *
 * Postgres. `<>` on two booleans is XOR.
 */
export const BUYER_IDENTITY_CHECK = "CHECK ((user_id IS NOT NULL) <> (guest_email IS NOT NULL))";

/**
 * A guest has no session, so an unguessable token is the only handle they have
 * on their own order. It is emailed to them and never listed anywhere.
 *
 * Uses the platform CSPRNG. `Math.random()` is not acceptable here: the token
 * is the only thing standing between a stranger and someone's delivery address.
 */
export function createReceiptToken(): string {
  const g = globalThis as { crypto?: Crypto };
  if (!g.crypto?.getRandomValues) {
    throw new BuyerError(
      "No cryptographic random source available; refusing to mint a guessable receipt token",
    );
  }
  if (typeof g.crypto.randomUUID === "function") return g.crypto.randomUUID();

  const bytes = new Uint8Array(16);
  g.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reject a malformed token before it reaches a query. */
export function isReceiptToken(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
    /^[0-9a-f]{32}$/i.test(value)
  );
}
