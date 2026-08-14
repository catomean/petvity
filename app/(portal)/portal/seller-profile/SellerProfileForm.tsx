"use client";

import { useState } from "react";
import { Globe, Phone, MapPin, Package, ToggleRight } from "lucide-react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/portal/PageHeader";

interface SellerProfile {
  id: string;
  displayName: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
}

interface Props {
  initialData: SellerProfile | null;
  userName: string | null;
}

export default function SellerProfileForm({ initialData, userName }: Props) {
  const t = useTranslations("portal");
  const isNew = !initialData;

  const [form, setForm] = useState({
    displayName: initialData?.displayName ?? userName ?? "",
    bio: initialData?.bio ?? "",
    city: initialData?.city ?? "",
    country: initialData?.country ?? "",
    phone: initialData?.phone ?? "",
    website: initialData?.website ?? "",
    isActive: initialData?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const payload = {
      displayName: form.displayName || null,
      bio: form.bio || null,
      city: form.city || null,
      country: form.country || null,
      phone: form.phone || null,
      website: form.website || null,
      isActive: form.isActive,
    };

    const res = await fetch("/api/sellers/me", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? t("sellerSaveFailed"));
    } else {
      setSuccess(true);
      if (isNew) {
        window.location.href = "/portal/seller-profile";
      }
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader
        title={isNew ? t("becomeSeller") : t("sellerProfile")}
        purpose={isNew ? t("sellerSetupSubtitle") : t("sellerProfilePurpose")}
      />

      {isNew && (
        <div className="card p-4 mb-5 border-[var(--teal)] bg-[var(--teal-light)]">
          <div className="flex gap-3">
            <Package className="w-5 h-5 text-[var(--teal)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--teal)]">{t("sellerInfoTitle")}</p>
              <p className="text-xs text-[var(--ink2)] mt-0.5">{t("sellerInfoBody")}</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="alert-error mb-4">{error}</p>}
      {success && !isNew && (
        <p className="alert-success mb-4">{t("sellerSavedSuccess")}</p>
      )}

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
        {/* Store name */}
        <div>
          <label className="form-label">
            {t("sellerStoreNameLabel")}
          </label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder={t("sellerStoreNamePlaceholder")}
            className="form-input"
          />
          <p className="text-xs text-[var(--muted)] mt-1">{t("sellerStoreNameHint")}</p>
        </div>

        {/* Bio */}
        <div>
          <label className="form-label">
            {t("sellerBioLabel")}
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder={t("sellerBioPlaceholder")}
            className="form-input resize-none"
          />
        </div>

        {/* City + Country */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              <MapPin className="w-3.5 h-3.5 inline me-1" />
              {t("profCity")}
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={t("profCityPlaceholder")}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">
              {t("profCountry")}
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase().slice(0, 2) })}
              placeholder={t("profCountryPlaceholder")}
              maxLength={2}
              className="form-input"
            />
          </div>
        </div>

        {/* Phone + Website */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              <Phone className="w-3.5 h-3.5 inline me-1" />
              {t("profPhone")}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t("profPhonePlaceholder")}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">
              <Globe className="w-3.5 h-3.5 inline me-1" />
              {t("sellerWebsiteLabel")}
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder={t("sellerWebsitePlaceholder")}
              className="form-input"
            />
          </div>
        </div>

        {/* Active toggle (only shown after creation) */}
        {!isNew && (
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[var(--border)] rounded-full transition-colors peer-checked:bg-[var(--teal)]" />
              <div className="absolute top-0.5 start-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <span className="text-sm font-medium text-[var(--ink2)] flex items-center gap-1.5">
                <ToggleRight className="w-3.5 h-3.5" />
                {t("sellerActiveLabel")}
              </span>
              <p className="text-xs text-[var(--muted)]">{t("sellerActiveHint")}</p>
            </div>
          </label>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving
              ? t("sellerSaving")
              : isNew
              ? t("sellerActivateButton")
              : t("sellerSaveButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
