"use client";

import Link from "next/link";
import { Zap, Smile, Wind, Users, Brain, CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TWIN_STATE_CONFIG, TWIN_TREND_CONFIG } from "@/lib/config/digital-twin";
import type { TwinState, TwinTrend } from "@/lib/domain/digital-twin";
import { useTranslations } from "next-intl";

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mood:          Smile,
  energy:        Zap,
  anxiety:       Wind,
  socialization: Users,
};

// Icon mapping stays in the component (React component references are UI, not config)
const TREND_ICONS: Record<TwinTrend, React.ComponentType<{ className?: string }>> = {
  improving:         TrendingUp,
  stable:            Minus,
  declining:         TrendingDown,
  insufficient_data: Minus,
};

type Props = {
  twin: TwinState;
  petId: string;
  petName: string;
};

export function DigitalTwinCard({ twin, petId, petName }: Props) {
  const t = useTranslations("portal");
  const tTwin = useTranslations("twin");
  const cfg = TWIN_STATE_CONFIG[twin.id];
  const trendCfg = TWIN_TREND_CONFIG[twin.trend];
  const TrendIcon = TREND_ICONS[twin.trend];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 ${cfg.bg} border-b border-[var(--border)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={`w-4 h-4 ${cfg.text}`} />
            <span className={`text-sm font-semibold ${cfg.text}`}>Digital Twin</span>
          </div>
          <div className="flex items-center gap-3">
            {twin.trend !== "insufficient_data" && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trendCfg.color}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span>{tTwin(twin.trend)}</span>
                {twin.trendDelta !== 0 && (
                  <span className="tabular-nums">
                    {twin.trendDelta > 0 ? `+${twin.trendDelta}` : twin.trendDelta}
                  </span>
                )}
              </div>
            )}
            {twin.daysAgo !== null && (
              <span className="text-xs text-[var(--muted)]">
                {twin.daysAgo === 0 ? t("today") : twin.daysAgo === 1 ? t("yesterday") : t("daysAgo", { count: twin.daysAgo })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {twin.id === "no_data" ? (
          /* ── No data ──────────────────────────────────────────── */
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <p className="text-sm font-medium text-[var(--ink)] mb-1">
              {petName}&apos;s twin isn&apos;t active yet
            </p>
            <p className="text-xs text-[var(--muted)] mb-4 max-w-xs mx-auto">
              Log daily health check-ins to build a living portrait of how {petName} is feeling.
            </p>
            <Link href={`/portal/pets/${petId}/health/log`} className="btn-primary text-sm">
              <CalendarDays className="w-4 h-4" />
              Log first check-in
            </Link>
          </div>
        ) : (
          /* ── Active twin ──────────────────────────────────────── */
          <div className="space-y-4">
            {/* Score + summary */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`text-xl font-bold ${cfg.text}`}>{tTwin(twin.id)}</p>
                <p className="text-sm text-[var(--ink2)] mt-0.5">{twin.summary}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-3xl font-extrabold tabular-nums ${cfg.text}`}>
                  {twin.scorePercent}
                </span>
                <span className="text-sm text-[var(--muted)] ms-1">/ 100</span>
              </div>
            </div>

            {/* Overall score bar */}
            <div className="h-2 rounded-full bg-[var(--border)]">
              <div
                className={`h-2 rounded-full transition-all ${cfg.barColor}`}
                style={{ width: `${twin.scorePercent}%` }}
              />
            </div>

            {/* Individual metric rows */}
            {twin.metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {twin.metrics.map((m) => {
                  const Icon = METRIC_ICONS[m.id] ?? Brain;
                  return (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-[var(--muted)]" />
                          <span className="text-xs font-medium text-[var(--ink2)]">{m.label}</span>
                        </div>
                        <span className="text-xs text-[var(--muted)]">{m.valueLabel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--border)]">
                        <div
                          className={`h-1.5 rounded-full ${cfg.barColor}`}
                          style={{ width: `${m.fillPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stale data nudge */}
            {twin.daysAgo !== null && twin.daysAgo > 0 && (
              <div className="pt-1 border-t border-[var(--border)]">
                <Link
                  href={`/portal/pets/${petId}/health/log`}
                  className="text-xs text-[var(--teal)] hover:underline inline-flex items-center gap-1"
                >
                  <CalendarDays className="w-3 h-3" />
                  Log today&apos;s check-in to update the twin
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
