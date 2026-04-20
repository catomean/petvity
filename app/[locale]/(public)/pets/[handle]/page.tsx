import { notFound } from "next/navigation";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { APP } from "@/lib/config/app";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { formatDateShort } from "@/lib/utils/format";
import Link from "next/link";

type Params = { params: Promise<{ handle: string; locale: string }> };

export default async function PublicPetPage({ params }: Params) {
  const { handle } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.handle, handle), eq(pets.isPublic, true)),
  });
  if (!pet) notFound();

  const speciesDef = SPECIES_CONFIG[pet.species as SpeciesId];

  return (
    <div className="min-h-screen bg-[var(--off)]">
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <Link href="/en" className="font-bold text-[var(--teal)] text-lg no-underline">
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
            <p className="text-sm text-[var(--muted)]">
              {speciesDef?.label ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {pet.sex !== "unknown" ? ` · ${pet.sex}` : ""}
              {pet.birthDate
                ? ` · Born ${formatDateShort(pet.birthDate)}`
                : ""}
            </p>
            {pet.bio && (
              <p className="mt-4 text-sm text-[var(--ink2)]">{pet.bio}</p>
            )}
          </div>

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
            Track your own pet's health on {APP.name}
          </p>
          <Link href="/register" className="btn-primary">
            Get started free
          </Link>
        </div>
      </div>
    </div>
  );
}
