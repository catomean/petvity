import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations } from "@/lib/db/schema";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import Link from "next/link";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { computeDigitalTwin } from "@/lib/domain/digital-twin";
import { SIGNAL_BG_CLASSES, SIGNAL_STRIP_CLASSES, SIGNAL_SORT_ORDER, SIGNAL_METRIC_WINDOW_DAYS } from "@/lib/config/pet-signal";
import type { PetWellnessSignal } from "@/lib/config/pet-signal";
import { TWIN_STATE_CONFIG, TWIN_TREND_CONFIG } from "@/lib/config/digital-twin";
import { SPECIES_CONFIG } from "@/lib/config/species";
import { countOverdueVaccinations } from "@/lib/config/vaccinations";
import type { SpeciesId } from "@/lib/config/species";
import type { TwinTrend } from "@/lib/domain/digital-twin";
import { Plus, PawPrint, TrendingUp, TrendingDown, Minus, CalendarDays, AlertTriangle, Stethoscope, Syringe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPortalLocale } from "@/lib/i18n/portal-locale";

// Icon mapping stays component-side (React components are UI, not config)
const TREND_ICONS: Record<TwinTrend, React.ComponentType<{ className?: string }>> = {
  improving:         TrendingUp,
  stable:            Minus,
  declining:         TrendingDown,
  insufficient_data: Minus,
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const locale = await getPortalLocale();
  const [t, tSignal, tTwin, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "portal" }),
    getTranslations({ locale, namespace: "signal" }),
    getTranslations({ locale, namespace: "twin" }),
    getTranslations({ locale, namespace: "public" }),
  ]);

  const db = getInstance();
  const userPets = await db
    .select()
    .from(pets)
    .where(eq(pets.ownerId, session.user.id))
    .orderBy(desc(pets.createdAt));

  const now = new Date();
  const sinceStr = new Date(now.getTime() - SIGNAL_METRIC_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const petIds = userPets.map((p) => p.id);

  // Batch-fetch metrics + vaccinations for all pets in 2 queries (not N×2)
  const [allMetrics, allVacc] = petIds.length > 0
    ? await Promise.all([
        db
          .select()
          .from(healthMetrics)
          .where(and(inArray(healthMetrics.petId, petIds), gte(healthMetrics.date, sinceStr)))
          .orderBy(desc(healthMetrics.date)),
        db.select().from(vaccinations).where(inArray(vaccinations.petId, petIds)),
      ])
    : [[], []];

  // Group in memory by petId
  const metricsByPet = new Map<string, typeof allMetrics>();
  for (const m of allMetrics) {
    const arr = metricsByPet.get(m.petId) ?? [];
    arr.push(m);
    metricsByPet.set(m.petId, arr);
  }

  const vaccByPet = new Map<string, typeof allVacc>();
  for (const v of allVacc) {
    const arr = vaccByPet.get(v.petId) ?? [];
    arr.push(v);
    vaccByPet.set(v.petId, arr);
  }

  const petsWithData = userPets.map((pet) => {
    const recentMetrics = metricsByPet.get(pet.id) ?? [];
    const petVacc = vaccByPet.get(pet.id) ?? [];
    const overdueCount = countOverdueVaccinations(petVacc, todayStr);

    const signal = computePetSignal({ species: pet.species as SpeciesId, recentMetrics, overdueVaccinations: overdueCount, now });
    const twin   = computeDigitalTwin(recentMetrics, now);

    return { ...pet, signal, twin, overdueCount };
  });

  // Sort: concern first, then watch, then healthy
  petsWithData.sort((a, b) => {
    const aOrder = SIGNAL_SORT_ORDER[a.signal.signal as PetWellnessSignal] ?? 3;
    const bOrder = SIGNAL_SORT_ORDER[b.signal.signal as PetWellnessSignal] ?? 3;
    return aOrder - bOrder;
  });

  const loggedToday = petsWithData.filter((p) => p.twin.daysAgo === 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">
            {t(new Date().getHours() < 12 ? "greetingMorning" : new Date().getHours() < 18 ? "greetingAfternoon" : "greetingEvening", { name: session.user.name?.split(" ")[0] ?? "" })}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {userPets.length === 0
              ? t("checkinNoPets")
              : loggedToday === userPets.length
                ? t("allCheckedIn", { total: userPets.length })
                : loggedToday > 0
                  ? (
                    <>
                      {t("partialCheckedIn", { done: loggedToday, total: userPets.length })}
                      {" · "}
                      <Link href="/portal/checkin" className="text-[var(--teal)] hover:underline">{t("logRemaining")}</Link>
                    </>
                  )
                  : (
                    <>
                      {t("partialCheckedIn", { done: 0, total: userPets.length })}
                      {" · "}
                      <Link href="/portal/checkin" className="text-[var(--teal)] hover:underline">{t("logTodayCheckin")}</Link>
                    </>
                  )}
          </p>
        </div>
        <Link href="/portal/pets/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          {t("addPetButton")}
        </Link>
      </div>

      {/* Empty state */}
      {petsWithData.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-5">
            <PawPrint className="w-9 h-9 text-[var(--teal)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">{t("meetFirstPet")}</h2>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto mb-6 leading-relaxed">
            {t("meetFirstPetDesc")}
          </p>
          <Link href="/portal/pets/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            {t("addFirstPet")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {petsWithData.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            const sig = pet.signal.signal;
            const twin = pet.twin;
            const twinCfg = TWIN_STATE_CONFIG[twin.id];
            const needsCheckin = twin.daysAgo === null || twin.daysAgo > 0;

            const TrendIcon = TREND_ICONS[twin.trend];
            const trendColor = TWIN_TREND_CONFIG[twin.trend].color;

            return (
              /* Overlay-link pattern: outer div is the card; absolute <Link> covers the whole
                 card for the primary navigation; secondary links sit relative/z-10 above it.
                 This avoids nested <a> tags (invalid HTML) while keeping the whole card clickable. */
              <div
                key={pet.id}
                className="card overflow-hidden hover:shadow-md transition-all group relative"
              >
                {/* Primary card link — covers the full card */}
                <Link
                  href={`/portal/pets/${pet.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`View ${pet.name}`}
                />

                {/* Signal strip */}
                <div className={`h-1 ${SIGNAL_STRIP_CLASSES[sig as keyof typeof SIGNAL_STRIP_CLASSES] ?? "bg-[var(--border)]"}`} />

                <div className="p-5">
                  {/* Row 1: avatar + signal badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--light)] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                      {pet.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pet.avatarUrl} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        speciesDef?.emoji ?? "🐾"
                      )}
                    </div>
                    <span className={SIGNAL_BG_CLASSES[sig as keyof typeof SIGNAL_BG_CLASSES]}>
                      {tSignal(sig)}
                    </span>
                  </div>

                  {/* Row 2: name + species */}
                  <h3 className="font-semibold text-[var(--ink)] text-base group-hover:text-[var(--teal)] transition-colors mb-0.5">
                    {pet.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mb-3">
                    {tPub(`species_${pet.species}` as Parameters<typeof tPub>[0])}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>

                  {/* Row 3: twin mini-bar OR "Log today" shortcut */}
                  {needsCheckin ? (
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/portal/pets/${pet.id}/health/log`}
                        className="relative z-10 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors no-underline"
                      >
                        <CalendarDays className="w-3 h-3" />
                        {t("logToday")}
                      </Link>
                      {twin.daysAgo !== null && twin.daysAgo > 0 && (
                        <span className="text-[11px] text-[var(--muted)]">
                          {t("daysAgo", { count: twin.daysAgo })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${twinCfg.text}`}>
                            {tTwin(twin.id)}
                          </span>
                          {twin.trend !== "insufficient_data" && (
                            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                          )}
                        </div>
                        <span className="text-xs text-[var(--muted)] tabular-nums">
                          {twin.scorePercent}/100
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--border)]">
                        <div
                          className={`h-1.5 rounded-full ${twinCfg.barColor}`}
                          style={{ width: `${twin.scorePercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Signal reason + action links — shown when watch/concern */}
                  {sig !== "healthy" && pet.signal.reason && (
                    <div className={`flex items-start gap-1.5 mt-2 text-xs ${sig === "concern" ? "text-[var(--danger-text)]" : "text-[var(--warn-text)]"}`}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{pet.signal.reason}</span>
                    </div>
                  )}
                  {sig !== "healthy" && (
                    <div className="flex gap-3 mt-2 relative z-10 flex-wrap">
                      <Link
                        href={`/portal/pets/${pet.id}/health/log`}
                        className="text-xs font-medium text-[var(--teal)] hover:underline"
                      >
                        {t("logHealth")}
                      </Link>
                      {pet.overdueCount > 0 && (
                        <Link
                          href={`/portal/pets/${pet.id}/vaccinations`}
                          className="text-xs font-medium text-[var(--warn-text)] hover:underline flex items-center gap-0.5"
                        >
                          <Syringe className="w-3 h-3" />
                          {t("updateVaccinations")}
                        </Link>
                      )}
                      {pet.signal.outOfRangeMetrics.length > 0 && (
                        <Link
                          href="/portal/find"
                          className="text-xs font-medium text-[var(--muted)] hover:text-[var(--teal)] hover:underline flex items-center gap-0.5"
                        >
                          <Stethoscope className="w-3 h-3" />
                          {t("findAVet")}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add another */}
          <Link
            href="/portal/pets/new"
            className="card border-dashed p-5 flex flex-col items-center justify-center gap-3 text-[var(--muted)] hover:text-[var(--teal)] hover:border-[var(--teal)] hover:bg-[var(--teal-light)] transition-all no-underline min-h-[168px]"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{t("addAnotherPet")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
