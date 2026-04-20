import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations } from "@/lib/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES } from "@/lib/config/pet-signal";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { formatDateShort } from "@/lib/utils/format";

type Params = { params: Promise<{ petId: string }> };

export default async function PetProfilePage({ params }: Params) {
  const session = await auth();
  if (!session) return null;

  const { petId } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) notFound();

  const now = new Date();
  const sinceStr = new Date(now.getTime() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const [recentMetrics, allVacc] = await Promise.all([
    db.query.healthMetrics.findMany({
      where: and(eq(healthMetrics.petId, pet.id), gte(healthMetrics.date, sinceStr)),
      orderBy: [desc(healthMetrics.date)],
    }),
    db.query.vaccinations.findMany({ where: eq(vaccinations.petId, pet.id) }),
  ]);

  const overdueCount = allVacc.filter(
    (v) => v.nextDueDate && v.nextDueDate < todayStr && v.status !== "not_applicable",
  ).length;

  const signalResult = computePetSignal({
    species: pet.species as SpeciesId,
    recentMetrics,
    overdueVaccinations: overdueCount,
    now,
  });

  const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];

  const tabs = [
    { label: "Health", href: `/portal/pets/${pet.id}/health` },
    { label: "Records", href: `/portal/pets/${pet.id}/records` },
    { label: "Vaccinations", href: `/portal/pets/${pet.id}/vaccinations` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-[var(--ink)]">
                {pet.name}
              </h1>
              <span className={SIGNAL_BG_CLASSES[signalResult.signal]}>
                {SIGNAL_LABELS[signalResult.signal]}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] mb-2">
              {speciesDef?.label ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {pet.sex !== "unknown" ? ` · ${pet.sex}` : ""}
              {pet.birthDate
                ? ` · Born ${formatDateShort(pet.birthDate)}`
                : ""}
            </p>
            {pet.bio && (
              <p className="text-sm text-[var(--ink2)]">{pet.bio}</p>
            )}
          </div>
          <Link
            href={`/portal/pets/${pet.id}/edit`}
            className="btn-outline text-sm"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Signal reason */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-[var(--ink2)]">{signalResult.reason}</span>
        <Link
          href={`/portal/pets/${pet.id}/health/log`}
          className="btn-primary text-sm"
        >
          Log today
        </Link>
      </div>

      {/* Quick nav tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="bg-white border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)] no-underline transition-all"
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
