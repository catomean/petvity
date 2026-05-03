import { getTranslations } from "next-intl/server";
import { SIGNAL_BG_CLASSES, SIGNAL_STRIP_CLASSES } from "@/lib/config/pet-signal";
import type { PetWellnessSignal } from "@/lib/config/pet-signal";
import { formatIsoDate } from "@/lib/utils/format";
import { translateSignalReason } from "@/lib/i18n/signal-reason";
import type { SignalReasonData } from "@/lib/domain/pet-signal";

type HistoryRow = {
  id: string;
  signal: string;
  reason: string | null;
  reasonData: unknown;
  source: string;
  recordedAt: Date;
};

export async function SignalHistoryTimeline({ rows, locale }: { rows: HistoryRow[]; locale?: string }) {
  if (rows.length === 0) return null;

  const loc = locale ?? "en";
  const [tSignal, t] = await Promise.all([
    getTranslations({ locale: loc, namespace: "signal" }),
    getTranslations({ locale: loc, namespace: "portal" }),
  ]);

  return (
    <div className="card p-5 mt-3">
      <h2 className="text-sm font-semibold text-[var(--ink)] mb-4">{t("signalHistoryTitle")}</h2>
      <ol className="relative border-s border-[var(--border)] space-y-4 ms-2">
        {rows.map((row) => {
          const sig = row.signal as PetWellnessSignal;
          const date = formatIsoDate(row.recordedAt.toISOString(), locale);
          return (
            <li key={row.id} className="ms-5">
              {/* Timeline dot — color matches signal level */}
              <span className={`absolute -start-[7px] w-3.5 h-3.5 rounded-full border-2 border-white ${SIGNAL_STRIP_CLASSES[sig]}`} />

              <div className="flex items-center gap-2 flex-wrap">
                <span className={SIGNAL_BG_CLASSES[sig]}>
                  {tSignal(sig)}
                </span>
                <span className="text-xs text-[var(--muted)]">{date}</span>
                {row.source === "cron" && (
                  <span className="text-xs text-[var(--faint)] italic">{t("signalSourceCron")}</span>
                )}
              </div>

              {(row.reasonData || row.reason) && (
                <p className="text-xs text-[var(--ink2)] mt-1 leading-relaxed">
                  {row.reasonData
                    ? translateSignalReason(row.reasonData as SignalReasonData, tSignal)
                    : row.reason}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
