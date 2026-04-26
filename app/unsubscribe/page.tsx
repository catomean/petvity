import Link from "next/link";
import { eq } from "drizzle-orm";
import { CheckCircle, AlertTriangle, Mail, PawPrint } from "lucide-react";
import { getInstance } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyUnsubscribeToken } from "@/lib/auth/unsubscribe-token";
import { APP } from "@/lib/config/app";

type Search = { searchParams: Promise<{ u?: string; t?: string; done?: string }> };

/** Server action: flips digestOptOut. Re-verifies the token from form data —
 *  never trust the client to tell us which user. */
async function unsubscribeAction(formData: FormData) {
  "use server";
  const userId = String(formData.get("u") ?? "");
  const token = String(formData.get("t") ?? "");
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    // Silent fail — the GET render already validated; if we somehow get here
    // with bad inputs, redirecting to the same page will show the invalid card.
    return;
  }
  const db = getInstance();
  await db.update(users).set({ digestOptOut: true }).where(eq(users.id, userId));
  // Redirect to the same URL with done=1 so the success card renders.
  const { redirect } = await import("next/navigation");
  redirect(`/unsubscribe?u=${encodeURIComponent(userId)}&t=${encodeURIComponent(token)}&done=1`);
}

export default async function UnsubscribePage({ searchParams }: Search) {
  const { u, t, done } = await searchParams;

  const valid = !!u && !!t && verifyUnsubscribeToken(u, t);

  return (
    <div className="min-h-screen bg-[var(--off)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/en"
          className="font-bold text-[var(--teal)] no-underline flex items-center gap-2 mb-8 justify-center"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--teal)] flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg">{APP.name}</span>
        </Link>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] p-8">
          {!valid ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[var(--danger-bg)] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-[var(--danger-text)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--ink)] text-center mb-2">
                Link is invalid or expired
              </h1>
              <p className="text-sm text-[var(--muted)] text-center">
                This unsubscribe link is no longer valid. You can manage email
                preferences from{" "}
                <Link href="/portal/settings" className="text-[var(--teal)] hover:underline">
                  Settings
                </Link>
                {" "}after logging in.
              </p>
            </>
          ) : done === "1" ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[var(--green-bg)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-[var(--green-text)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--ink)] text-center mb-2">
                You&apos;re unsubscribed
              </h1>
              <p className="text-sm text-[var(--muted)] text-center mb-1">
                You won&apos;t receive any more onboarding emails.
              </p>
              <p className="text-xs text-[var(--muted)] text-center mb-6">
                You&apos;ll still get transactional emails for your pets — vaccination
                reminders, health alerts, order confirmations — these are necessary
                for the service.
              </p>
              <p className="text-center">
                <Link href="/portal/settings" className="text-sm text-[var(--teal)] hover:underline">
                  Manage all email preferences →
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-[var(--teal)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--ink)] text-center mb-2">
                Unsubscribe from onboarding emails?
              </h1>
              <p className="text-sm text-[var(--muted)] text-center mb-6">
                You&apos;ll stop receiving the welcome series. Transactional emails
                for your pets (vaccination reminders, health alerts, order
                confirmations) will continue.
              </p>
              <form action={unsubscribeAction} className="space-y-3">
                <input type="hidden" name="u" value={u} />
                <input type="hidden" name="t" value={t} />
                <button type="submit" className="btn-primary w-full justify-center">
                  Unsubscribe
                </button>
                <Link href="/" className="block text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]">
                  Cancel
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
