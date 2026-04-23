"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart, ChevronLeft, MapPin, DollarSign, CheckCircle,
  Dog, Cat, Baby, Star, Loader2, Send,
} from "lucide-react";

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

interface Listing {
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

interface FormState {
  message: string;
  experience: string;
  housingType: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", horse: "🐎", bird: "🦜",
  rabbit: "🐇", guinea_pig: "🐹", hamster: "🐹",
  reptile: "🦎", fish: "🐟", other: "🐾",
};

const HOUSING_OPTIONS = [
  { value: "", label: "Select housing type…" },
  { value: "house_with_garden", label: "House with garden" },
  { value: "house_no_garden", label: "House without garden" },
  { value: "apartment", label: "Apartment" },
  { value: "farm", label: "Farm / rural property" },
  { value: "other", label: "Other" },
];

function ageLabel(birthDate: string | null): string {
  if (!birthDate) return "";
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (months < 1) return "< 1 month old";
  if (months < 12) return `${months} months old`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo old` : `${years} year${years !== 1 ? "s" : ""} old`;
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({ message: "", experience: "", housingType: "" });

  useEffect(() => {
    fetch(`/api/adoptions/${listingId}`)
      .then((r) => r.json())
      .then(({ data }) => { setListing(data ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [listingId]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch(`/api/adoptions/${listingId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: form.message.trim() || null,
        experience: form.experience.trim() || null,
        housingType: form.housingType || null,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) { setError(data.error ?? "Failed to submit."); return; }
    setApplied(true);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[var(--off)] rounded w-48" />
        <div className="card h-80" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="card py-16 text-center">
        <p className="font-medium text-[var(--ink)] mb-1">Listing not found</p>
        <Link href="/portal/adopt" className="btn-primary mt-4">Back to listings</Link>
      </div>
    );
  }

  const emoji = SPECIES_EMOJI[listing.pet.species] ?? "🐾";
  const age = ageLabel(listing.pet.birthDate);
  const isAvailable = listing.status === "available";

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/portal/adopt"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All listings
      </Link>

      {/* Hero card */}
      <div className="card overflow-hidden mb-5">
        {/* Photo */}
        <div className="aspect-video bg-[var(--teal-light)] flex items-center justify-center text-8xl">
          {listing.pet.avatarUrl ? (
            <img
              src={listing.pet.avatarUrl}
              alt={listing.pet.name}
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
              <h1 className="text-2xl font-bold text-[var(--ink)]">{listing.pet.name}</h1>
              <p className="text-sm text-[var(--muted)] capitalize mt-0.5">
                {listing.pet.species}
                {listing.pet.breed ? ` · ${listing.pet.breed}` : ""}
                {age ? ` · ${age}` : ""}
                {listing.pet.sex && listing.pet.sex !== "unknown" ? ` · ${listing.pet.sex}` : ""}
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              isAvailable
                ? "bg-[var(--green-bg)] text-[var(--green)]"
                : "bg-[var(--off)] text-[var(--muted)]"
            }`}>
              {isAvailable ? "Available" : listing.status.replace("_", " ")}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)] mb-5">
            {listing.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              {listing.feeCents === null ? "Free" : `$${(listing.feeCents / 100).toFixed(0)} adoption fee`}
            </span>
          </div>

          {/* Traits */}
          {(listing.goodWithKids || listing.goodWithDogs || listing.goodWithCats || listing.requiresExperience) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {listing.goodWithKids && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[var(--teal-light)] text-[var(--teal)] px-3 py-1 rounded-full">
                  <Baby className="w-3.5 h-3.5" /> Good with kids
                </span>
              )}
              {listing.goodWithDogs && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[var(--teal-light)] text-[var(--teal)] px-3 py-1 rounded-full">
                  <Dog className="w-3.5 h-3.5" /> Good with dogs
                </span>
              )}
              {listing.goodWithCats && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[var(--teal-light)] text-[var(--teal)] px-3 py-1 rounded-full">
                  <Cat className="w-3.5 h-3.5" /> Good with cats
                </span>
              )}
              {listing.requiresExperience && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[var(--warn-bg)] text-[var(--warn)] px-3 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5" /> Experienced owner required
                </span>
              )}
            </div>
          )}

          {/* Title + description */}
          <h2 className="font-semibold text-[var(--ink)] mb-2">{listing.title}</h2>
          {listing.description && (
            <p className="text-sm text-[var(--ink2)] leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          )}

          {/* Public profile link */}
          {listing.pet.handle && (
            <Link
              href={`/en/pets/${listing.pet.handle}`}
              className="text-sm text-[var(--teal)] hover:underline mt-3 inline-block no-underline"
            >
              View {listing.pet.name}&apos;s public profile →
            </Link>
          )}
        </div>
      </div>

      {/* Apply section */}
      {applied ? (
        <div className="card p-6 text-center border-2 border-[var(--green)]">
          <CheckCircle className="w-10 h-10 text-[var(--green)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--ink)] mb-1">Application submitted!</p>
          <p className="text-sm text-[var(--muted)]">
            The owner will review your application and get in touch.
          </p>
        </div>
      ) : isAvailable ? (
        showForm ? (
          <div className="card p-6 border-2 border-[var(--teal-light)]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                <Heart className="w-4 h-4 text-[var(--teal)]" />
              </div>
              <h2 className="font-semibold text-[var(--ink)]">Apply to adopt {listing.pet.name}</h2>
            </div>

            {error && <p className="alert-error mb-4">{error}</p>}

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                  Housing type <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
                </label>
                <select
                  className="form-input"
                  value={form.housingType}
                  onChange={(e) => setForm((f) => ({ ...f, housingType: e.target.value }))}
                >
                  {HOUSING_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                  Your experience with pets
                  <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
                </label>
                <textarea
                  className="form-input min-h-[80px] resize-y"
                  placeholder="Tell the owner about your experience with pets…"
                  value={form.experience}
                  onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                  Message to the owner
                  <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
                </label>
                <textarea
                  className="form-input min-h-[80px] resize-y"
                  placeholder={`Why would ${listing.pet.name} be a great fit for you?`}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {saving ? "Submitting…" : "Submit application"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            <Heart className="w-5 h-5" />
            Apply to adopt {listing.pet.name}
          </button>
        )
      ) : (
        <div className="card p-5 text-center bg-[var(--off)]">
          <p className="text-sm text-[var(--muted)]">
            This listing is no longer accepting applications.
          </p>
        </div>
      )}
    </div>
  );
}
