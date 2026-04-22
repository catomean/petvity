import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES } from "@/lib/config/pet-signal";
import type { SpeciesId } from "@/lib/config/species";
import type { PetWellnessSignal } from "@/lib/config/pet-signal";

export default async function CheckinPage() {
  const session = await auth();
  if (!session) return null;

  const db = getInstance();
  const userPets = await db.query.pets.findMany({
    where: eq(pets.ownerId, session.user.id),
    orderBy: [desc(pets.createdAt)],
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2">
        Daily check-in
      </h1>
      <p className="text-[var(--muted)] mb-6 text-sm">
        Select a pet to log today&apos;s health metrics.
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
          {userPets.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            const signal = (pet.lastKnownSignal ?? "healthy") as PetWellnessSignal;
            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}/health/log`}
                className="card card-hover p-4 flex items-center gap-4 hover:border-[var(--teal)] transition-all no-underline"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-2xl flex-shrink-0">
                  {speciesDef?.emoji ?? "🐾"}
                </div>

                {/* Name + species */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--ink)]">{pet.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {speciesDef?.label ?? pet.species}
                  </div>
                </div>

                {/* Signal badge */}
                <span className={`${SIGNAL_BG_CLASSES[signal]} flex-shrink-0 hidden sm:inline-flex`}>
                  {SIGNAL_LABELS[signal]}
                </span>

                <ChevronRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
