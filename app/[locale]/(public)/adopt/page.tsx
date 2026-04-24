import { getInstance } from "@/lib/db";
import { adoptionListings, pets } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { APP } from "@/lib/config/app";
import { LISTING_TRAIT_CONFIG } from "@/lib/config/adoptions";
import { SPECIES_CONFIG, SEX_LABELS } from "@/lib/config/species";
import type { SpeciesId, SexId } from "@/lib/config/species";
import { Heart, MapPin, PawPrint } from "lucide-react";
import { formatPetAgeShort } from "@/lib/utils/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Adopt a Pet · ${APP.name}`,
  description: "Find dogs, cats, and other pets looking for a loving home.",
};

/** Cache adoption listings for 30 s — listings update more frequently. */
export const revalidate = 30;

type Params = { params: Promise<{ locale: string }> };

function speciesEmoji(species: string): string {
  return SPECIES_CONFIG[species as SpeciesId]?.emoji ?? "🐾";
}

function feeLabel(feeCents: number | null): string {
  return feeCents === null ? "Free" : `$${(feeCents / 100).toFixed(0)}`;
}

export default async function PublicAdoptPage({ params }: Params) {
  const { locale } = await params;
  const db = getInstance();

  const listings = await db
    .select({
      id: adoptionListings.id,
      title: adoptionListings.title,
      feeCents: adoptionListings.feeCents,
      location: adoptionListings.location,
      requiresExperience: adoptionListings.requiresExperience,
      goodWithKids: adoptionListings.goodWithKids,
      goodWithDogs: adoptionListings.goodWithDogs,
      goodWithCats: adoptionListings.goodWithCats,
      createdAt: adoptionListings.createdAt,
      pet: {
        id: pets.id,
        name: pets.name,
        species: pets.species,
        breed: pets.breed,
        birthDate: pets.birthDate,
        sex: pets.sex,
        avatarUrl: pets.avatarUrl,
        handle: pets.handle,
      },
    })
    .from(adoptionListings)
    .innerJoin(pets, eq(pets.id, adoptionListings.petId))
    .where(eq(adoptionListings.status, "available"))
    .orderBy(desc(adoptionListings.createdAt))
    .limit(100);

  return (
    <div className="min-h-screen bg-[var(--off)]">
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href={`/${locale}`} className="font-bold text-[var(--teal)] text-lg no-underline flex items-center gap-2">
          <PawPrint className="w-5 h-5" />
          {APP.name}
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--ink2)] hover:text-[var(--teal)] no-underline transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            Join free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3">
            Find your new best friend
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto mb-6">
            Pets looking for a loving forever home. No fees to browse — just heart.
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2">
            <Heart className="w-4 h-4" />
            List a pet for adoption
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-3">🐾</p>
            <p className="font-medium text-[var(--ink)] mb-1">No pets listed yet</p>
            <p className="text-sm text-[var(--muted)] mb-5">
              Be the first to help a pet find a home.
            </p>
            <Link href="/register" className="btn-primary">
              Create a listing
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-5">
              {listings.length} {listings.length === 1 ? "pet" : "pets"} looking for a home
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => {
                const emoji = speciesEmoji(listing.pet.species);
                const age = formatPetAgeShort(listing.pet.birthDate);
                return (
                  <Link
                    key={listing.id}
                    href={`/${locale}/adopt/${listing.id}`}
                    className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow no-underline group"
                  >
                    {/* Photo */}
                    <div className="aspect-[4/3] bg-[var(--teal-light)] flex items-center justify-center text-5xl relative overflow-hidden">
                      {listing.pet.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.pet.avatarUrl}
                          alt={listing.pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{emoji}</span>
                      )}
                      <div className="absolute top-2 end-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-xs font-medium text-[var(--ink2)]">
                        {feeLabel(listing.feeCents)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="font-semibold text-[var(--ink)] truncate group-hover:text-[var(--teal)] transition-colors">
                        {listing.pet.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {SPECIES_CONFIG[listing.pet.species as SpeciesId]?.label ?? listing.pet.species}
                        {listing.pet.breed ? ` · ${listing.pet.breed}` : ""}
                        {age ? ` · ${age}` : ""}
                        {listing.pet.sex && listing.pet.sex !== "unknown" ? ` · ${SEX_LABELS[listing.pet.sex as SexId] ?? listing.pet.sex}` : ""}
                      </p>
                      {listing.location && (
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {listing.location}
                        </p>
                      )}
                      {/* Trait pills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {LISTING_TRAIT_CONFIG.map((t) =>
                          listing[t.field] ? (
                            <span key={t.field} className={`text-[10px] font-medium ${t.className} px-2 py-0.5 rounded-full`}>
                              {t.shortLabel}
                            </span>
                          ) : null,
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CTA footer */}
      <div className="border-t border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <p className="font-medium text-[var(--ink)] mb-2">Have a pet looking for a home?</p>
          <p className="text-sm text-[var(--muted)] mb-5">
            Create a free account to list your pet and reach families ready to adopt.
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2">
            <PawPrint className="w-4 h-4" />
            List a pet — it&apos;s free
          </Link>
        </div>
      </div>
    </div>
  );
}
