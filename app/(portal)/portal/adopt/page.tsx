"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart, PawPrint, MapPin, Users,
  Search, Filter, ChevronRight, Sparkles,
} from "lucide-react";
import { SPECIES_CONFIG, SPECIES_OPTIONS as SPECIES_OPTS } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AdoptionPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  sex: string | null;
  avatarUrl: string | null;
  handle: string | null;
}

interface AdoptionListing {
  id: string;
  title: string;
  description: string | null;
  feeCents: number | null;
  location: string | null;
  requiresExperience: boolean;
  goodWithKids: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
  status: string;
  createdAt: string;
  ownerId: string;
  pet: AdoptionPet;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

// Prepend "All species" to the SSOT list from lib/config/species
const SPECIES_OPTIONS = [{ value: "", label: "All species" }, ...SPECIES_OPTS];

function ageLabel(birthDate: string | null): string {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}yr`;
}

function feeLabel(feeCents: number | null): string {
  if (feeCents === null) return "Free";
  return `$${(feeCents / 100).toFixed(0)} fee`;
}

/* ─── Listing Card ───────────────────────────────────────────────────────── */

function ListingCard({ listing }: { listing: AdoptionListing }) {
  const emoji = SPECIES_CONFIG[listing.pet.species as SpeciesId]?.emoji ?? "🐾";
  const age = ageLabel(listing.pet.birthDate);

  return (
    <Link
      href={`/portal/adopt/${listing.id}`}
      className="card overflow-hidden hover:shadow-md transition-shadow no-underline group"
    >
      {/* Avatar */}
      <div className="aspect-[4/3] bg-[var(--teal-light)] flex items-center justify-center text-5xl relative overflow-hidden">
        {listing.pet.avatarUrl ? (
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-[var(--ink)] truncate">{listing.pet.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {SPECIES_CONFIG[listing.pet.species as SpeciesId]?.label ?? listing.pet.species}
              {listing.pet.breed ? ` · ${listing.pet.breed}` : ""}
              {age ? ` · ${age}` : ""}
              {listing.pet.sex && listing.pet.sex !== "unknown" ? ` · ${listing.pet.sex}` : ""}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--teal)] transition-colors flex-shrink-0 mt-0.5" />
        </div>

        {listing.location && (
          <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {listing.location}
          </p>
        )}

        {/* Traits */}
        <div className="flex flex-wrap gap-1 mt-3">
          {listing.goodWithKids && (
            <span className="text-[10px] font-medium bg-[var(--teal-light)] text-[var(--teal)] px-2 py-0.5 rounded-full">
              Good with kids
            </span>
          )}
          {listing.goodWithDogs && (
            <span className="text-[10px] font-medium bg-[var(--teal-light)] text-[var(--teal)] px-2 py-0.5 rounded-full">
              Good with dogs
            </span>
          )}
          {listing.goodWithCats && (
            <span className="text-[10px] font-medium bg-[var(--teal-light)] text-[var(--teal)] px-2 py-0.5 rounded-full">
              Good with cats
            </span>
          )}
          {listing.requiresExperience && (
            <span className="text-[10px] font-medium bg-[var(--warn-bg)] text-[var(--warn)] px-2 py-0.5 rounded-full">
              Experienced owner
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdoptPage() {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState("");
  const [locationQ, setLocationQ] = useState("");

  useEffect(() => {
    const url = species ? `/api/adoptions?species=${species}` : "/api/adoptions";
    fetch(url)
      .then((r) => r.json())
      .then(({ data }) => { setListings(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [species]);

  const displayed = locationQ
    ? listings.filter((l) =>
        l.location?.toLowerCase().includes(locationQ.toLowerCase()),
      )
    : listings;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] flex items-center gap-2">
            <Heart className="w-6 h-6 text-[var(--danger)]" />
            Adopt a Pet
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Find a pet looking for a loving home</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/portal/adopt/applications" className="btn-ghost text-sm flex items-center gap-2">
            My applications
          </Link>
          <Link href="/portal/adoptions" className="btn-ghost text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            My listings
          </Link>
          <Link href="/portal/pets" className="btn-outline text-sm flex items-center gap-2">
            <PawPrint className="w-4 h-4" />
            List a pet
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Filter by location…"
            className="form-input ps-9 text-sm"
            value={locationQ}
            onChange={(e) => setLocationQ(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <select
            className="form-input ps-9 pe-4 text-sm"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            {SPECIES_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-72 animate-pulse bg-[var(--off)]" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">No listings found</p>
          <p className="text-sm text-[var(--muted)] mb-5">
            {species || locationQ
              ? "Try adjusting your filters."
              : "No pets are listed for adoption yet. Be the first to help one find a home."}
          </p>
          <Link href="/portal/pets" className="btn-primary">
            List a pet for adoption
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
