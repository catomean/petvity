"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Syringe, ChevronLeft, X,
  Check, AlertTriangle, Clock,
  Pencil, Trash2, Search,
} from "lucide-react";
import { formatDateShort, formatRelativeDate } from "@/lib/utils/format";
import { VACCINATION_STATUS_CONFIG } from "@/lib/config/vaccinations";
import type { VaccinationStatusId } from "@/lib/config/vaccinations";

/* ── Icon map — React components stay in the UI layer, not in config ─────── */
const STATUS_ICONS: Partial<Record<VaccinationStatusId, React.ElementType>> = {
  up_to_date:     Check,
  due_soon:       Clock,
  overdue:        AlertTriangle,
  not_applicable: undefined,
};

type VaccinationStatus = VaccinationStatusId;

interface Vaccination {
  id: string;
  name: string;
  administeredDate: string;
  nextDueDate: string | null;
  status: VaccinationStatus;
  vetName: string | null;
  batchNumber: string | null;
  notes: string | null;
}

interface FormState {
  name: string;
  administeredDate: string;
  nextDueDate: string;
  vetName: string;
  batchNumber: string;
  status: VaccinationStatus;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  administeredDate: new Date().toISOString().slice(0, 10),
  nextDueDate: "",
  vetName: "",
  batchNumber: "",
  status: "up_to_date",
  notes: "",
};

export default function VaccinationsPage() {
  const { petId } = useParams<{ petId: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [petName, setPetName] = useState<string>("");
  const [rows, setRows] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VaccinationStatus | "all">("all");
  const [searchQ, setSearchQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [petRes, vacRes] = await Promise.all([
        fetch(`/api/pets/${petId}`),
        fetch(`/api/vaccinations?petId=${petId}`),
      ]);
      if (petRes.ok) setPetName((await petRes.json()).data?.name ?? "");
      if (vacRes.ok) setRows((await vacRes.json()).data ?? []);
      setLoading(false);
    }
    load();
  }, [petId]);

  function openAdd() {
    setEditingId(null);
    setDeletingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(v: Vaccination) {
    setEditingId(v.id);
    setDeletingId(null);
    setForm({
      name: v.name,
      administeredDate: v.administeredDate,
      nextDueDate: v.nextDueDate ?? "",
      vetName: v.vetName ?? "",
      batchNumber: v.batchNumber ?? "",
      status: v.status,
      notes: v.notes ?? "",
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const isEdit = editingId !== null;
    const url = isEdit ? `/api/vaccinations/${editingId}` : "/api/vaccinations";
    const method = isEdit ? "PATCH" : "POST";

    const body = {
      ...(isEdit ? {} : { petId }),
      name: form.name.trim(),
      administeredDate: form.administeredDate,
      nextDueDate: form.nextDueDate || null,
      vetName: form.vetName.trim() || null,
      batchNumber: form.batchNumber.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) { setError(data.error ?? "Failed to save."); return; }

    if (isEdit) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? data.data : r)));
    } else {
      setRows((prev) => [data.data, ...prev]);
    }
    closeForm();
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/vaccinations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
      startTransition(() => router.refresh());
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const filteredRows = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-[var(--off)] rounded w-40 mb-2" />
        <div className="h-6 bg-[var(--off)] rounded w-28 mb-8" />
        <div className="card h-64" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/portal/pets/${petId}`}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {petName || "Pet"}
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Vaccinations</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Track immunisations and upcoming boosters</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {rows.length > 0 && !showForm && (
            <>
              <div className="relative">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search vaccines…"
                  className="form-input text-sm py-1.5 ps-8 w-40"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  aria-label="Search vaccinations"
                />
              </div>
              <select
                className="form-input text-sm py-1.5"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as VaccinationStatus | "all")}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {(Object.entries(VACCINATION_STATUS_CONFIG) as [VaccinationStatus, { label: string }][]).map(
                  ([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>
                )}
              </select>
            </>
          )}
          {!showForm && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Form (add / edit) */}
      {showForm && (
        <div className="card p-6 mb-6 border-2 border-[var(--teal-light)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                <Syringe className="w-4 h-4 text-[var(--teal)]" />
              </div>
              <h2 className="font-semibold text-[var(--ink)]">
                {editingId ? "Edit vaccination" : "New vaccination"}
              </h2>
            </div>
            <button type="button" onClick={closeForm} className="btn-ghost p-1 rounded-lg">
              <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>

          {error && <p className="alert-error mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Vaccine name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Rabies, DHPP, Bordetella"
                required
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Date administered <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                required
                value={form.administeredDate}
                onChange={(e) => field("administeredDate", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Next due date
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={form.nextDueDate}
                onChange={(e) => field("nextDueDate", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => field("status", e.target.value as VaccinationStatus)}
              >
                {(Object.entries(VACCINATION_STATUS_CONFIG) as [VaccinationStatus, { label: string }][]).map(
                  ([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Administered by
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="Vet or clinic name"
                value={form.vetName}
                onChange={(e) => field("vetName", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Batch / lot number
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="For your records"
                value={form.batchNumber}
                onChange={(e) => field("batchNumber", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Notes
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <textarea
                rows={2}
                className="form-input resize-none"
                placeholder="Reactions, observations, or reminders…"
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-1">
              <button type="submit" disabled={saving || isPending} className="btn-primary disabled:opacity-60">
                {saving ? "Saving…" : editingId ? "Update vaccination" : "Save vaccination"}
              </button>
              <button type="button" onClick={closeForm} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
              <Syringe className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <p className="font-medium text-[var(--ink)] mb-1">No vaccinations yet</p>
            <p className="text-sm text-[var(--muted)] mb-5">Keep track of immunisations and upcoming boosters.</p>
            {!showForm && (
              <button onClick={openAdd} className="btn-primary">
                <Plus className="w-4 h-4" />
                Add first vaccination
              </button>
            )}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-[var(--ink)] mb-1">No vaccinations match</p>
            <button
              onClick={() => { setStatusFilter("all"); setSearchQ(""); }}
              className="text-sm text-[var(--teal)] hover:underline mt-1"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--off)]">
              <tr>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Vaccine</th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide hidden sm:table-cell">Given</th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide hidden md:table-cell">Next due</th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((v) => {
                const status = VACCINATION_STATUS_CONFIG[v.status] ?? VACCINATION_STATUS_CONFIG.up_to_date;
                const StatusIcon = STATUS_ICONS[v.status];
                const isDeleting = deletingId === v.id;
                return (
                  <tr key={v.id} className="group border-t border-[var(--border)] hover:bg-[var(--off)] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-[var(--ink)]">{v.name}</p>
                      {v.vetName && <p className="text-xs text-[var(--muted)] mt-0.5">{v.vetName}</p>}
                      {v.notes && <p className="text-xs text-[var(--muted)] mt-0.5 italic">{v.notes}</p>}
                      <p className="text-xs text-[var(--muted)] mt-0.5 sm:hidden">{formatDateShort(v.administeredDate)}</p>
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] hidden sm:table-cell">
                      {formatDateShort(v.administeredDate)}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] hidden md:table-cell">
                      {v.nextDueDate ? (
                        <span title={formatDateShort(v.nextDueDate)}>{formatRelativeDate(v.nextDueDate)}</span>
                      ) : (
                        <span className="text-[var(--faint)]">–</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${status.className}`}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-xs font-medium text-[var(--danger)] hover:underline"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-[var(--muted)] hover:underline ms-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(v)}
                            className="p-1.5 rounded-lg hover:bg-[var(--teal-light)] text-[var(--muted)] hover:text-[var(--teal)] transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(v.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
