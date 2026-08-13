"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Stethoscope, Home, Scissors, ArrowRight, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Self-serve upgrade from pet owner to professional. Mirrors registration's
 * trust-first role choice — verification remains a separate admin-granted
 * badge. Without this page, an existing owner had no path into offering
 * services short of creating a second account.
 */

type ProRole = "veterinarian" | "pet_sitter" | "groomer";

export default function BecomeAProPage() {
  const t = useTranslations("portal");
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [choice, setChoice] = useState<ProRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const role = session?.user?.role;
  const alreadyPro = role === "veterinarian" || role === "pet_sitter" || role === "groomer";

  async function confirm() {
    if (!choice) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/account/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: choice }),
    });
    const data = await res.json().catch(() => null);
    if (data?.success) {
      await updateSession();
      router.push("/portal/professional-profile");
      return;
    }
    setSaving(false);
    setError(data?.error ?? t("saveFailed"));
  }

  if (alreadyPro) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2">{t("becomeProTitle")}</h1>
        <p className="text-sm text-[var(--muted)] mb-4">{t("becomeProAlready")}</p>
        <Link href="/portal/professional-profile" className="btn-primary inline-flex items-center gap-2">
          {t("becomeProGoToProfile")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const OPTIONS: { id: ProRole; icon: React.ElementType; title: string; desc: string }[] = [
    { id: "pet_sitter", icon: Home, title: t("becomeProSitterTitle"), desc: t("becomeProSitterDesc") },
    { id: "groomer", icon: Scissors, title: t("becomeProGroomerTitle"), desc: t("becomeProGroomerDesc") },
    { id: "veterinarian", icon: Stethoscope, title: t("becomeProVetTitle"), desc: t("becomeProVetDesc") },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[var(--ink)]">{t("becomeProTitle")}</h1>
      <p className="text-sm text-[var(--muted)] mt-0.5 mb-6">{t("becomeProSubtitle")}</p>

      {error && <p className="alert-error mb-4">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {OPTIONS.map(({ id, icon: Icon, title, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => setChoice(id)}
            className={`card card-hover p-5 text-start transition-colors ${
              choice === id ? "border-2 border-[var(--teal)]" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-[var(--teal)]" />
            </div>
            <p className="font-semibold text-[var(--ink)] mb-1">{title}</p>
            <p className="text-sm text-[var(--muted)]">{desc}</p>
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs text-[var(--muted)] mb-6">
        <BadgeCheck className="w-4 h-4 flex-shrink-0 text-[var(--teal)]" />
        <p>{t("becomeProKeepsEverything")}</p>
      </div>

      <button
        onClick={confirm}
        disabled={!choice || saving}
        className="btn-primary disabled:opacity-60 flex items-center gap-2"
      >
        {saving ? t("findBookingInProgress") : t("becomeProConfirm")}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
