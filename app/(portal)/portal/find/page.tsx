"use client";

import { useState, useEffect } from "react";
import { Stethoscope, Home, BadgeCheck, MapPin, Phone, Search } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface VetRow {
  id: string;
  name: string | null;
  specialty: string | null;
  clinicName: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  isAcceptingClients: boolean;
  isVerified: boolean;
}

interface SitterRow {
  id: string;
  name: string | null;
  bio: string | null;
  services: string | null;
  pricePerDay: number | null;
  city: string | null;
  country: string | null;
  isAcceptingClients: boolean;
  isVerified: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--teal)] bg-[var(--teal-light)] px-2 py-0.5 rounded-full">
      <BadgeCheck className="w-3 h-3" />
      Verified
    </span>
  );
}

function AcceptingBadge({ accepting }: { accepting: boolean }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
      accepting
        ? "bg-[var(--green-bg)] text-[var(--green)]"
        : "bg-[var(--off)] text-[var(--muted)]"
    }`}>
      {accepting ? "Accepting clients" : "Not accepting"}
    </span>
  );
}

function formatServices(services: string | null): string {
  if (!services) return "";
  return services
    .split(",")
    .map((s) =>
      s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(" · ");
}

/* ─── Component ──────────────────────────────────────────────────────────── */

type Tab = "vets" | "sitters";

export default function FindPage() {
  const [tab, setTab] = useState<Tab>("vets");
  const [vets, setVets] = useState<VetRow[]>([]);
  const [sitters, setSitters] = useState<SitterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [vetRes, sitterRes] = await Promise.all([
        fetch("/api/vets"),
        fetch("/api/sitters"),
      ]);
      if (vetRes.ok) setVets((await vetRes.json()).data ?? []);
      if (sitterRes.ok) setSitters((await sitterRes.json()).data ?? []);
      setLoading(false);
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
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Find a Professional</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Connect with verified veterinarians and trusted pet sitters.
        </p>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-[var(--off)] p-1 rounded-xl w-fit">
          {(["vets", "sitters"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t === "vets" ? "Veterinarians" : "Pet Sitters"}
            </button>
          ))}
        </div>
        <div className="relative sm:ms-auto">
          <Search className="w-4 h-4 text-[var(--muted)] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            className="form-input ps-9 text-sm"
            placeholder="Filter by city…"
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
            title="No veterinarians listed yet"
            body={cityFilter ? `No vets found in "${cityFilter}".` : "Be the first to join as a veterinarian."}
          />
        ) : (
          <div className="space-y-3">
            {filteredVets.map((vet) => (
              <div key={vet.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-sm flex-shrink-0">
                      {(vet.name ?? "V")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[var(--ink)]">{vet.name ?? "Veterinarian"}</p>
                        {vet.isVerified && <VerifiedBadge />}
                        <AcceptingBadge accepting={vet.isAcceptingClients} />
                      </div>
                      {vet.specialty && (
                        <p className="text-sm text-[var(--teal)] mt-0.5">{vet.specialty}</p>
                      )}
                    </div>
                  </div>
                </div>
                {(vet.clinicName || vet.city) && (
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-[var(--muted)]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {[vet.clinicName, vet.city, vet.country].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
                {vet.bio && (
                  <p className="text-sm text-[var(--ink2)] mt-2 line-clamp-2">{vet.bio}</p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        filteredSitters.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No pet sitters listed yet"
            body={cityFilter ? `No sitters found in "${cityFilter}".` : "Be the first to join as a pet sitter."}
          />
        ) : (
          <div className="space-y-3">
            {filteredSitters.map((sitter) => (
              <div key={sitter.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
                      {(sitter.name ?? "S")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[var(--ink)]">{sitter.name ?? "Pet Sitter"}</p>
                        {sitter.isVerified && <VerifiedBadge />}
                        <AcceptingBadge accepting={sitter.isAcceptingClients} />
                      </div>
                      {sitter.pricePerDay != null && (
                        <p className="text-sm text-[var(--accent)] mt-0.5 font-medium">
                          ${(sitter.pricePerDay / 100).toFixed(0)}/day
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {sitter.services && (
                  <p className="text-sm text-[var(--muted)] mt-2">{formatServices(sitter.services)}</p>
                )}
                {(sitter.city || sitter.country) && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-[var(--muted)]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{[sitter.city, sitter.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {sitter.bio && (
                  <p className="text-sm text-[var(--ink2)] mt-2 line-clamp-2">{sitter.bio}</p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="card py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[var(--teal)]" />
      </div>
      <p className="font-medium text-[var(--ink)] mb-1">{title}</p>
      <p className="text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}
