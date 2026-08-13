"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SPECIES_OPTIONS, SPECIES_CONFIG, SEX_OPTIONS, getBreedOptions } from "@/lib/config/species";
import type { SpeciesId, SexId } from "@/lib/config/species";
import Link from "next/link";
import { ChevronLeft, PawPrint } from "lucide-react";
import { useTranslations } from "next-intl";

function NewPetForm() {
  const t = useTranslations("portal");
  const tPub = useTranslations("public");
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRegistration = searchParams.get("from") === "registration";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    species: "" as SpeciesId | "",
    breed: "",
    birthDate: "",
    sex: "unknown" as SexId,
    bio: "",
    isPublic: false,
  });

  const breedOptions =
    form.species ? getBreedOptions(form.species as SpeciesId) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.species) { setError(t("newPetSelectSpecies")); return; }
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
      setError(data.error ?? t("newPetFailed"));
    } else if (fromRegistration) {
      router.push(`/portal/pets/${data.data.id}/health/log`);
    } else {
      router.push(`/portal/pets/${data.data.id}`);
    }
  }

  return (
    <div className="max-w-lg">
      {fromRegistration ? (
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--teal-light)] border border-[var(--teal)] px-5 py-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[var(--teal)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <PawPrint className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--teal)]">{t("newPetWelcomeTitle")}</p>
            <p className="text-xs text-[var(--ink2)] mt-0.5">{t("newPetWelcomeSubtitle")}</p>
          </div>
        </div>
      ) : (
        <Link
          href="/portal/pets"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("myPets")}
        </Link>
      )}

      <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">{t("addPet")}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">{t("newPetSubtitle")}</p>

      {error && <p className="alert-error mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="card p-6 flex flex-col gap-5"
      >
        {/* Species first — drives breed options */}
        <div>
          <label className="form-label">
            {t("petSpeciesLabel")} *
          </label>
          <select
            required
            value={form.species}
            onChange={(e) =>
              setForm({ ...form, species: e.target.value as SpeciesId, breed: "" })
            }
            className="form-input"
          >
            <option value="">{t("newPetChooseType")}</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {SPECIES_CONFIG[s.value as SpeciesId].emoji} {tPub(`species_${s.value}` as Parameters<typeof tPub>[0])}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="form-label">
            {t("petNameLabel")} *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("newPetNamePlaceholder")}
            className="form-input"
          />
        </div>

        {/* Breed (conditional) */}
        {breedOptions.length > 0 && (
          <div>
            <label className="form-label">
              {t("petBreedLabel")}
            </label>
            <select
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
              className="form-input"
            >
              <option value="">{t("petBreedUnknown")}</option>
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
            <label className="form-label">
              {t("petBirthDate")}
            </label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">
              {t("petSex")}
            </label>
            <select
              value={form.sex}
              onChange={(e) =>
                setForm({
                  ...form,
                  sex: e.target.value as SexId,
                })
              }
              className="form-input"
            >
              {SEX_OPTIONS.map(({ value }) => (
                <option key={value} value={value}>{tPub(`sex_${value}` as Parameters<typeof tPub>[0])}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="form-label">
            {t("petBioLabel")} <span className="text-[var(--faint)] font-normal">{t("listOptional")}</span>
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder={t("newPetBioPlaceholder")}
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
              {t("newPetPublicLabel")}
            </span>
            <p className="text-xs text-[var(--muted)]">{t("newPetPublicDesc")}</p>
          </div>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? t("saving") : t("newPetAdd")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-outline"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPetPage() {
  return (
    <Suspense>
      <NewPetForm />
    </Suspense>
  );
}
