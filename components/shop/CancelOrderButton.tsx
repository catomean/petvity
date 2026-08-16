"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Lets a guest call off an order they have not paid for yet.
 *
 * Two clicks rather than one: a single mis-tap on a receipt should not undo a
 * purchase, and there is no account to un-cancel it from afterwards.
 */
export default function CancelOrderButton({ token }: { token: string }) {
  const t = useTranslations("public");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/shop/order/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const json = await res.json();
      if (json.success) {
        router.refresh();
        return;
      }
      setError(json.error || t("checkoutError"));
    } catch {
      setError(t("checkoutError"));
    }
    setBusy(false);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-[var(--muted)] hover:text-[var(--danger-text)] transition-colors"
      >
        {t("orderCancel")}
      </button>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm text-[var(--ink2)] mb-3">{t("orderCancelConfirm")}</p>
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={cancel} disabled={busy} className="btn-outline">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("orderCancelYes")}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="btn-ghost">
          {t("orderCancelNo")}
        </button>
      </div>
      {error && <p className="alert-error text-sm mt-3">{error}</p>}
    </div>
  );
}
