"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Stethoscope, Home, BadgeCheck, MapPin, Phone, Search, CalendarPlus, X, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatSitterServices } from "@/lib/config/professionals";
import { formatAdoptionFee } from "@/lib/utils/format";
import { DEFAULT_LOCALE } from "@/lib/config/locales";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface VetRow {
  id: string;
  userId: string;
  name: string | null;
  specialty: string | null;
  clinicName: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  phone: string | null;
  isAcceptingClients: boolean;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

interface SitterRow {
  id: string;
  userId: string;
  name: string | null;
  bio: string | null;
  services: string | null;
  pricePerDay: number | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  isAcceptingClients: boolean;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

interface PetOption {
  id: string;
  name: string | null;
}

interface BookingTarget {
  professionalId: string;
  name: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function VerifiedBadge() {
  const t = useTranslations("portal");
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--teal)] bg-[var(--teal-light)] px-2 py-0.5 rounded-full">
      <BadgeCheck className="w-3 h-3" />
      {t("verified")}
    </span>
  );
}

function AcceptingBadge({ accepting }: { accepting: boolean }) {
  const t = useTranslations("portal");
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
      accepting
        ? "bg-[var(--green-bg)] text-[var(--green-text)]"
        : "bg-[var(--off)] text-[var(--muted)]"
    }`}>
      {accepting ? t("acceptingClients") : t("notAccepting")}
    </span>
  );
}

const formatServices = formatSitterServices;

function StarRating({ avg, count }: { avg: number | null; count: number }) {
  if (avg === null || count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--warn-text)]">
      <Star className="w-3 h-3 fill-current" />
      <span className="font-medium">{avg.toFixed(1)}</span>
      <span className="text-[var(--muted)]">({count})</span>
    </span>
  );
}

/* ─── Card components ────────────────────────────────────────────────────── */

function VetCard({ vet, onBook }: { vet: VetRow; onBook: (t: BookingTarget) => void }) {
  const t = useTranslations("portal");
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-sm flex-shrink-0">
            {(vet.name ?? "V")[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[var(--ink)]">{vet.name ?? t("findVetFallback")}</p>
              {vet.isVerified && <VerifiedBadge />}
              <AcceptingBadge accepting={vet.isAcceptingClients} />
              <StarRating avg={vet.avgRating} count={vet.reviewCount} />
            </div>
            {vet.specialty && <p className="text-sm text-[var(--teal)] mt-0.5">{vet.specialty}</p>}
          </div>
        </div>
        {vet.isAcceptingClients && (
          <button
            onClick={() => onBook({ professionalId: vet.userId, name: vet.name })}
            className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            {t("book")}
          </button>
        )}
      </div>
      {(vet.clinicName || vet.city) && (
        <div className="flex items-center gap-1.5 mt-3 text-sm text-[var(--muted)]">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{[vet.clinicName, vet.city, vet.country].filter(Boolean).join(" · ")}</span>
        </div>
      )}
      {vet.bio && <p className="text-sm text-[var(--ink2)] mt-2 line-clamp-2">{vet.bio}</p>}
      {vet.phone && (
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-[var(--muted)]">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <a href={`tel:${vet.phone}`} className="hover:text-[var(--teal)] transition-colors">{vet.phone}</a>
        </div>
      )}
      <div className="mt-2">
        <a href={`/${DEFAULT_LOCALE}/pros/${vet.userId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--teal)] hover:underline">
          {t("findViewProfile")}
        </a>
      </div>
    </div>
  );
}

