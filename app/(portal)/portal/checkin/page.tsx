import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics } from "@/lib/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { CalendarDays, ChevronRight, CheckCircle } from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES, SIGNAL_SORT_ORDER } from "@/lib/config/pet-signal";
import type { SpeciesId } from "@/lib/config/species";
import type { PetWellnessSignal } from "@/lib/config/pet-signal";

export default async function CheckinPage() {
  const session = await auth();
  if (!session) return null;

  const db = getInstance();
  const todayStr = new Date().toISOString().slice(0, 10);

  const userPets = await db.query.pets.findMany({
    where: eq(pets.ownerId, session.user.id),
    orderBy: [desc(pets.createdAt)],
  });

  const petIds = userPets.map((p) => p.id);

  // One query to find which pets already have today's log entry
  const todayRows = petIds.length > 0
    ? await db
        .select({ petId: healthMetrics.petId })
        .from(healthMetrics)
        .where(and(inArray(healthMetrics.petId, petIds), eq(healthMetrics.date, todayStr)))
    : [];

  const checkedInToday = new Set(todayRows.map((r) => r.petId));

  // Pending first (sorted by signal severity: concern → watch → healthy), then done
  const sorted = [...userPets].sort((a, b) => {
    const aDone = checkedInToday.has(a.id);
    const bDone = checkedInToday.has(b.id);
    if (aDone !== bDone) return aDone ? 1 : -1;
    // Within the same done/pending group, sort by signal severity
    const aOrder = SIGNAL_SORT_ORDER[(a.lastKnownSignal ?? "healthy") as PetWellnessSignal] ?? 2;
    const bOrder = SIGNAL_SORT_ORDER[(b.lastKnownSignal ?? "healthy") as PetWellnessSignal] ?? 2;
    return aOrder - bOrder;
  });

  const pendingCount = userPets.length - checkedInToday.size;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Daily check-in</h1>
      <p className="text-[var(--muted)] mb-6 text-sm">
        {userPets.length === 0
          ? "Add a pet to start logging health data."
          : pendingCount === 0
            ? `All ${userPets.length} pet${userPets.length !== 1 ? "s" : ""} checked in today ✓`
            : `${pendingCount} of ${userPets.length} pet${userPets.length !== 1 ? "s" : ""} still need${pendingCount === 1 ? "s" : ""} a check-in`}
      </p>

      {userPets.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">No pets yet</p>
          <p className="text-sm text-[var(--muted)] mb-5">Add a pet to start logging health data.</p>
          <Link href="/portal/pets/new" className="btn-primary">
            Add a pet
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-lg">
          {sorted.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            const signal = (pet.lastKnownSignal ?? "healthy") as PetWellnessSignal;
            const done = checkedInToday.has(pet.id);

            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}/health/log`}
                className={`card p-4 flex items-center gap-4 transition-all no-underline ${
                  done
                    ? "opacity-60 hover:opacity-80"
                    : "hover:border-[var(--teal)] hover:shadow-sm"
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {pet.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={pet.avatarUrl} alt={pet.name} className="w-full h-full object-cover" />
                    : speciesDef?.emoji ?? "🐾"}
                </div>

                {/* Name + species */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--ink)]">{pet.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {speciesDef?.label ?? pet.species}
                  </div>
                </div>

                {/* Status */}
                {done ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--green)] flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Logged today
                  </span>
                ) : (
                  <span className={`${SIGNAL_BG_CLASSES[signal]} flex-shrink-0 hidden sm:inline-flex`}>
                    {SIGNAL_LABELS[signal]}
                  </span>
                )}

                <ChevronRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
