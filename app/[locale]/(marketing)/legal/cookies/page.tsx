import type { Metadata } from "next";
import Link from "next/link";
import { APP } from "@/lib/config/app";
import { LegalPage } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: `Cookie Policy · ${APP.name}`,
  description: `What cookies ${APP.name} uses and why.`,
};

const EFFECTIVE_DATE = "April 26, 2026";

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" effectiveDate={EFFECTIVE_DATE}>
      <p>
        {APP.name} uses a small number of cookies, all in the &quot;strictly necessary&quot; or
        &quot;preference&quot; categories. We do not use advertising or third-party tracking
        cookies.
      </p>

      <h2>Cookies we set</h2>

      <h3>Authentication (strictly necessary)</h3>
      <ul>
        <li>
          <code>__Secure-next-auth.session-token</code> — your signed-in session. HttpOnly, Secure,
          SameSite=Lax. Cleared on sign-out.
        </li>
        <li>
          <code>__Host-next-auth.csrf-token</code> — CSRF protection for authentication endpoints.
        </li>
        <li>
          <code>__Secure-next-auth.callback-url</code> — preserves your intended destination across
          the login flow.
        </li>
      </ul>

      <h3>Preferences</h3>
      <ul>
        <li>
          <code>NEXT_LOCALE</code> — remembers your language choice for one year so you don&apos;t
          have to reselect on each visit. Set by the language switcher.
        </li>
      </ul>

      <h2>Analytics</h2>
      <p>
        We do not use any third-party analytics or advertising cookies, and we do not track or
        identify individual users.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can clear cookies for {APP.name} at any time from your browser settings. Clearing the
        authentication cookies will sign you out; clearing the preference cookies will reset your
        language to the default. We don&apos;t set anything that requires a cookie banner under GDPR
        / ePrivacy because all cookies above are either strictly-necessary or set only by your
        explicit action (selecting a language).
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href={`mailto:${APP.supportEmail}`}>{APP.supportEmail}</a>.
      </p>

      <p>
        See also: <Link href="/legal/privacy">Privacy Policy</Link> ·{" "}
        <Link href="/legal/terms">Terms of Service</Link>
      </p>
    </LegalPage>
  );
}
