"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ChevronLeft } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface FormState {
  title: string;
  description: string;
  feeDollars: string;
  location: string;
  requiresExperience: boolean;
  goodWithKids: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  feeDollars: "",
  location: "",
  requiresExperience: false,
  goodWithKids: null,
  goodWithDogs: null,
  goodWithCats: null,
};

function TriState({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--ink2)] mb-2">{label}</p>
      <div className="flex gap-2">
        {(["yes", "no", "unknown"] as const).map((opt) => {
          const mapped = opt === "yes" ? true : opt === "no" ? false : null;
          const active = value === mapped;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(mapped)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                active
                  ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                  : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--teal)]"
              }`}
            >
              {opt === "yes" ? "Yes" : opt === "no" ? "No" : "Unknown"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ListForAdoptionPage() {
  const { petId } = useParams<{ petId: string }>();
  const router = useRouter();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/pets/${petId}`)
      .then((r) => r.json())
      .then(({ data }) => { setPet(data ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [petId]);

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const feeCents =
      form.feeDollars === "" ? null : Math.round(parseFloat(form.feeDollars) * 100);

    const res = await fetch("/api/adoptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        feeCents,
        location: form.location.trim() || null,
        requiresExperience: form.requiresExperience,
        goodWithKids: form.goodWithKids,
        goodWithDogs: form.goodWithDogs,
        goodWithCats: form.goodWithCats,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) { setError(data.error ?? "Failed to create listing."); return; }
    router.push(`/portal/adoptions`);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[var(--off)] rounded w-48" />
        <div className="card h-80" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="card py-16 text-center">
        <p className="font-medium text-[var(--ink)]">Pet not found</p>
        <Link href="/portal/pets" className="btn-primary mt-4">My pets</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={`/portal/pets/${petId}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {pet.name}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center">
          <Heart className="w-5 h-5 text-[var(--teal)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">List {pet.name} for adoption</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Help {pet.name} find a loving new home
          </p>
        </div>
      </div>

      <div className="card p-6">
        {error && <p className="alert-error mb-5">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Listing headline <span className="text-[var(--danger-text)]">*</span>
            </label>
            <input
              className="form-input"
              required
              placeholder={`e.g. ${pet.name} looking for a loving forever home`}
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              About {pet.name}
              <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
            </label>
            <textarea
              className="form-input min-h-[120px] resize-y"
              placeholder={`Describe ${pet.name}'s personality, habits, and what kind of home they'd thrive in…`}
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </div>

          {/* Location + fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Location <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="City, Country"
                value={form.location}
                onChange={(e) => field("location", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Adoption fee ($)
                <span className="text-[var(--muted)] font-normal ms-1">(blank = free)</span>
              </label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.feeDollars}
                onChange={(e) => field("feeDollars", e.target.value)}
              />
            </div>
          </div>

          {/* Traits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TriState
              label="Good with kids?"
              value={form.goodWithKids}
              onChange={(v) => field("goodWithKids", v)}
            />
            <TriState
              label="Good with dogs?"
              value={form.goodWithDogs}
              onChange={(v) => field("goodWithDogs", v)}
            />
            <TriState
              label="Good with cats?"
              value={form.goodWithCats}
              onChange={(v) => field("goodWithCats", v)}
            />
            <div>
              <p className="text-sm font-medium text-[var(--ink2)] mb-2">Experience required?</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--teal)]"
                  checked={form.requiresExperience}
                  onChange={(e) => field("requiresExperience", e.target.checked)}
                />
                <span className="text-sm text-[var(--ink2)]">Experienced owners only</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              <Heart className="w-4 h-4" />
              {saving ? "Creating…" : "Create listing"}
            </button>
            <Link href={`/portal/pets/${petId}`} className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
