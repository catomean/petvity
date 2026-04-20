import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";

export default async function PetsPage() {
  const session = await auth();
  if (!session) return null;

  const db = getInstance();
  const userPets = await db.query.pets.findMany({
    where: eq(pets.ownerId, session.user.id),
    orderBy: [desc(pets.createdAt)],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">My Pets</h1>
        <Link href="/portal/pets/new" className="btn-primary text-sm">
          + Add pet
        </Link>
      </div>

      {userPets.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="text-5xl mb-4">🐾</div>
          <p className="text-[var(--muted)] mb-4">No pets yet.</p>
          <Link href="/portal/pets/new" className="btn-primary">
            Add your first pet
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {userPets.map((pet) => {
            const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];
            return (
              <Link
                key={pet.id}
                href={`/portal/pets/${pet.id}`}
                className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-center gap-4 hover:border-[var(--teal)] hover:shadow-sm transition-all no-underline"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
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
                  <div className="font-semibold text-[var(--ink)]">
                    {pet.name}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {speciesDef?.label ?? pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                    {pet.sex !== "unknown" ? ` · ${pet.sex}` : ""}
                  </div>
                </div>
                {pet.isPublic && (
                  <span className="text-xs bg-[var(--teal-light)] text-[var(--teal)] px-2 py-1 rounded-full">
                    Public
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
