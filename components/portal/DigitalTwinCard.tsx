import Link from "next/link";
import { Zap, Smile, Wind, Users, Brain, CalendarDays } from "lucide-react";
import { TWIN_STATE_CONFIG } from "@/lib/config/digital-twin";
import type { TwinState } from "@/lib/domain/digital-twin";

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mood:          Smile,
  energy:        Zap,
  anxiety:       Wind,   // shown as "Calm"
  socialization: Users,
};

type Props = {
  twin: TwinState;
  petId: string;
  petName: string;
};

export function DigitalTwinCard({ twin, petId, petName }: Props) {
  const cfg = TWIN_STATE_CONFIG[twin.id];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 ${cfg.bg} border-b border-[var(--border)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={`w-4 h-4 ${cfg.text}`} />
            <span className={`text-sm font-semibold ${cfg.text}`}>
              Digital Twin
            </span>
          </div>
          {twin.daysAgo !== null && (
            <span className="text-xs text-[var(--muted)]">
              {twin.daysAgo === 0
                ? "Updated today"
                : twin.daysAgo === 1
                ? "Updated yesterday"
                : `Updated ${twin.daysAgo}d ago`}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        {twin.id === "no_data" ? (
          /* ── No data state ─────────────────────────────────── */
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <p className="text-sm font-medium text-[var(--ink)] mb-1">
              {petName}&apos;s twin isn&apos;t active yet
            </p>
            <p className="text-xs text-[var(--muted)] mb-4 max-w-xs mx-auto">
              Log daily health check-ins to build a living portrait of how{" "}
              {petName} is feeling.
            </p>
            <Link
              href={`/portal/pets/${petId}/health/log`}
              className="btn-primary text-sm"
            >
              <CalendarDays className="w-4 h-4" />
              Log first check-in
            </Link>
          </div>
        ) : (
          /* ── Active twin ────────────────────────────────────── */
          <div className="space-y-4">
            {/* Overall score */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</p>
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
            <div className={`h-2 rounded-full ${cfg.trackColor}`}>
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
                          <span className="text-xs font-medium text-[var(--ink2)]">
                            {m.label}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--muted)]">
                          {m.valueLabel}
                        </span>
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

            {/* Log today CTA if data is stale */}
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
