import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, healthMetrics, vaccinations } from "@/lib/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import Link from "next/link";
import { computePetSignal } from "@/lib/domain/pet-signal";
import { SIGNAL_LABELS, SIGNAL_BG_CLASSES, SIGNAL_STRIP_CLASSES } from "@/lib/config/pet-signal";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { Plus } from "lucide-react";

function greeting(name?: string | null) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${time}, ${name?.split(" ")[0] ?? "there"} 👋`;
}

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
        (v) =>
          v.nextDueDate &&
          v.nextDueDate < todayStr &&
          v.status !== "not_applicable",
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">
            {greeting(session.user.name)}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {userPets.length === 0
              ? "Add your first pet to get started"
              : `${userPets.length} pet${userPets.length !== 1 ? "s" : ""} in your family`}
          </p>
        </div>
        <Link href="/portal/pets/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add pet
        </Link>
      </div>

      {/* Empty state */}
      {petsWithSignals.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--teal-light)] flex items-center justify-center text-4xl mx-auto mb-5">
            🐾
          </div>
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
            Meet your first pet
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-xs mx-auto mb-6 leading-relaxed">
            Create a profile for your pet and start tracking their health,
            emotions, and wellbeing.
          </p>
          <Link href="/portal/pets/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add a pet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {petsWithSignals.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            const sig = pet.signal.signal;
            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}`}
                className="card overflow-hidden hover:shadow-md transition-all no-underline group block"
              >
                {/* Signal color strip */}
                <div className={`h-1 ${SIGNAL_STRIP_CLASSES[sig as keyof typeof SIGNAL_STRIP_CLASSES] ?? "bg-[var(--border)]"}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-[var(--light)] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
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
                    {/* Signal badge */}
                    <span className={SIGNAL_BG_CLASSES[sig as keyof typeof SIGNAL_BG_CLASSES]}>
                      {SIGNAL_LABELS[sig]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[var(--ink)] text-base group-hover:text-[var(--teal)] transition-colors mb-0.5">
                    {pet.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mb-3">
                    {speciesDef?.label ?? pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {pet.signal.reason}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* Add another pet card */}
          <Link
            href="/portal/pets/new"
            className="card border-dashed p-5 flex flex-col items-center justify-center gap-3 text-[var(--muted)] hover:text-[var(--teal)] hover:border-[var(--teal)] hover:bg-[var(--teal-light)] transition-all no-underline min-h-[168px]"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add another pet</span>
          </Link>
        </div>
      )}
    </div>
  );
}
