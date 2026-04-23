"use client";

import { useState, useEffect } from "react";
import {
  Heart, MapPin, DollarSign, Users, Clock, CheckCircle,
  PauseCircle, XCircle, ChevronDown, ChevronUp, PawPrint,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ListingStatus = "available" | "on_hold" | "adopted" | "withdrawn";

interface Listing {
  id: string;
  status: ListingStatus;
  title: string;
  location: string | null;
  feeCents: number | null;
  createdAt: string;
  updatedAt: string;
  pet: { id: string; name: string; species: string; avatarUrl: string | null };
  owner: { id: string; name: string | null; email: string };
  applicationCount: number;
  pendingCount: number;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<ListingStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  available:  { label: "Available",  icon: CheckCircle,  color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]" },
  on_hold:    { label: "On hold",    icon: PauseCircle,  color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  adopted:    { label: "Adopted",    icon: Heart,        color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  withdrawn:  { label: "Withdrawn",  icon: XCircle,      color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all",        label: "All listings" },
  { value: "available",  label: "Available" },
  { value: "on_hold",    label: "On hold" },
  { value: "adopted",    label: "Adopted" },
  { value: "withdrawn",  label: "Withdrawn" },
];

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", horse: "🐎", bird: "🦜",
  rabbit: "🐇", guinea_pig: "🐹", hamster: "🐹",
  reptile: "🦎", fish: "🐟", other: "🐾",
};

/* ─── Row component ──────────────────────────────────────────────────────── */

function ListingRow({
  listing,
  onStatusChange,
}: {
  listing: Listing;
  onStatusChange: (id: string, status: ListingStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const cfg = STATUS_CONFIG[listing.status];
  const StatusIcon = cfg.icon;

  async function changeStatus(newStatus: ListingStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/adoptions/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onStatusChange(listing.id, newStatus);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-white">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[var(--off)] transition-colors"
        onClick={() => setExpanded((o) => !o)}
      >
        {/* Pet avatar */}
        <div className="w-10 h-10 rounded-lg bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0 overflow-hidden text-xl">
          {listing.pet.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.pet.avatarUrl} alt={listing.pet.name} className="w-full h-full object-cover" />
          ) : (
            <span>{SPECIES_EMOJI[listing.pet.species] ?? "🐾"}</span>
          )}
        </div>

        {/* Pet + title */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--ink)] truncate">{listing.pet.name}</p>
          <p className="text-xs text-[var(--muted)] truncate">{listing.title}</p>
        </div>

        {/* Owner */}
        <div className="hidden md:block w-44 min-w-0">
          <p className="text-xs font-medium text-[var(--ink2)] truncate">{listing.owner.name ?? "—"}</p>
          <p className="text-xs text-[var(--muted)] truncate">{listing.owner.email}</p>
        </div>

        {/* Location */}
        {listing.location && (
          <div className="hidden lg:flex items-center gap-1 w-32 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
            <span className="text-xs text-[var(--muted)] truncate">{listing.location}</span>
          </div>
        )}

        {/* Fee */}
        <div className="hidden lg:flex items-center gap-1 w-24">
          <DollarSign className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
          <span className="text-xs text-[var(--muted)]">
            {listing.feeCents === null ? "Free" : `$${(listing.feeCents / 100).toFixed(0)}`}
          </span>
        </div>

        {/* Applications badge */}
        <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
          <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span className="text-xs text-[var(--muted)]">{listing.applicationCount}</span>
          {listing.pendingCount > 0 && (
            <span className="text-xs font-bold text-[var(--warn)] bg-[var(--warn-bg)] px-1.5 py-0.5 rounded-full leading-none">
              {listing.pendingCount} new
            </span>
          )}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </span>

        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted)] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-4 bg-[var(--off)]">
          <div className="flex flex-wrap gap-3 items-start justify-between">
            <div className="text-sm text-[var(--ink2)] space-y-1">
              <p><span className="font-medium">Listing ID:</span> <span className="font-mono text-xs">{listing.id}</span></p>
              <p><span className="font-medium">Created:</span> {new Date(listing.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Updated:</span> {new Date(listing.updatedAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Species:</span> <span className="capitalize">{listing.pet.species}</span></p>
            </div>

            {/* Admin actions */}
            <div className="flex flex-wrap gap-2">
              {listing.status !== "available" && (
                <button
                  disabled={updating}
                  onClick={() => changeStatus("available")}
                  className="btn-outline text-xs py-1.5 px-3 text-[var(--green)] border-[var(--green)] hover:bg-[var(--green-bg)]"
                >
                  Mark available
                </button>
              )}
              {listing.status !== "on_hold" && listing.status !== "adopted" && listing.status !== "withdrawn" && (
                <button
                  disabled={updating}
                  onClick={() => changeStatus("on_hold")}
                  className="btn-outline text-xs py-1.5 px-3 text-[var(--warn)] border-[var(--warn)] hover:bg-[var(--warn-bg)]"
                >
                  Put on hold
                </button>
              )}
              {listing.status !== "adopted" && (
                <button
                  disabled={updating}
                  onClick={() => changeStatus("adopted")}
                  className="btn-outline text-xs py-1.5 px-3 text-[var(--teal)] border-[var(--teal)] hover:bg-[var(--teal-light)]"
                >
                  Mark adopted
                </button>
              )}
              {listing.status !== "withdrawn" && (
                <button
                  disabled={updating}
                  onClick={() => changeStatus("withdrawn")}
                  className="btn-outline text-xs py-1.5 px-3 text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger-bg)]"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminAdoptionsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/adoptions")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setListings(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleStatusChange(id: string, status: ListingStatus) {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  // Summary counts
  const counts = {
    total:     listings.length,
    available: listings.filter((l) => l.status === "available").length,
    pending:   listings.reduce((s, l) => s + l.pendingCount, 0),
    adopted:   listings.filter((l) => l.status === "adopted").length,
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[var(--teal-light)] flex items-center justify-center">
          <Heart className="w-4.5 h-4.5 text-[var(--teal)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Adoption listings</h1>
          <p className="text-sm text-[var(--muted)]">Moderate listings and track applications</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total listings",    value: counts.total,     icon: PawPrint,      color: "text-[var(--teal)]",  bg: "bg-[var(--teal-light)]" },
          { label: "Available",         value: counts.available, icon: CheckCircle,   color: "text-[var(--green)]", bg: "bg-[var(--green-bg)]" },
          { label: "Pending reviews",   value: counts.pending,   icon: Clock,         color: "text-[var(--warn)]",  bg: "bg-[var(--warn-bg)]" },
          { label: "Adopted",           value: counts.adopted,   icon: Heart,         color: "text-[var(--teal)]",  bg: "bg-[var(--teal-light)]" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--ink)]">{value}</p>
              <p className="text-xs text-[var(--muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
          const count = value === "all" ? listings.length : listings.filter((l) => l.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === value
                  ? "bg-[var(--teal)] text-white"
                  : "bg-white border border-[var(--border)] text-[var(--ink2)] hover:bg-[var(--off)]"
              }`}
            >
              {label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
          <p className="text-[var(--muted)]">No listings found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
