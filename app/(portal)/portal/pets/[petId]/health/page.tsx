import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics } from "@/lib/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart3, ChevronLeft } from "lucide-react";
import {
  HEALTH_METRIC_CONFIG,
  PHYSICAL_METRICS,
  EMOTIONAL_METRICS,
  getNormalRange,
} from "@/lib/config/health-metrics";
import type { MetricId } from "@/lib/config/health-metrics";
import type { SpeciesId } from "@/lib/config/species";
import { getMetricDisplay, computeWellnessScore, WELLNESS_SCORE_THRESHOLDS } from "@/lib/domain/health";
import { formatDateShort } from "@/lib/utils/format";
import { HealthTrendChart } from "@/components/portal/HealthTrendChart";

type Params = { params: Promise<{ petId: string }> };

export default async function PetHealthPage({ params }: Params) {
  const session = await auth();
  if (!session) return null;

  const { petId } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) notFound();

  // eslint-disable-next-line react-hooks/purity
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const metrics = await db.query.healthMetrics.findMany({
    where: and(eq(healthMetrics.petId, pet.id), gte(healthMetrics.date, since30)),
    orderBy: [desc(healthMetrics.date)],
  });

  const latest = metrics[0];
  const species = pet.species as SpeciesId;

  const metricFieldMap: Record<MetricId, keyof typeof latest> = {
    weight: "weightGrams",
    temperature: "temperatureCentidegrees",
    heart_rate: "heartRateBpm",
    energy: "energy",
    mood: "mood",
    anxiety: "anxiety",
    socialization: "socialization",
  };

  // Overall wellness score from latest reading
  const wellnessScore = latest
    ? computeWellnessScore(
        {
          weight: latest.weightGrams ?? undefined,
          temperature: latest.temperatureCentidegrees ?? undefined,
          heart_rate: latest.heartRateBpm ?? undefined,
          energy: latest.energy ?? undefined,
          mood: latest.mood ?? undefined,
          anxiety: latest.anxiety ?? undefined,
          socialization: latest.socialization ?? undefined,
        },
        species,
      )
    : null;

  // Chart data: ascending by date, values converted to display units
  const chartData = metrics
    .slice()
    .reverse()
    .map((m) => ({
      date: formatDateShort(m.date),
      weight: m.weightGrams != null ? HEALTH_METRIC_CONFIG.weight.toDisplay(m.weightGrams) : null,
      temperature: m.temperatureCentidegrees != null
        ? HEALTH_METRIC_CONFIG.temperature.toDisplay(m.temperatureCentidegrees)
        : null,
      heart_rate: m.heartRateBpm ?? null,
      energy: m.energy ?? null,
      mood: m.mood ?? null,
      anxiety: m.anxiety ?? null,
      socialization: m.socialization ?? null,
    }));

  // Species-specific normal ranges (display units)
  const weightRange = getNormalRange("weight", species);
  const tempRange = getNormalRange("temperature", species);
  const hrRange = getNormalRange("heart_rate", species);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/portal/pets/${petId}`}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {pet.name}
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mt-1">
            Health
          </h1>
        </div>
        <Link
          href={`/portal/pets/${petId}/health/log`}
          className="btn-primary text-sm"
        >
          Log today
        </Link>
      </div>

      {!latest ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="text-[var(--muted)] mb-4">No health data logged yet.</p>
          <Link href={`/portal/pets/${petId}/health/log`} className="btn-primary">
            Log first check-in
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Latest reading */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-[var(--ink)]">Latest reading</h2>
                {wellnessScore !== null && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      wellnessScore >= WELLNESS_SCORE_THRESHOLDS.good
                        ? "bg-[var(--green-bg)] text-[var(--green)]"
                        : wellnessScore >= WELLNESS_SCORE_THRESHOLDS.fair
                          ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                          : "bg-[var(--danger-bg)] text-[var(--danger)]"
                    }`}
                  >
                    Wellness {wellnessScore}%
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--muted)]">
                {formatDateShort(latest.date)}
              </span>
            </div>

            <div className="space-y-4">
              {/* Physical */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-3">
                  Physical
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PHYSICAL_METRICS.map((metricId) => {
                    const field = metricFieldMap[metricId];
                    const raw = latest[field] as number | null;
                    if (raw === null) return null;
                    const display = getMetricDisplay(metricId, raw, species);
                    const def = HEALTH_METRIC_CONFIG[metricId];
                    return (
                      <div
                        key={metricId}
                        className={`rounded-lg p-3 ${display.inRange ? "bg-[var(--green-bg)]" : "bg-[var(--danger-bg)]"}`}
                      >
                        <div className="text-xs text-[var(--muted)] mb-1">{def.label}</div>
                        <div className="text-lg font-semibold text-[var(--ink)]">
                          {display.value}
                          <span className="text-sm font-normal text-[var(--muted)] ms-1">
                            {display.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Emotional */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-3">
                  Emotional
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EMOTIONAL_METRICS.map((metricId) => {
                    const field = metricFieldMap[metricId];
                    const raw = latest[field] as number | null;
                    if (raw === null) return null;
                    const display = getMetricDisplay(metricId, raw, species);
                    const def = HEALTH_METRIC_CONFIG[metricId];
                    return (
                      <div
                        key={metricId}
                        className={`rounded-lg p-3 ${display.inRange ? "bg-[var(--green-bg)]" : "bg-[var(--danger-bg)]"}`}
                      >
                        <div className="text-xs text-[var(--muted)] mb-1">{def.label}</div>
                        <div className="text-lg font-semibold text-[var(--ink)]">
                          {display.value}
                          <span className="text-sm font-normal text-[var(--muted)] ms-1">
                            {display.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Trend charts — only show if ≥2 data points */}
          {metrics.length >= 2 && (
            <>
              <h2 className="font-semibold text-[var(--ink)] -mb-2">
                30-day trends
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <HealthTrendChart
                  data={chartData}
                  lines={[{ dataKey: "weight", name: "Weight", color: HEALTH_METRIC_CONFIG.weight.chartColor }]}
                  unit=" kg"
                  title="Weight"
                  normalMin={HEALTH_METRIC_CONFIG.weight.toDisplay(weightRange.min)}
                  normalMax={HEALTH_METRIC_CONFIG.weight.toDisplay(weightRange.max)}
                />
                <HealthTrendChart
                  data={chartData}
                  lines={[{ dataKey: "temperature", name: "Temp", color: HEALTH_METRIC_CONFIG.temperature.chartColor }]}
                  unit="°C"
                  title="Temperature"
                  normalMin={HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRange.min)}
                  normalMax={HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRange.max)}
                />
                <HealthTrendChart
                  data={chartData}
                  lines={[{ dataKey: "heart_rate", name: "HR", color: HEALTH_METRIC_CONFIG.heart_rate.chartColor }]}
                  unit=" bpm"
                  title="Heart Rate"
                  normalMin={hrRange.min}
                  normalMax={hrRange.max}
                />
              </div>

              <HealthTrendChart
                data={chartData}
                lines={EMOTIONAL_METRICS.map((id) => ({
                  dataKey: id,
                  name: HEALTH_METRIC_CONFIG[id].label,
                  color: HEALTH_METRIC_CONFIG[id].chartColor,
                }))}
                unit="/5"
                title="Emotional wellbeing"
                integerScale
              />
            </>
          )}

          {/* History table */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--ink)] mb-4">
              History (last 30 days)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-start py-2 px-3 text-xs font-medium text-[var(--muted)]">Date</th>
                    <th className="text-start py-2 px-3 text-xs font-medium text-[var(--muted)]">Weight</th>
                    <th className="text-start py-2 px-3 text-xs font-medium text-[var(--muted)]">Temp</th>
                    <th className="text-start py-2 px-3 text-xs font-medium text-[var(--muted)]">Energy</th>
                    <th className="text-start py-2 px-3 text-xs font-medium text-[var(--muted)]">Mood</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 px-3 text-[var(--muted)]">{formatDateShort(m.date)}</td>
                      <td className="py-2 px-3">
                        {m.weightGrams != null
                          ? `${HEALTH_METRIC_CONFIG.weight.toDisplay(m.weightGrams)} kg`
                          : "–"}
                      </td>
                      <td className="py-2 px-3">
                        {m.temperatureCentidegrees != null
                          ? `${HEALTH_METRIC_CONFIG.temperature.toDisplay(m.temperatureCentidegrees)}°C`
                          : "–"}
                      </td>
                      <td className="py-2 px-3">{m.energy ?? "–"}</td>
                      <td className="py-2 px-3">{m.mood ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
