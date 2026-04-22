"use client";

import { useState, useEffect, useTransition } from "react";
import { CalendarCheck, Clock, CheckCircle, XCircle, ChevronDown } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface BookingRow {
  id: string;
  petId: string;
  petName: string | null;
  ownerId: string;
  ownerName: string | null;
  professionalId: string;
  professionalRole: "veterinarian" | "pet_sitter";
  startDate: string;
  endDate: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-[var(--warn-bg)] text-[var(--warn)]",     icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-[var(--green-bg)] text-[var(--green)]",   icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-[var(--off)] text-[var(--muted)]",        icon: XCircle },
  completed: { label: "Completed", color: "bg-[var(--teal-light)] text-[var(--teal)]",  icon: CheckCircle },
} as const;

function StatusBadge({ status }: { status: BookingRow["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/bookings");
    if (res.ok) {
      const { data } = await res.json();
      setBookings(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(bookingId: string, status: BookingRow["status"]) {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      startTransition(() => load());
    }
  }

  async function deleteBooking(bookingId: string) {
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => load());
    }
  }

  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const past = bookings.filter((b) => b.status === "cancelled" || b.status === "completed");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Bookings</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Manage your upcoming appointments and past sessions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-[var(--off)]" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">No bookings yet</p>
          <p className="text-sm text-[var(--muted)]">
            Book a vet or pet sitter from the{" "}
            <a href="/portal/find" className="text-[var(--teal)] hover:underline">Find a Pro</a> page.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} onUpdateStatus={updateStatus} onDelete={deleteBooking} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
                Past
              </h2>
              <div className="space-y-3">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} onUpdateStatus={updateStatus} onDelete={deleteBooking} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking: b,
  onUpdateStatus,
  onDelete,
}: {
  booking: BookingRow;
  onUpdateStatus: (id: string, status: BookingRow["status"]) => void;
  onDelete: (id: string) => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);

  const isProfessional = b.professionalRole === "veterinarian" ? "Veterinarian" : "Pet Sitter";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-[var(--ink)]">
              {b.petName ?? "Pet"} · {isProfessional}
            </p>
            <StatusBadge status={b.status} />
          </div>
          <p className="text-sm text-[var(--muted)]">
            {formatDate(b.startDate)}
            {b.startDate !== b.endDate && ` – ${formatDate(b.endDate)}`}
          </p>
          {b.ownerName && (
            <p className="text-sm text-[var(--ink2)] mt-0.5">Owner: {b.ownerName}</p>
          )}
          {b.notes && (
            <p className="text-sm text-[var(--muted)] mt-1.5 line-clamp-2">{b.notes}</p>
          )}
        </div>

        {/* Actions */}
        {(b.status === "pending" || b.status === "confirmed") && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setActionsOpen((o) => !o)}
              className="btn-outline text-sm flex items-center gap-1.5 px-3 py-1.5"
            >
              Actions <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {actionsOpen && (
              <div className="absolute end-0 top-full mt-1 w-44 bg-white border border-[var(--border)] rounded-xl shadow-lg z-10 py-1">
                {b.status === "pending" && (
                  <button
                    className="w-full text-start px-3 py-2 text-sm text-[var(--green)] hover:bg-[var(--green-bg)] transition-colors"
                    onClick={() => { setActionsOpen(false); onUpdateStatus(b.id, "confirmed"); }}
                  >
                    Confirm booking
                  </button>
                )}
                {b.status === "confirmed" && (
                  <button
                    className="w-full text-start px-3 py-2 text-sm text-[var(--teal)] hover:bg-[var(--teal-light)] transition-colors"
                    onClick={() => { setActionsOpen(false); onUpdateStatus(b.id, "completed"); }}
                  >
                    Mark completed
                  </button>
                )}
                <button
                  className="w-full text-start px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                  onClick={() => { setActionsOpen(false); onUpdateStatus(b.id, "cancelled"); }}
                >
                  Cancel booking
                </button>
                {b.status === "pending" && (
                  <button
                    className="w-full text-start px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--off)] transition-colors"
                    onClick={() => { setActionsOpen(false); onDelete(b.id); }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
