/**
 * SSOT for recipient addresses that must never reach the wire.
 *
 * Every test account the e2e walkthrough and the smoke timer create is a real
 * row in the real database, so the app sends them real transactional mail —
 * welcome, booking, order, adoption, password reset. Those fixtures live at
 * domains that have no MX record and never will, so each one is a hard bounce
 * charged against our sending reputation. Measured on 2026-08-15: 79 of the
 * last 100 sends bounced (80%), against an SES suspension threshold near 5% —
 * and a real tester mailbox had already been pushed onto the suppression list,
 * receiving nothing. A suspended sender means password resets stop arriving,
 * which locks real owners out of their accounts.
 *
 * The API key is shared with the rest of the fleet, so the blast radius of a
 * suspension is every app that sends mail, not just this one.
 *
 * Suppression here is safe precisely because these domains cannot receive mail
 * at all — nothing that would otherwise be delivered is lost.
 */

/**
 * Exact domains that resolve but hold no mailbox.
 *
 * - petvity.orangecat.ch — the app's own web host. It serves HTTP and has no
 *   MX; every address here is a walkthrough or smoke-test fixture.
 * - petvity.com — the demo/seed identity domain (DEMO_ACCOUNT, seeded
 *   residents). Not ours, no MX.
 */
export const UNDELIVERABLE_DOMAINS = ["petvity.orangecat.ch", "petvity.com"] as const;

/**
 * TLDs reserved by RFC 2606/6761 for testing and documentation. Guaranteed
 * never to belong to a real recipient, so any future fixture can use one and
 * be suppressed automatically without editing the list above.
 */
export const UNDELIVERABLE_TLDS = [".invalid", ".test", ".example", ".localhost"] as const;

/**
 * True when the address provably cannot receive mail, so sending would only
 * produce a bounce. A malformed address counts — there is nothing to deliver to.
 */
export function isUndeliverableRecipient(address: string): boolean {
  const at = address.lastIndexOf("@");
  if (at < 1 || at === address.length - 1) return true;
  const domain = address
    .slice(at + 1)
    .trim()
    .toLowerCase();
  if (!domain) return true;
  if ((UNDELIVERABLE_DOMAINS as readonly string[]).includes(domain)) return true;
  return (UNDELIVERABLE_TLDS as readonly string[]).some((tld) => domain.endsWith(tld));
}
