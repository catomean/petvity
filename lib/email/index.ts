import { sendMail, isMailConfigured, fromAddress, conventionalFrom } from "@bitbaum/mail-kit";
import { APP } from "@/lib/config/app";
import { isUndeliverableRecipient } from "@/lib/config/email";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Send a transactional email via @bitbaum/mail-kit (the fleet's one email
 * layer). Returns { sent: true } on success, { sent: false } when mail is not
 * configured (dev/staging, placeholder key, sandbox sender in production) or
 * the recipient cannot receive mail — never throws for either.
 * Throws for provider API errors so callers can decide to retry or log.
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

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      process.stderr.write(`[email] mail not configured — skipping "${subject}"\n`);
    }
    return { sent: false };
  }

  const result = await sendMail({
    to,
    subject,
    html,
    from: fromAddress() ?? conventionalFrom(APP.name),
  });
  if (!result.sent) throw new Error(`Resend error: ${result.error}`);
  return { sent: true };
}
