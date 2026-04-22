"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, ChevronLeft, X, FileText,
  Stethoscope, Syringe, Pill, Scissors, FlaskConical,
  Smile, Sparkles, MoreHorizontal,
  Pencil, Trash2,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils/format";

/* ── SSOT: record type config ───────────────────────────────────────────── */
const RECORD_TYPE_CONFIG = {
  vet_visit:   { label: "Vet visit",    icon: Stethoscope, color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  vaccination: { label: "Vaccination",  icon: Syringe,     color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  medication:  { label: "Medication",   icon: Pill,        color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  surgery:     { label: "Surgery",      icon: Scissors,    color: "text-[var(--danger)]", bg: "bg-[var(--danger-bg)]" },
  lab_result:  { label: "Lab result",   icon: FlaskConical,color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  dental:      { label: "Dental",       icon: Smile,       color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  grooming:    { label: "Grooming",     icon: Sparkles,    color: "text-[var(--accent)]", bg: "bg-[var(--accent-light)]" },
  other:       { label: "Other",        icon: MoreHorizontal, color: "text-[var(--muted)]", bg: "bg-[var(--off)]" },
} as const;

type RecordType = keyof typeof RECORD_TYPE_CONFIG;

interface HealthRecord {
  id: string;
  type: RecordType;
  title: string;
  date: string;
  vetName: string | null;
  clinic: string | null;
  notes: string | null;
}

interface FormState {
  type: RecordType;
  title: string;
  date: string;
  vetName: string;
  clinic: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  type: "vet_visit",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  vetName: "",
  clinic: "",
  notes: "",
};

export default function HealthRecordsPage() {
  const { petId } = useParams<{ petId: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [petName, setPetName] = useState("");
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [petRes, recRes] = await Promise.all([
        fetch(`/api/pets/${petId}`),
        fetch(`/api/health/records?petId=${petId}`),
      ]);
      if (petRes.ok) setPetName((await petRes.json()).data?.name ?? "");
      if (recRes.ok) setRecords((await recRes.json()).data ?? []);
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

  function openEdit(r: HealthRecord) {
    setEditingId(r.id);
    setDeletingId(null);
    setForm({
      type: r.type,
      title: r.title,
      date: r.date,
      vetName: r.vetName ?? "",
      clinic: r.clinic ?? "",
      notes: r.notes ?? "",
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
    const url = isEdit ? `/api/health/records/${editingId}` : "/api/health/records";
    const method = isEdit ? "PATCH" : "POST";

    const body = {
      ...(isEdit ? {} : { petId }),
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      vetName: form.vetName.trim() || null,
      clinic: form.clinic.trim() || null,
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
      setRecords((prev) => prev.map((r) => (r.id === editingId ? data.data : r)));
    } else {
      setRecords((prev) => [data.data, ...prev]);
    }
    closeForm();
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/health/records/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
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
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Health Records</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Vet visits, treatments, lab results and more
          </p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add record
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-6 mb-6 border-2 border-[var(--teal-light)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[var(--teal)]" />
              </div>
              <h2 className="font-semibold text-[var(--ink)]">
                {editingId ? "Edit health record" : "New health record"}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="btn-ghost p-1 rounded-lg"
            >
              <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>

          {error && <p className="alert-error mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Type <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                className="form-input"
                value={form.type}
                onChange={(e) => field("type", e.target.value as RecordType)}
              >
                {(Object.entries(RECORD_TYPE_CONFIG) as [RecordType, typeof RECORD_TYPE_CONFIG[RecordType]][]).map(
                  ([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  )
                )}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Date <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                required
                value={form.date}
                onChange={(e) => field("date", e.target.value)}
              />
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Title / summary <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Annual wellness exam, Spay surgery"
                required
                value={form.title}
                onChange={(e) => field("title", e.target.value)}
              />
            </div>

            {/* Vet */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Vet / practitioner
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="Dr. Smith"
                value={form.vetName}
                onChange={(e) => field("vetName", e.target.value)}
              />
            </div>

            {/* Clinic */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Clinic / hospital
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="City Animal Clinic"
                value={form.clinic}
                onChange={(e) => field("clinic", e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                Notes
                <span className="text-[var(--muted)] font-normal ms-1">(optional)</span>
              </label>
              <textarea
                className="form-input min-h-[80px] resize-y"
                placeholder="Diagnosis, treatment details, follow-up instructions…"
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? "Saving…" : editingId ? "Update record" : "Save record"}
              </button>
              <button type="button" onClick={closeForm} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">No records yet</p>
          <p className="text-sm text-[var(--muted)] mb-5">
            Log vet visits, treatments, and lab results to build a complete health history.
          </p>
          {!showForm && (
            <button onClick={openAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add first record
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const cfg = RECORD_TYPE_CONFIG[r.type] ?? RECORD_TYPE_CONFIG.other;
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="card p-4 flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--ink)] leading-snug">{r.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {cfg.label} · {formatDateShort(r.date)}
                        {r.vetName && ` · ${r.vetName}`}
                        {r.clinic && ` @ ${r.clinic}`}
                      </p>
                    </div>
                  </div>
                  {r.notes && (
                    <p className="text-sm text-[var(--ink2)] mt-2 leading-relaxed">{r.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
