import { Resend } from "resend";
import { APP } from "@/lib/config/app";

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
 * not configured (dev/staging) — never throws for missing key.
 * Throws for Resend API errors so callers can decide to retry or log.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<{ sent: boolean }> {
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
