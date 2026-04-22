"use client";

import { useState } from "react";
import { Stethoscope, Home, CheckCircle, Save } from "lucide-react";

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

const SITTER_SERVICES = [
  { value: "boarding",     label: "Boarding" },
  { value: "daycare",      label: "Daycare" },
  { value: "walking",      label: "Dog Walking" },
  { value: "house_sitting",label: "House Sitting" },
  { value: "drop_in",      label: "Drop-in Visits" },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

interface Props {
  role: "veterinarian" | "pet_sitter";
  initialData: VetProfile | SitterProfile | null;
}

export default function ProfessionalProfileForm({ role, initialData }: Props) {
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
      setError(data.error ?? "Failed to save profile.");
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
  const title = isVet ? "Veterinarian Profile" : "Pet Sitter Profile";

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
          {hasProfile
            ? "Update your public profile visible to pet owners."
            : "Set up your profile so pet owners can find you."}
        </p>
      </div>

      {success && (
        <div className="alert-success mb-5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Profile saved successfully.
        </div>
      )}
      {error && <p className="alert-error mb-5">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Shared: bio ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-medium text-[var(--ink)] text-sm uppercase tracking-wide text-[var(--muted)]">
            About
          </h2>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Bio</label>
            <textarea
              className="form-input min-h-[100px] resize-y"
              placeholder={
                isVet
                  ? "Describe your experience, qualifications, and areas of expertise…"
                  : "Tell pet owners about yourself and your experience with animals…"
              }
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
              Practice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Specialty</label>
                <input
                  className="form-input"
                  placeholder="e.g. Small Animals, Exotic Pets, Surgery, Dentistry"
                  value={vetForm.specialty}
                  onChange={(e) => setVetForm((f) => ({ ...f, specialty: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Clinic name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sunshine Animal Hospital"
                  value={vetForm.clinicName}
                  onChange={(e) => setVetForm((f) => ({ ...f, clinicName: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Clinic address</label>
                <input
                  className="form-input"
                  placeholder="Street address"
                  value={vetForm.clinicAddress}
                  onChange={(e) => setVetForm((f) => ({ ...f, clinicAddress: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">City</label>
                <input
                  className="form-input"
                  placeholder="City"
                  value={vetForm.city}
                  onChange={(e) => setVetForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Country (ISO2)</label>
                <input
                  className="form-input"
                  placeholder="e.g. DE, US, FR"
                  maxLength={2}
                  value={vetForm.country}
                  onChange={(e) => setVetForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Phone</label>
                <input
                  className="form-input"
                  placeholder="+1 555 000 0000"
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
              Services
            </h2>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-2">
                Services offered
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
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                  Daily rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 45.00"
                  value={sitterForm.pricePerDay}
                  onChange={(e) => setSitterForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">City</label>
                <input
                  className="form-input"
                  placeholder="City"
                  value={sitterForm.city}
                  onChange={(e) => setSitterForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Country (ISO2)</label>
                <input
                  className="form-input"
                  placeholder="e.g. DE, US, FR"
                  maxLength={2}
                  value={sitterForm.country}
                  onChange={(e) => setSitterForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Phone</label>
                <input
                  className="form-input"
                  placeholder="+1 555 000 0000"
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
              Currently accepting new clients
            </span>
          </label>
          <p className="text-xs text-[var(--muted)] mt-1.5 ms-7">
            Uncheck this to pause your listing while you are at capacity.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
