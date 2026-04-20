import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations } from "@/lib/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import Link from "next/link";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES } from "@/lib/config/pet-signal";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const db = getInstance();
  const userPets = await db.query.pets.findMany({
    where: eq(pets.ownerId, session.user.id),
    orderBy: [desc(pets.createdAt)],
  });

  const now = new Date();
  const sinceStr = new Date(now.getTime() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  // Compute signal for each pet
  const petsWithSignals = await Promise.all(
    userPets.map(async (pet) => {
      const recentMetrics = await db.query.healthMetrics.findMany({
        where: (t, { and, eq: eqFn, gte: gteFn }) =>
          and(eqFn(t.petId, pet.id), gteFn(t.date, sinceStr)),
        orderBy: [desc(healthMetrics.date)],
      });
      const allVacc = await db.query.vaccinations.findMany({
        where: eq(vaccinations.petId, pet.id),
      });
      const overdueCount = allVacc.filter(
        (v) => v.nextDueDate && v.nextDueDate < todayStr && v.status !== "not_applicable",
      ).length;

      const signal = computePetSignal({
        species: pet.species as SpeciesId,
        recentMetrics,
        overdueVaccinations: overdueCount,
        now,
      });

      return { ...pet, signal };
    }),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <Link href="/portal/pets/new" className="btn-primary text-sm">
          + Add pet
        </Link>
      </div>

      {petsWithSignals.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="text-lg font-medium text-[var(--ink)] mb-2">
            Add your first pet
          </h2>
          <p className="text-[var(--muted)] mb-6">
            Create a profile for your pet and start tracking their health.
          </p>
          <Link href="/portal/pets/new" className="btn-primary">
            Add a pet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {petsWithSignals.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}`}
                className="bg-white rounded-xl border border-[var(--border)] p-5 hover:border-[var(--teal)] hover:shadow-sm transition-all no-underline group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-2xl overflow-hidden">
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
                    <div>
                      <div className="font-semibold text-[var(--ink)] group-hover:text-[var(--teal)]">
                        {pet.name}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {speciesDef?.label ?? pet.species}
                        {pet.breed ? ` · ${pet.breed}` : ""}
                      </div>
                    </div>
                  </div>
                  <span
                    className={
                      SIGNAL_BG_CLASSES[
                        pet.signal.signal as keyof typeof SIGNAL_BG_CLASSES
                      ]
                    }
                  >
                    {SIGNAL_LABELS[pet.signal.signal]}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] line-clamp-2">
                  {pet.signal.reason}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
