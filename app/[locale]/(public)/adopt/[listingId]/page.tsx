import { notFound } from "next/navigation";
import { getInstance } from "@/lib/db";
import { adoptionListings, pets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { APP } from "@/lib/config/app";
import { SPECIES_CONFIG, SEX_LABELS } from "@/lib/config/species";
import type { SpeciesId, SexId } from "@/lib/config/species";
import {
  Heart, MapPin, DollarSign, PawPrint, Baby, Dog, Cat, Star, ChevronLeft,
} from "lucide-react";
import { LISTING_STATUS_CONFIG, LISTING_TRAIT_CONFIG } from "@/lib/config/adoptions";
import type { ListingStatusId, ListingTraitKey } from "@/lib/config/adoptions";
import { formatPetAge } from "@/lib/utils/format";
import type { Metadata } from "next";

/** Cache adoption listing detail for 30 s — status changes propagate quickly. */
export const revalidate = 30;

type Params = { params: Promise<{ locale: string; listingId: string }> };


export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { listingId } = await params;
  const db = getInstance();
  const [row] = await db
    .select({ title: adoptionListings.title, petName: pets.name, species: pets.species })
    .from(adoptionListings)
    .innerJoin(pets, eq(pets.id, adoptionListings.petId))
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  if (!row) return { title: APP.name };
  return {
    title: `Adopt ${row.petName} · ${APP.name}`,
    description: row.title,
  };
}

export default async function PublicListingDetailPage({ params }: Params) {
  const { locale, listingId } = await params;
  const db = getInstance();

  const [row] = await db
    .select({
      id: adoptionListings.id,
      title: adoptionListings.title,
      description: adoptionListings.description,
      feeCents: adoptionListings.feeCents,
      location: adoptionListings.location,
      status: adoptionListings.status,
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
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  if (!row) notFound();

  const emoji = SPECIES_CONFIG[row.pet.species as SpeciesId]?.emoji ?? "🐾";
  const age = formatPetAge(row.pet.birthDate);
  const isAvailable = row.status === "available";

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

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/${locale}/adopt`}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All listings
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm mb-5">
          {/* Photo */}
          <div className="aspect-video bg-[var(--teal-light)] flex items-center justify-center text-8xl">
            {row.pet.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.pet.avatarUrl}
                alt={row.pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{emoji}</span>
            )}
          </div>

          <div className="p-6">
            {/* Pet info */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--ink)]">{row.pet.name}</h1>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  {SPECIES_CONFIG[row.pet.species as SpeciesId]?.label ?? row.pet.species}
                  {row.pet.breed ? ` · ${row.pet.breed}` : ""}
                  {age ? ` · ${age}` : ""}
                  {row.pet.sex && row.pet.sex !== "unknown" ? ` · ${SEX_LABELS[row.pet.sex as SexId] ?? row.pet.sex}` : ""}
                </p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${LISTING_STATUS_CONFIG[row.status as ListingStatusId].className}`}>
                {LISTING_STATUS_CONFIG[row.status as ListingStatusId].label}
              </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)] mb-5">
              {row.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {row.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                {row.feeCents === null ? "Free adoption" : `$${(row.feeCents / 100).toFixed(0)} adoption fee`}
              </span>
            </div>

            {/* Traits — icons are UI-layer only; labels come from LISTING_TRAIT_CONFIG */}
            {LISTING_TRAIT_CONFIG.some((t) => row[t.field]) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {LISTING_TRAIT_CONFIG.map((t) => {
                  if (!row[t.field]) return null;
                  const icon: Record<ListingTraitKey, React.ReactNode> = {
                    goodWithKids:       <Baby className="w-3.5 h-3.5" />,
                    goodWithDogs:       <Dog className="w-3.5 h-3.5" />,
                    goodWithCats:       <Cat className="w-3.5 h-3.5" />,
                    requiresExperience: <Star className="w-3.5 h-3.5" />,
                  };
                  return (
                    <span key={t.field} className={`inline-flex items-center gap-1.5 text-xs font-medium ${t.className} px-3 py-1 rounded-full`}>
                      {icon[t.field]} {t.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Title + description */}
            <h2 className="font-semibold text-[var(--ink)] mb-2">{row.title}</h2>
            {row.description && (
              <p className="text-sm text-[var(--ink2)] leading-relaxed whitespace-pre-line">
                {row.description}
              </p>
            )}

            {/* Public profile link */}
            {row.pet.handle && (
              <Link
                href={`/${locale}/pets/${row.pet.handle}`}
                className="text-sm text-[var(--teal)] hover:underline mt-3 inline-block no-underline"
              >
                View {row.pet.name}&apos;s full profile →
              </Link>
            )}
          </div>
        </div>

        {/* Apply CTA */}
        {isAvailable && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center shadow-sm">
            <Heart className="w-8 h-8 text-[var(--teal)] mx-auto mb-3" />
            <p className="font-semibold text-[var(--ink)] mb-1">
              Interested in adopting {row.pet.name}?
            </p>
            <p className="text-sm text-[var(--muted)] mb-5">
              Create a free {APP.name} account to submit an adoption application.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/register?returnTo=/portal/adopt/${row.id}`}
                className="btn-primary flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Sign up to apply
              </Link>
              <Link href="/login" className="btn-outline">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
