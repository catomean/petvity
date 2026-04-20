"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPECIES_OPTIONS, getBreedOptions } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";

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
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-6">
        Add a pet
      </h1>

      {error && (
        <p className="mb-4 text-sm text-[var(--danger)] bg-red-50 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-[var(--border)] p-6 flex flex-col gap-5"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          />
        </div>

        {/* Species */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
            Species *
          </label>
          <select
            required
            value={form.species}
            onChange={(e) =>
              setForm({ ...form, species: e.target.value as SpeciesId, breed: "" })
            }
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          >
            <option value="">Select species…</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Breed */}
        {breedOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
              Breed
            </label>
            <select
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
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
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
              Birth date
            </label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
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
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
            >
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
            Bio
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us about your pet…"
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] resize-none"
          />
        </div>

        {/* Public profile */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            className="w-4 h-4 accent-[var(--teal)]"
          />
          <span className="text-sm text-[var(--ink2)]">
            Make this a public profile (visible without login)
          </span>
        </label>

        <div className="flex gap-3 pt-2">
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
