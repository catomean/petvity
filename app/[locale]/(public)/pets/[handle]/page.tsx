import { notFound } from "next/navigation";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics } from "@/lib/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { APP, APP_URL } from "@/lib/config/app";
import { SPECIES_CONFIG, SEX_LABELS } from "@/lib/config/species";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES } from "@/lib/config/pet-signal";
import { TWIN_STATE_CONFIG } from "@/lib/config/digital-twin";
import type { SpeciesId, SexId } from "@/lib/config/species";
import type { PetWellnessSignal } from "@/lib/config/pet-signal";
import { computeDigitalTwin } from "@/lib/domain/digital-twin";
import { formatDateShort } from "@/lib/utils/format";
import Link from "next/link";
import type { Metadata } from "next";

/** Cache public pet profiles for 60 s (ISR stale-while-revalidate). */
export const revalidate = 60;

type Params = { params: Promise<{ handle: string; locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle, locale } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.handle, handle), eq(pets.isPublic, true)),
  });
  if (!pet) return { title: APP.name };

  const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
  const speciesLabel = speciesDef?.label ?? pet.species;
  const title = `${pet.name} · ${APP.name}`;
  const description = [
    speciesLabel,
    pet.breed,
    pet.bio,
  ].filter(Boolean).join(" · ") || `${pet.name} is on ${APP.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${locale}/pets/${handle}`,
      siteName: APP.name,
      type: "profile",
      ...(pet.avatarUrl ? { images: [{ url: pet.avatarUrl, alt: pet.name }] } : {}),
    },
    twitter: {
      card: pet.avatarUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(pet.avatarUrl ? { images: [pet.avatarUrl] } : {}),
    },
  };
}

export default async function PublicPetPage({ params }: Params) {
  const { handle, locale } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.handle, handle), eq(pets.isPublic, true)),
  });
  if (!pet) notFound();

  const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
  const signal = (pet.lastKnownSignal ?? "healthy") as PetWellnessSignal;

  // Fetch recent metrics to power the digital twin
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const recentMetrics = await db.query.healthMetrics.findMany({
    where: and(eq(healthMetrics.petId, pet.id), gte(healthMetrics.date, since30)),
    orderBy: [desc(healthMetrics.date)],
  });
  const twin = computeDigitalTwin(recentMetrics);
  const twinCfg = TWIN_STATE_CONFIG[twin.id];

  return (
    <div className="min-h-screen bg-[var(--off)]">
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-bold text-[var(--teal)] text-lg no-underline">
          {APP.name}
        </Link>
        <Link href="/register" className="btn-primary text-sm py-2 px-4">
          Track your pet
        </Link>
      </nav>

      {/* Profile */}
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
          {/* Avatar header */}
          <div className="bg-[var(--teal)] h-28 flex items-end justify-center pb-0 relative">
            <div className="absolute bottom-0 translate-y-1/2 w-24 h-24 rounded-full bg-[var(--teal-light)] border-4 border-white flex items-center justify-center text-4xl overflow-hidden">
              {pet.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pet.avatarUrl}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                speciesDef?.emoji ?? "🐾"
              )}
            </div>
          </div>

          {/* Info */}
          <div className="pt-16 pb-6 px-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--ink)]">{pet.name}</h1>
            {pet.handle && (
              <p className="text-sm text-[var(--muted)] mb-2">@{pet.handle}</p>
            )}
            <span className={`${SIGNAL_BG_CLASSES[signal]} mt-1 mb-2`}>
              {SIGNAL_LABELS[signal]}
            </span>
            <p className="text-sm text-[var(--muted)] mt-2">
              {speciesDef?.label ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {pet.sex !== "unknown" ? ` · ${SEX_LABELS[pet.sex as SexId] ?? pet.sex}` : ""}
              {pet.birthDate
                ? ` · Born ${formatDateShort(pet.birthDate)}`
                : ""}
            </p>
            {pet.bio && (
              <p className="mt-4 text-sm text-[var(--ink2)]">{pet.bio}</p>
            )}
          </div>

          {/* Digital twin — only shown when data exists */}
          {twin.id !== "no_data" && (
            <div className={`border-t border-[var(--border)] px-6 py-5 ${twinCfg.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-sm font-semibold ${twinCfg.text}`}>{twinCfg.label}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{twin.summary}</p>
                </div>
                <span className={`text-2xl font-extrabold tabular-nums ${twinCfg.text}`}>
                  {twin.scorePercent}
                  <span className="text-sm font-normal text-[var(--muted)] ms-1">/ 100</span>
                </span>
              </div>
              {/* Overall bar */}
              <div className="h-2 rounded-full bg-[var(--border)] mb-4">
                <div
                  className={`h-2 rounded-full ${twinCfg.barColor}`}
                  style={{ width: `${twin.scorePercent}%` }}
                />
              </div>
              {/* Metric bars */}
              {twin.metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {twin.metrics.map((m) => (
                    <div key={m.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--muted)]">{m.label}</span>
                        <span className="text-[var(--ink2)]">{m.valueLabel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--border)]">
                        <div
                          className={`h-1.5 rounded-full ${twinCfg.barColor}`}
                          style={{ width: `${m.fillPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Species info */}
          {speciesDef && (
            <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--off)] text-sm text-center text-[var(--muted)]">
              Typical lifespan: {speciesDef.typicalLifespanYears.min}–
              {speciesDef.typicalLifespanYears.max} years
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted)] mb-3">
            Track your own pet&apos;s health on {APP.name}
          </p>
          <Link href="/register" className="btn-primary">
            Get started free
          </Link>
        </div>
      </div>
    </div>
  );
}
