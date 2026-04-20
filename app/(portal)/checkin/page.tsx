import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";

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
        Select a pet to log today's health metrics.
      </p>

      {userPets.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--border)] p-10 text-center">
          <p className="text-[var(--muted)] mb-4">No pets yet.</p>
          <Link href="/portal/pets/new" className="btn-primary">
            Add a pet
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-sm">
          {userPets.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}/health/log`}
                className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-center gap-4 hover:border-[var(--teal)] hover:shadow-sm transition-all no-underline"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-2xl flex-shrink-0">
                  {speciesDef?.emoji ?? "🐾"}
                </div>
                <div>
                  <div className="font-medium text-[var(--ink)]">{pet.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {speciesDef?.label ?? pet.species}
                  </div>
                </div>
                <div className="ms-auto text-[var(--teal)] text-sm">Log →</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
