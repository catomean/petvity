"use client";

import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { profileSteps, profileProgress, isProfileLive } from "@/lib/domain/profile-readiness";
import type { ProfileKind } from "@/lib/domain/profile-readiness";

/**
 * The onboarding spine for professionals and sellers: exactly what is still
 * missing before customers can find you, and an honest live/not-live state.
 * Same rule the public directory enforces — no hidden curation.
 */
export default function ProfileReadiness({
  kind,
  profile,
}: {
  kind: ProfileKind;
  profile: Record<string, unknown>;
}) {
  const t = useTranslations("portal");
  const steps = profileSteps(kind, profile);
  const progress = profileProgress(steps);
  const live = isProfileLive(steps);
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-semibold text-[var(--ink)]">
            {live ? t("readyLiveTitle") : t("readySetupTitle")}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {live ? t("readyLiveDesc") : t("readyRemaining", { count: remaining })}
          </p>
        </div>
        <span className={`badge ${live ? "badge-green" : "badge-warn"}`}>
          {live ? t("readyBadgeLive") : t("readyBadgeDraft")}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--off)] overflow-hidden mb-4">
        <div
          className="h-full bg-[var(--teal)] transition-[width] duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            {s.done ? (
              <Check className="w-4 h-4 text-[var(--green)] flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-[var(--faint)] flex-shrink-0" />
            )}
            <span className={s.done ? "text-[var(--muted)] line-through" : "text-[var(--ink2)]"}>
              {t(`readyStep_${s.key}` as Parameters<typeof t>[0])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
