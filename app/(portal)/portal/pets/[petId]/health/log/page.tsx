import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics } from "@/lib/db/schema";
import { and, eq, lt, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HEALTH_METRIC_CONFIG, getNormalRange } from "@/lib/config/health-metrics";
import type { SpeciesId } from "@/lib/config/species";
import { HealthLogForm } from "@/components/portal/HealthLogForm";
import { formatRelativeDate } from "@/lib/utils/format";
import { getTranslations } from "next-intl/server";
import { getPortalLocale } from "@/lib/i18n/portal-locale";

type Params = { params: Promise<{ petId: string }>; searchParams: Promise<{ date?: string }> };

export default async function LogHealthPage({ params, searchParams }: Params) {
  const session = await auth();
  if (!session) return null;

  const { petId } = await params;
  const { date: dateParam } = await searchParams;
  const db = getInstance();

  const locale = await getPortalLocale();
  const t = await getTranslations({ locale, namespace: "portal" });

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) notFound();

  const species = pet.species as SpeciesId;

  // Use date from query param (for editing past entries) or default to today
  const todayStr = new Date().toISOString().slice(0, 10);
  const targetDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr;
  const isEditing = targetDate !== todayStr;

  // Check if there's already a log for the target date so we can pre-fill the form
  const [existing, prevLog] = await Promise.all([
    db.query.healthMetrics.findFirst({
      where: and(eq(healthMetrics.petId, petId), eq(healthMetrics.date, targetDate)),
    }),
    // Most recent log BEFORE the target date — shown as context to help owners spot trends
    db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.petId, petId), lt(healthMetrics.date, targetDate)))
      .orderBy(desc(healthMetrics.date))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);
  const initialValues = existing
    ? {
        date: targetDate,
        weightKg: existing.weightGrams != null ? (existing.weightGrams / 1000).toString() : "",
        temperatureC: existing.temperatureCentidegrees != null ? (existing.temperatureCentidegrees / 100).toString() : "",
        heartRateBpm: existing.heartRateBpm?.toString() ?? "",
        energy: existing.energy?.toString() ?? "",
        mood: existing.mood?.toString() ?? "",
        anxiety: existing.anxiety?.toString() ?? "",
        socialization: existing.socialization?.toString() ?? "",
        notes: existing.notes ?? "",
      }
    // Pre-fill the date when editing a past date with no prior entry
    : isEditing
      ? {
          date: targetDate,
          weightKg: "", temperatureC: "", heartRateBpm: "",
          energy: "", mood: "", anxiety: "", socialization: "", notes: "",
        }
      : undefined;

  // Compute species-specific normal ranges in display units
  const weightRaw = getNormalRange("weight", species);
  const tempRaw = getNormalRange("temperature", species);
  const hrRaw = getNormalRange("heart_rate", species);

  const weightHint = {
    min: HEALTH_METRIC_CONFIG.weight.toDisplay(weightRaw.min),
    max: HEALTH_METRIC_CONFIG.weight.toDisplay(weightRaw.max),
    unit: "kg",
  };
  const tempHint = {
    min: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRaw.min),
    max: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRaw.max),
    unit: "°C",
  };
  const hrHint = {
    min: hrRaw.min,
    max: hrRaw.max,
    unit: "bpm",
  };

  return (
    <div className="max-w-lg">
      <Link
        href={`/portal/pets/${petId}/health`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("healthBack")}
      </Link>

      <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">
        {isEditing ? t("editPastEntry") : existing ? t("updateTodaysCheckin") : t("logHealthCheck")}
      </h1>
      <p className="text-sm text-[var(--muted)] mb-4">
        {isEditing
          ? t("editingEntryFor", { date: formatRelativeDate(targetDate, locale) })
          : existing
            ? t("alreadyLoggedToday")
            : t("logAsManyMetrics")}
      </p>

      {/* Previous log context — helps owners notice trends */}
      {prevLog && (() => {
        const parts: string[] = [];
        if (prevLog.weightGrams != null)
          parts.push(`${HEALTH_METRIC_CONFIG.weight.toDisplay(prevLog.weightGrams)} kg`);
        if (prevLog.temperatureCentidegrees != null)
          parts.push(`${HEALTH_METRIC_CONFIG.temperature.toDisplay(prevLog.temperatureCentidegrees)}°C`);
        if (prevLog.heartRateBpm != null)
          parts.push(`${prevLog.heartRateBpm} bpm`);
        return parts.length > 0 ? (
          <p className="text-xs text-[var(--muted)] bg-[var(--off)] border border-[var(--border)] rounded-lg px-3 py-2 mb-6">
            <span className="font-medium text-[var(--ink2)]">{t("lastLoggedContext", { date: formatRelativeDate(prevLog.date, locale) })}</span>
            {" "}{parts.join(" · ")}
          </p>
        ) : null;
      })()}

      <HealthLogForm
        petId={petId}
        petName={pet.name}
        weightHint={weightHint}
        tempHint={tempHint}
        hrHint={hrHint}
        initialValues={initialValues}
      />
    </div>
  );
}
