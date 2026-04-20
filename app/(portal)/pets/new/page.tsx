"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPECIES_OPTIONS, getBreedOptions } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewPetPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    species: "" as SpeciesId | "",
    breed: "",
    birthDate: "",
    sex: "unknown" as "male" | "female" | "unknown",
    bio: "",
    isPublic: false,
  });

  const breedOptions =
    form.species ? getBreedOptions(form.species as SpeciesId) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.species) { setError("Please select a species."); return; }
    setSaving(true);
    setError("");

    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        species: form.species || undefined,
        breed: form.breed || undefined,
        birthDate: form.birthDate || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Failed to add pet.");
    } else {
      router.push(`/portal/pets/${data.data.id}`);
    }
  }

  return (
    <div className="max-w-lg">
      <Link
        href="/portal/pets"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        My Pets
      </Link>

      <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Add a pet</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        Create a profile to start tracking their health and wellbeing.
      </p>

      {error && <p className="alert-error mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="card p-6 flex flex-col gap-5"
      >
        {/* Species first — drives breed options */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Species *
          </label>
          <select
            required
            value={form.species}
            onChange={(e) =>
              setForm({ ...form, species: e.target.value as SpeciesId, breed: "" })
            }
            className="form-input"
          >
            <option value="">Choose your pet type…</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Max, Luna, Bella…"
            className="form-input"
          />
        </div>

        {/* Breed (conditional) */}
        {breedOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Breed
            </label>
            <select
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
              className="form-input"
            >
              <option value="">Unknown / not listed</option>
              {breedOptions.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Birth date + sex */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Birth date
            </label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Sex
            </label>
            <select
              value={form.sex}
              onChange={(e) =>
                setForm({
                  ...form,
                  sex: e.target.value as "male" | "female" | "unknown",
                })
              }
              className="form-input"
            >
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Bio <span className="text-[var(--faint)] font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us a little about your pet's personality…"
            className="form-input resize-none"
          />
        </div>

        {/* Public toggle */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-[var(--border)] rounded-full transition-colors peer-checked:bg-[var(--teal)]" />
            <div className="absolute top-0.5 start-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--ink2)]">
              Make this a public profile
            </span>
            <p className="text-xs text-[var(--muted)]">
              Share your pet as a public influencer profile
            </p>
          </div>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add pet"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
