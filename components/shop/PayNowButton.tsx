"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Sends a guest back to Stripe for an order they left unpaid.
 *
 * The receipt token is the only credential — the same one that got them to this
 * page — so there is nothing to sign in to.
 */
export default function PayNowButton({ token }: { token: string }) {
  const t = useTranslations("public");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/shop/order/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const json = await res.json();
      if (json.success && json.data?.checkoutUrl) {
        // Stripe is off-origin, so the Next router can't take us there.
        window.location.assign(json.data.checkoutUrl);
        return;
      }
      setError(json.error || t("checkoutError"));
    } catch {
      setError(t("checkoutError"));
    }
    setBusy(false);
  }

  return (
    <>
      <button onClick={pay} disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {t("orderPayNow")}
      </button>
      {error && <p className="alert-error text-sm mt-3">{error}</p>}
    </>
  );
}
