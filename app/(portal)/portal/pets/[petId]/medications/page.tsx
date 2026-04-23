"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Pill, ChevronLeft, X,
  Check, Clock, Ban,
  Pencil, Trash2,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils/format";
import { MEDICATION_STATUS_CONFIG } from "@/lib/config/medications";
import type { MedicationStatusId } from "@/lib/config/medications";

/* ── Icon map — React components stay in the UI layer, not in config ─────── */
const STATUS_ICONS: Record<MedicationStatusId, React.ElementType> = {
  active:        Check,
  completed:     Clock,
  discontinued:  Ban,
};

type MedicationStatus = MedicationStatusId;

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string;
  endDate: string | null;
  prescribedBy: string | null;
  status: MedicationStatus;
  notes: string | null;
}

interface FormState {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  status: MedicationStatus;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  dosage: "",
  frequency: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  prescribedBy: "",
  status: "active",
  notes: "",
};

export default function MedicationsPage() {
  const { petId } = useParams<{ petId: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [petName, setPetName] = useState("");
  const [rows, setRows] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [petRes, medRes] = await Promise.all([
        fetch(`/api/pets/${petId}`),
        fetch(`/api/medications?petId=${petId}`),
      ]);
      if (petRes.ok) setPetName((await petRes.json()).data?.name ?? "");
      if (medRes.ok) setRows((await medRes.json()).data ?? []);
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

  function openEdit(m: Medication) {
    setEditingId(m.id);
    setDeletingId(null);
    setForm({
      name: m.name,
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "",
      startDate: m.startDate,
      endDate: m.endDate ?? "",
      prescribedBy: m.prescribedBy ?? "",
      status: m.status,
      notes: m.notes ?? "",
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
    const url = isEdit ? `/api/medications/${editingId}` : "/api/medications";
    const method = isEdit ? "PATCH" : "POST";

    const body = {
      ...(isEdit ? {} : { petId }),
      name: form.name.trim(),
      startDate: form.startDate,
      status: form.status,
      dosage: form.dosage.trim() || null,
      frequency: form.frequency.trim() || null,
      endDate: form.endDate || null,
      prescribedBy: form.prescribedBy.trim() || null,
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
    const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
      startTransition(() => router.refresh());
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-[var(--off)] rounded w-40" />
        <div className="h-5 bg-[var(--off)] rounded w-28" />
        <div className="card h-64 mt-6" />
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
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Medications</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Track prescriptions, dosages, and treatment history</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Form (add / edit) */}
      {showForm && (
        <div className="card p-6 mb-6 border-2 border-[var(--teal-light)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                <Pill className="w-4 h-4 text-[var(--teal)]" />
              </div>
              <h2 className="font-semibold text-[var(--ink)]">
                {editingId ? "Edit medication" : "New medication"}
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
                Medication name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Amoxicillin, Rimadyl, Heartgard"
                required
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Dosage <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. 250mg, 1 tablet"
                value={form.dosage}
                onChange={(e) => field("dosage", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Frequency <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Twice daily, Every 8 hours"
                value={form.frequency}
                onChange={(e) => field("frequency", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Start date <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                required
                value={form.startDate}
                onChange={(e) => field("startDate", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                End date <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={form.endDate}
                onChange={(e) => field("endDate", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => field("status", e.target.value as MedicationStatus)}
              >
                {(Object.entries(MEDICATION_STATUS_CONFIG) as [MedicationStatus, { label: string }][]).map(
                  ([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Prescribed by <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="Vet or clinic name"
                value={form.prescribedBy}
                onChange={(e) => field("prescribedBy", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Notes <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <textarea
                className="form-input min-h-[80px] resize-y"
                placeholder="Instructions, side effects to watch for, refill notes…"
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? "Saving…" : editingId ? "Update medication" : "Save medication"}
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
              <Pill className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <p className="font-medium text-[var(--ink)] mb-1">No medications logged</p>
            <p className="text-sm text-[var(--muted)] mb-5">Track prescriptions and treatments to keep your pet&apos;s history complete.</p>
            {!showForm && (
              <button onClick={openAdd} className="btn-primary">
                <Plus className="w-4 h-4" />
                Add first medication
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--off)]">
              <tr>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Medication</th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide hidden sm:table-cell">Dosage / Frequency</th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide hidden md:table-cell">Duration</th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const status = MEDICATION_STATUS_CONFIG[m.status] ?? MEDICATION_STATUS_CONFIG.active;
                const StatusIcon = STATUS_ICONS[m.status] ?? STATUS_ICONS.active;
                const isDeleting = deletingId === m.id;
                return (
                  <tr key={m.id} className="border-t border-[var(--border)] hover:bg-[var(--off)] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-[var(--ink)]">{m.name}</p>
                      {m.prescribedBy && <p className="text-xs text-[var(--muted)] mt-0.5">{m.prescribedBy}</p>}
                      {(m.dosage || m.frequency) && (
                        <p className="text-xs text-[var(--muted)] mt-0.5 sm:hidden">
                          {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] hidden sm:table-cell">
                      {m.dosage || m.frequency
                        ? <span>{[m.dosage, m.frequency].filter(Boolean).join(" · ")}</span>
                        : <span className="text-[var(--faint)]">–</span>}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] hidden md:table-cell">
                      {formatDateShort(m.startDate)}
                      {m.endDate ? ` → ${formatDateShort(m.endDate)}` : " → ongoing"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${status.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(m.id)}
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
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-lg hover:bg-[var(--teal-light)] text-[var(--muted)] hover:text-[var(--teal)] transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(m.id)}
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
