"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SPECIES_OPTIONS, getBreedOptions } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";

interface PetData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  sex: "male" | "female" | "unknown";
  bio: string | null;
  isPublic: boolean;
  handle: string | null;
}

export default function EditPetPage() {
  const router = useRouter();
  const { petId } = useParams<{ petId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    name: "",
    species: "" as SpeciesId | "",
    breed: "",
    birthDate: "",
    sex: "unknown" as "male" | "female" | "unknown",
    bio: "",
    isPublic: false,
    handle: "",
  });

  useEffect(() => {
    fetch(`/api/pets/${petId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const p: PetData = data.data;
          setForm({
            name: p.name,
            species: p.species as SpeciesId,
            breed: p.breed ?? "",
            birthDate: p.birthDate ?? "",
            sex: p.sex,
            bio: p.bio ?? "",
            isPublic: p.isPublic,
            handle: p.handle ?? "",
          });
        }
        setLoading(false);
      });
  }, [petId]);

  const breedOptions = form.species
    ? getBreedOptions(form.species as SpeciesId)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name,
      sex: form.sex,
      bio: form.bio || undefined,
      isPublic: form.isPublic,
    };
    if (form.breed) payload.breed = form.breed;
    if (form.birthDate) payload.birthDate = form.birthDate;
    if (form.handle) payload.handle = form.handle.toLowerCase().replace(/\s+/g, "-");

    const res = await fetch(`/api/pets/${petId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Failed to save.");
    } else {
      router.push(`/portal/pets/${petId}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      router.push("/portal/pets");
    } else {
      setError("Failed to delete pet.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--muted)] text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      {/* Back */}
      <Link
        href={`/portal/pets/${petId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to profile
      </Link>

      <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">Edit pet</h1>

      {error && <p className="alert-error mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="card p-6 flex flex-col gap-5"
      >
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
            className="form-input"
          />
        </div>

        {/* Species (read-only after creation) */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Species
          </label>
          <div className="form-input bg-[var(--light)] text-[var(--muted)] cursor-not-allowed">
            {SPECIES_OPTIONS.find((s) => s.value === form.species)?.label ??
              form.species}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Species cannot be changed after creation.
          </p>
        </div>

        {/* Breed */}
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
            Bio
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us about your pet…"
            className="form-input resize-none"
          />
        </div>

        {/* Public handle */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Public handle
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted)]">petvity.com/pets/</span>
            <input
              type="text"
              value={form.handle}
              onChange={(e) =>
                setForm({
                  ...form,
                  handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              placeholder="fluffy-the-dog"
              pattern="[a-z0-9-]+"
              className="form-input flex-1"
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Leave blank for no public profile.
          </p>
        </div>

        {/* Public toggle */}
        <label className="flex items-start gap-3 cursor-pointer group">
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
              Public profile
            </span>
            <p className="text-xs text-[var(--muted)]">
              Visible to anyone with the link
            </p>
          </div>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link href={`/portal/pets/${petId}`} className="btn-outline">
            Cancel
          </Link>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-8 card p-5 border-[var(--danger-bg)]">
        <h3 className="text-sm font-semibold text-[var(--danger)] mb-1">
          Danger zone
        </h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          Deleting a pet removes all their health data, records, and
          vaccinations permanently.
        </p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-[var(--danger)] text-white border-none rounded-[10px] px-4 py-2 text-sm font-semibold cursor-pointer transition-opacity disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting…" : "Yes, delete permanently"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 text-[var(--danger)] border border-[var(--danger)] bg-transparent rounded-[10px] px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[var(--danger-bg)] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete this pet
          </button>
        )}
      </div>
    </div>
  );
}
