"use client";

import { useState } from "react";
import { Stethoscope, Home, CheckCircle, Save } from "lucide-react";
import { SITTER_SERVICES } from "@/lib/config/professionals";
import { useTranslations } from "next-intl";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type VetProfile = {
  bio: string | null;
  specialty: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  isAcceptingClients: boolean;
};

type SitterProfile = {
  bio: string | null;
  services: string | null;
  pricePerDay: number | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  isAcceptingClients: boolean;
};

/* ─── Component ──────────────────────────────────────────────────────────── */

interface Props {
  role: "veterinarian" | "pet_sitter";
  initialData: VetProfile | SitterProfile | null;
}

export default function ProfessionalProfileForm({ role, initialData }: Props) {
  const t = useTranslations("portal");
  const isVet = role === "veterinarian";
  const apiUrl = isVet ? "/api/vets/me" : "/api/sitters/me";
  const hasProfile = initialData !== null;

  /* ── Vet state ────────────────────────────────────────────────────────── */
  const vetInit = initialData as VetProfile | null;
  const [vetForm, setVetForm] = useState({
    bio: vetInit?.bio ?? "",
    specialty: vetInit?.specialty ?? "",
    clinicName: vetInit?.clinicName ?? "",
    clinicAddress: vetInit?.clinicAddress ?? "",
    city: vetInit?.city ?? "",
    country: vetInit?.country ?? "",
    phone: vetInit?.phone ?? "",
    isAcceptingClients: vetInit?.isAcceptingClients ?? true,
  });

  /* ── Sitter state ─────────────────────────────────────────────────────── */
  const sitterInit = initialData as SitterProfile | null;
  const selectedServices = new Set(
    (sitterInit?.services ?? "").split(",").filter(Boolean),
  );
  const [sitterForm, setSitterForm] = useState({
    bio: sitterInit?.bio ?? "",
    services: selectedServices,
    pricePerDay: sitterInit?.pricePerDay != null
      ? String(sitterInit.pricePerDay / 100)
      : "",
    city: sitterInit?.city ?? "",
    country: sitterInit?.country ?? "",
    phone: sitterInit?.phone ?? "",
    isAcceptingClients: sitterInit?.isAcceptingClients ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const body = isVet
      ? {
          bio: vetForm.bio.trim() || null,
          specialty: vetForm.specialty.trim() || null,
          clinicName: vetForm.clinicName.trim() || null,
          clinicAddress: vetForm.clinicAddress.trim() || null,
          city: vetForm.city.trim() || null,
          country: vetForm.country.trim().toUpperCase().slice(0, 2) || null,
          phone: vetForm.phone.trim() || null,
          isAcceptingClients: vetForm.isAcceptingClients,
        }
      : {
          bio: sitterForm.bio.trim() || null,
          services: [...sitterForm.services].join(",") || null,
          pricePerDay: sitterForm.pricePerDay
            ? Math.round(parseFloat(sitterForm.pricePerDay) * 100)
            : null,
          city: sitterForm.city.trim() || null,
          country: sitterForm.country.trim().toUpperCase().slice(0, 2) || null,
          phone: sitterForm.phone.trim() || null,
          isAcceptingClients: sitterForm.isAcceptingClients,
        };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (data.success) {
      setSuccess(true);
    } else {
      setError(data.error ?? t("profSaveFailed"));
    }
  }

  function toggleService(value: string) {
    setSitterForm((f) => {
      const next = new Set(f.services);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...f, services: next };
    });
  }

  const Icon = isVet ? Stethoscope : Home;
  const title = isVet ? t("profVetTitle") : t("profSitterTitle");

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--teal-light)] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--teal)]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">{title}</h1>
        </div>
        <p className="text-sm text-[var(--muted)] ms-12">
          {hasProfile ? t("profSubtitleUpdate") : t("profSubtitleSetup")}
        </p>
      </div>

      {success && (
        <div className="alert-success mb-5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {t("profSaveSuccess")}
        </div>
      )}
      {error && <p className="alert-error mb-5">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Shared: bio ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-medium text-[var(--ink)] text-sm uppercase tracking-wide text-[var(--muted)]">
            {t("profAbout")}
          </h2>
          <div>
            <label className="form-label">{t("petBioLabel")}</label>
            <textarea
              className="form-input min-h-[100px] resize-y"
              placeholder={isVet ? t("profVetBioPlaceholder") : t("profSitterBioPlaceholder")}
              value={isVet ? vetForm.bio : sitterForm.bio}
              onChange={(e) =>
                isVet
                  ? setVetForm((f) => ({ ...f, bio: e.target.value }))
                  : setSitterForm((f) => ({ ...f, bio: e.target.value }))
              }
            />
          </div>
        </div>

        {/* ── Vet-specific fields ── */}
        {isVet && (
          <div className="card p-5 space-y-4">
            <h2 className="font-medium text-sm uppercase tracking-wide text-[var(--muted)]">
              {t("profPractice")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">{t("profSpecialty")}</label>
                <input
                  className="form-input"
                  placeholder={t("profSpecialtyPlaceholder")}
                  value={vetForm.specialty}
                  onChange={(e) => setVetForm((f) => ({ ...f, specialty: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">{t("profClinicName")}</label>
                <input
                  className="form-input"
                  placeholder={t("profClinicNamePlaceholder")}
                  value={vetForm.clinicName}
                  onChange={(e) => setVetForm((f) => ({ ...f, clinicName: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">{t("profClinicAddress")}</label>
                <input
                  className="form-input"
                  placeholder={t("profClinicAddressPlaceholder")}
                  value={vetForm.clinicAddress}
                  onChange={(e) => setVetForm((f) => ({ ...f, clinicAddress: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">{t("profCity")}</label>
                <input
                  className="form-input"
                  placeholder={t("profCityPlaceholder")}
                  value={vetForm.city}
                  onChange={(e) => setVetForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">{t("profCountry")}</label>
                <input
                  className="form-input"
                  placeholder={t("profCountryPlaceholder")}
                  maxLength={2}
                  value={vetForm.country}
                  onChange={(e) => setVetForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">{t("profPhone")}</label>
                <input
                  className="form-input"
                  placeholder={t("profPhonePlaceholder")}
                  value={vetForm.phone}
                  onChange={(e) => setVetForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Sitter-specific fields ── */}
        {!isVet && (
          <div className="card p-5 space-y-4">
            <h2 className="font-medium text-sm uppercase tracking-wide text-[var(--muted)]">
              {t("profServices")}
            </h2>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-2">
                {t("profServicesOffered")}
              </label>
              <div className="flex flex-wrap gap-2">
                {SITTER_SERVICES.map(({ value, label }) => {
                  const active = sitterForm.services.has(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleService(value)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                          : "border-[var(--border)] text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  {t("profDailyRate")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder={t("profDailyRatePlaceholder")}
                  value={sitterForm.pricePerDay}
                  onChange={(e) => setSitterForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">{t("profCity")}</label>
                <input
                  className="form-input"
                  placeholder={t("profCityPlaceholder")}
                  value={sitterForm.city}
                  onChange={(e) => setSitterForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">{t("profCountry")}</label>
                <input
                  className="form-input"
                  placeholder={t("profCountryPlaceholder")}
                  maxLength={2}
                  value={sitterForm.country}
                  onChange={(e) => setSitterForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">{t("profPhone")}</label>
                <input
                  className="form-input"
                  placeholder={t("profPhonePlaceholder")}
                  value={sitterForm.phone}
                  onChange={(e) => setSitterForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Availability ── */}
        <div className="card p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-[var(--teal)]"
              checked={isVet ? vetForm.isAcceptingClients : sitterForm.isAcceptingClients}
              onChange={(e) =>
                isVet
                  ? setVetForm((f) => ({ ...f, isAcceptingClients: e.target.checked }))
                  : setSitterForm((f) => ({ ...f, isAcceptingClients: e.target.checked }))
              }
            />
            <span className="text-sm font-medium text-[var(--ink)]">
              {t("profAcceptingClients")}
            </span>
          </label>
          <p className="text-xs text-[var(--muted)] mt-1.5 ms-7">
            {t("profAcceptingClientsHint")}
          </p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? t("saving") : t("profSaveProfile")}
          </button>
        </div>
      </form>
    </div>
  );
}
