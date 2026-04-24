import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics } from "@/lib/db/schema";
import { eq, desc, inArray, max } from "drizzle-orm";
import Link from "next/link";
import { SPECIES_CONFIG, SEX_LABELS } from "@/lib/config/species";
import type { SpeciesId, SexId } from "@/lib/config/species";
import {
  SIGNAL_BG_CLASSES,
  SIGNAL_LABELS,
} from "@/lib/config/pet-signal";
import type { PetWellnessSignal } from "@/lib/config/pet-signal";
import { formatRelativeDate } from "@/lib/utils/format";
import { Plus, ChevronRight, PawPrint } from "lucide-react";

export default async function PetsPage() {
  const session = await auth();
  if (!session) return null;

  const db = getInstance();
  const userPets = await db.query.pets.findMany({
    where: eq(pets.ownerId, session.user.id),
    orderBy: [desc(pets.createdAt)],
  });

  // Batch-fetch latest check-in date per pet (one query, no N+1)
  const petIds = userPets.map((p) => p.id);
  const lastLogRows = petIds.length > 0
    ? await db
        .select({ petId: healthMetrics.petId, lastDate: max(healthMetrics.date) })
        .from(healthMetrics)
        .where(inArray(healthMetrics.petId, petIds))
        .groupBy(healthMetrics.petId)
    : [];
  const lastLogMap = new Map(lastLogRows.map((r) => [r.petId, r.lastDate]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">My Pets</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {userPets.length === 0
              ? "Add your first pet to get started"
              : `${userPets.length} pet${userPets.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/portal/pets/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add pet
        </Link>
      </div>

      {userPets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-5">
            <PawPrint className="w-9 h-9 text-[var(--teal)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
            No pets yet
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-xs mx-auto">
            Create profiles for each of your pets to start tracking their health.
          </p>
          <Link href="/portal/pets/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add your first pet
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {userPets.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            const sig = pet.lastKnownSignal as PetWellnessSignal | null;
            const lastDate = lastLogMap.get(pet.id) ?? null;
            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}`}
                className="card p-4 flex items-center gap-4 hover:border-[var(--teal)] hover:shadow-md transition-all no-underline group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--light)] flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
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
                  <p className="font-semibold text-[var(--ink)] group-hover:text-[var(--teal)] transition-colors">
                    {pet.name}
                  </p>
                  <p className="text-sm text-[var(--muted)] truncate">
                    {speciesDef?.label ?? pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                    {pet.sex !== "unknown" ? ` · ${SEX_LABELS[pet.sex as SexId] ?? pet.sex}` : ""}
                  </p>
                  {lastDate && (
                    <p className="text-xs text-[var(--faint)] mt-0.5">
                      Last check-in {formatRelativeDate(lastDate)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sig && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SIGNAL_BG_CLASSES[sig]}`}>
                      {SIGNAL_LABELS[sig]}
                    </span>
                  )}
                  {pet.isPublic && (
                    <span className="text-xs bg-[var(--teal-light)] text-[var(--teal)] px-2.5 py-1 rounded-full font-medium hidden sm:inline">
                      Public
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--faint)] group-hover:text-[var(--teal)] transition-colors" />
                </div>
              </Link>
            );
          })}

          {/* Add another */}
          <Link
            href="/portal/pets/new"
            className="card p-4 flex items-center gap-4 border-dashed text-[var(--muted)] hover:text-[var(--teal)] hover:border-[var(--teal)] hover:bg-[var(--teal-light)] transition-all no-underline"
          >
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add another pet</span>
          </Link>
        </div>
      )}
    </div>
  );
}