function SitterCard({ sitter, onBook }: { sitter: SitterRow; onBook: (t: BookingTarget) => void }) {
  const t = useTranslations("portal");
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
            {(sitter.name ?? "S")[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[var(--ink)]">{sitter.name ?? t("findSitterFallback")}</p>
              {sitter.isVerified && <VerifiedBadge />}
              <AcceptingBadge accepting={sitter.isAcceptingClients} />
              <StarRating avg={sitter.avgRating} count={sitter.reviewCount} />
            </div>
            {sitter.pricePerDay != null && (
              <p className="text-sm text-[var(--accent)] mt-0.5 font-medium">
                {formatAdoptionFee(sitter.pricePerDay)}{t("findPerDay")}
              </p>
            )}
          </div>
        </div>
        {sitter.isAcceptingClients && (
          <button
            onClick={() => onBook({ professionalId: sitter.userId, name: sitter.name })}
            className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            {t("book")}
          </button>
        )}
      </div>
      {sitter.services && <p className="text-sm text-[var(--muted)] mt-2">{formatServices(sitter.services)}</p>}
      {(sitter.city || sitter.country) && (
        <div className="flex items-center gap-1.5 mt-1 text-sm text-[var(--muted)]">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{[sitter.city, sitter.country].filter(Boolean).join(", ")}</span>
        </div>
      )}
      {sitter.bio && <p className="text-sm text-[var(--ink2)] mt-2 line-clamp-2">{sitter.bio}</p>}
      {sitter.phone && (
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-[var(--muted)]">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <a href={`tel:${sitter.phone}`} className="hover:text-[var(--teal)] transition-colors">{sitter.phone}</a>
        </div>
      )}
      <div className="mt-2">
        <a href={`/${DEFAULT_LOCALE}/pros/${sitter.userId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--teal)] hover:underline">
          {t("findViewProfile")}
        </a>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

type Tab = "vets" | "sitters";

export default function FindPage() {
  const t = useTranslations("portal");
  const [tab, setTab] = useState<Tab>("vets");
  const [vets, setVets] = useState<VetRow[]>([]);
  const [sitters, setSitters] = useState<SitterRow[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vetRes, sitterRes, petRes] = await Promise.all([
          fetch("/api/vets"),
          fetch("/api/sitters"),
          fetch("/api/pets"),
        ]);
        if (vetRes.ok) setVets((await vetRes.json()).data ?? []);
        if (sitterRes.ok) setSitters((await sitterRes.json()).data ?? []);
        if (petRes.ok) setPets((await petRes.json()).data ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredVets = cityFilter
    ? vets.filter((v) => v.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    : vets;

  const filteredSitters = cityFilter
    ? sitters.filter((s) => s.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    : sitters;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">{t("findTitle")}</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">{t("findSubtitle")}</p>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-[var(--off)] p-1 rounded-xl w-fit">
          {(["vets", "sitters"] as Tab[]).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === tabId
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tabId === "vets" ? t("veterinarians") : t("petSitters")}
            </button>
          ))}
        </div>
        <div className="relative sm:ms-auto">
          <Search className="w-4 h-4 text-[var(--muted)] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            className="form-input ps-9 text-sm"
            placeholder={t("filterByCity")}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-[var(--off)]" />
          ))}
        </div>
      ) : tab === "vets" ? (
        filteredVets.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title={t("findNoVets")}
            body={cityFilter
              ? t("findNoVetsCity", { city: cityFilter })
              : t("findNoVetsBody")}
            cta={cityFilter ? undefined : { label: t("findRegisterVet"), href: "/register?role=vet" }}
          />
        ) : (
          <div className="space-y-3">
            {filteredVets.map((vet) => (
              <VetCard key={vet.id} vet={vet} onBook={setBookingTarget} />
            ))}
          </div>
        )
      ) : (
        filteredSitters.length === 0 ? (
          <EmptyState
            icon={Home}
            title={t("findNoSitters")}
            body={cityFilter
              ? t("findNoSittersCity", { city: cityFilter })
              : t("findNoSittersBody")}
            cta={cityFilter ? undefined : { label: t("findRegisterSitter"), href: "/register?role=sitter" }}
          />
        ) : (
          <div className="space-y-3">
            {filteredSitters.map((sitter) => (
              <SitterCard key={sitter.id} sitter={sitter} onBook={setBookingTarget} />
            ))}
          </div>
        )
      )}

      {bookingTarget && (
        <BookingModal
          target={bookingTarget}
          pets={pets}
          onClose={() => setBookingTarget(null)}
        />
      )}
    </div>
  );
}

function BookingModal({
  target,
  pets,
  onClose,
}: {
  target: BookingTarget;
  pets: PetOption[];
  onClose: () => void;
}) {
  const t = useTranslations("portal");
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!petId || !startDate || !endDate) {
      setError(t("findBookingRequired"));
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petId,
        professionalId: target.professionalId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        notes: notes.trim() || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setSuccess(true);
    } else {
      setError(data.error ?? t("findBookingFailed"));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--ink)]">
            {t("findBookTitle", { name: target.name ?? t("findProfessional") })}
          </h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--green-bg)] flex items-center justify-center mx-auto mb-3">
              <CalendarPlus className="w-6 h-6 text-[var(--green-text)]" />
            </div>
            <p className="font-medium text-[var(--ink)] mb-1">{t("findBookingSuccess")}</p>
            <p className="text-sm text-[var(--muted)] mb-4">{t("findBookingSuccessDesc")}</p>
            <button onClick={onClose} className="btn-primary w-full">{t("findDone")}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {error && <p className="alert-error">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">{t("findPetLabel")} *</label>
              {pets.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  {t("noPets")} <Link href="/portal/pets/new" className="text-[var(--teal)] hover:underline">{t("noPetsAction")}</Link>
                </p>
              ) : (
                <select
                  className="form-input"
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
                  required
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name ?? "Unnamed pet"}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">{t("findStartDate")} *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">{t("findEndDate")} *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">{t("logNotes")}</label>
              <textarea
                className="form-input min-h-[72px] resize-none"
                placeholder={t("findBookingNotesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pb-1">
              <button type="button" onClick={onClose} className="btn-outline flex-1">{t("cancel")}</button>
              <button type="submit" disabled={saving || pets.length === 0} className="btn-primary flex-1 disabled:opacity-60">
                {saving ? t("findBookingInProgress") : t("findRequestBooking")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="card py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[var(--teal)]" />
      </div>
      <p className="font-medium text-[var(--ink)] mb-1">{title}</p>
      <p className="text-sm text-[var(--muted)] mb-5">{body}</p>
      {cta && (
        <Link href={cta.href} className="btn-primary">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
