import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations, medications } from "@/lib/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { computeDigitalTwin } from "@/lib/domain/digital-twin";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES, SIGNAL_HERO_BG } from "@/lib/config/pet-signal";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { formatDateShort } from "@/lib/utils/format";
import { Activity, Syringe, FileText, Pill, Pencil, ChevronLeft, CalendarDays, Heart, Stethoscope } from "lucide-react";
import { DigitalTwinCard } from "@/components/portal/DigitalTwinCard";

type Params = { params: Promise<{ petId: string }> };

function ageString(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) return "< 1 month old";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} old`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} old`;
}

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

  const [recentMetrics, allVacc, activeMeds] = await Promise.all([
    db.query.healthMetrics.findMany({
      where: and(eq(healthMetrics.petId, pet.id), gte(healthMetrics.date, sinceStr)),
      orderBy: [desc(healthMetrics.date)],
    }),
    db.query.vaccinations.findMany({ where: eq(vaccinations.petId, pet.id) }),
    db.query.medications.findMany({
      where: and(eq(medications.petId, pet.id), eq(medications.status, "active")),
    }),
  ]);

  const overdueCount = allVacc.filter(
    (v) =>
      v.nextDueDate &&
      v.nextDueDate < todayStr &&
      v.status !== "not_applicable",
  ).length;

  const signalResult = computePetSignal({
    species: pet.species as SpeciesId,
    recentMetrics,
    overdueVaccinations: overdueCount,
    now,
  });

  const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
  const sig = signalResult.signal;
  const age = ageString(pet.birthDate ?? null);

  const twin = computeDigitalTwin(recentMetrics, now);

  const tabLinks = [
    {
      href: `/portal/pets/${pet.id}/health`,
      icon: Activity,
      label: "Health",
      desc: "Metrics & charts",
    },
    {
      href: `/portal/pets/${pet.id}/records`,
      icon: FileText,
      label: "Records",
      desc: "Vet visits",
    },
    {
      href: `/portal/pets/${pet.id}/vaccinations`,
      icon: Syringe,
      label: "Vaccinations",
      desc: `${allVacc.length} logged`,
    },
    {
      href: `/portal/pets/${pet.id}/medications`,
      icon: Pill,
      label: "Medications",
      desc: activeMeds.length > 0 ? `${activeMeds.length} active` : "None active",
    },
  ];

  return (
    <div>
      {/* Back */}
      <Link
        href="/portal/pets"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        My Pets
      </Link>

      {/* Hero header */}
      <div
        className={`card overflow-hidden mb-6 bg-gradient-to-b ${SIGNAL_HERO_BG[sig as keyof typeof SIGNAL_HERO_BG] ?? ""}`}
      >
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl lg:rounded-3xl bg-white shadow-sm flex items-center justify-center text-4xl lg:text-5xl overflow-hidden flex-shrink-0 border border-[var(--border)]">
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

              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold text-[var(--ink)]">
                    {pet.name}
                  </h1>
                  <span className={SIGNAL_BG_CLASSES[sig as keyof typeof SIGNAL_BG_CLASSES]}>
                    {SIGNAL_LABELS[sig]}
                  </span>
                </div>

                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {speciesDef?.label ?? pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                  {pet.sex !== "unknown" ? ` · ${pet.sex}` : ""}
                  {age ? ` · ${age}` : pet.birthDate ? ` · Born ${formatDateShort(pet.birthDate)}` : ""}
                </p>

                {pet.bio && (
                  <p className="text-sm text-[var(--ink2)] mt-2 max-w-md">
                    {pet.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Edit button */}
            <Link
              href={`/portal/pets/${pet.id}/edit`}
              className="btn-outline text-sm flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          </div>

          {/* Signal reason + CTAs */}
          <div className="mt-5 pt-5 border-t border-white/60 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[var(--ink2)] flex-1">
              {signalResult.reason}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* When signal is watch or concern, surface a direct path to book a vet */}
              {sig !== "healthy" && (
                <Link
                  href="/portal/find"
                  className="btn-outline text-sm"
                >
                  <Stethoscope className="w-4 h-4" />
                  Find a vet
                </Link>
              )}
              <Link
                href={`/portal/pets/${pet.id}/health/log`}
                className="btn-primary text-sm"
              >
                <CalendarDays className="w-4 h-4" />
                Log today
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Twin */}
      <DigitalTwinCard twin={twin} petId={pet.id} petName={pet.name} />

      {/* Section tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {tabLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 hover:border-[var(--teal)] hover:bg-[var(--teal-light)] transition-all no-underline group"
          >
            <Icon className="w-5 h-5 text-[var(--teal)] mb-2" />
            <p className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--teal)]">
              {label}
            </p>
            <p className="text-xs text-[var(--muted)]">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Adoption shortcut */}
      <Link
        href={`/portal/pets/${pet.id}/list-for-adoption`}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)] hover:border-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors no-underline"
      >
        <Heart className="w-4 h-4 flex-shrink-0" />
        List {pet.name} for adoption
      </Link>
    </div>
  );
}
