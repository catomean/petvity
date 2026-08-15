import { Resend } from "resend";
import { APP } from "@/lib/config/app";
import { isUndeliverableRecipient } from "@/lib/config/email";

let _resend: Resend | undefined;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const FROM =
  process.env.RESEND_FROM ?? `${APP.name} <noreply@petvity.com>`;

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Send a transactional email via Resend.
 * Returns { sent: true } on success, { sent: false } when RESEND_API_KEY is
 * not configured (dev/staging) or the recipient cannot receive mail — never
 * throws for either.
 * Throws for Resend API errors so callers can decide to retry or log.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<{ sent: boolean }> {
  // Test fixtures are real users in a real database, so they get real mail —
  // at domains with no mailbox. Every such send is a hard bounce charged
  // against the reputation that carries real owners' password resets.
  // See lib/config/email.ts.
  if (isUndeliverableRecipient(to)) {
    process.stderr.write(`[email] undeliverable recipient — not sending "${subject}"\n`);
    return { sent: false };
  }

  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      process.stderr.write(`[email] RESEND_API_KEY not set — skipping "${subject}"\n`);
    }
    return { sent: false };
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return { sent: true };
}
