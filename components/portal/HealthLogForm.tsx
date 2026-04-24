"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMOTIONAL_METRICS, HEALTH_METRIC_CONFIG, EMOTIONAL_SCALE_LABELS } from "@/lib/config/health-metrics";
type PhysicalHint = { min: number; max: number; unit: string } | null;

type InitialValues = {
  date: string;
  weightKg: string;
  temperatureC: string;
  heartRateBpm: string;
  energy: string;
  mood: string;
  anxiety: string;
  socialization: string;
  notes: string;
};

type Props = {
  petId: string;
  petName: string;
  weightHint: PhysicalHint;
  tempHint: PhysicalHint;
  hrHint: PhysicalHint;
  initialValues?: InitialValues;
};

const EMPTY_FORM: InitialValues = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  temperatureC: "",
  heartRateBpm: "",
  energy: "",
  mood: "",
  anxiety: "",
  socialization: "",
  notes: "",
};

export function HealthLogForm({ petId, petName, weightHint, tempHint, hrHint, initialValues }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<InitialValues>(initialValues ?? EMPTY_FORM);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = { date: form.date };

    if (form.weightKg) payload.weightGrams = Math.round(parseFloat(form.weightKg) * 1000);
    if (form.temperatureC) payload.temperatureCentidegrees = Math.round(parseFloat(form.temperatureC) * 100);
    if (form.heartRateBpm) payload.heartRateBpm = parseInt(form.heartRateBpm);
    if (form.energy) payload.energy = parseInt(form.energy);
    if (form.mood) payload.mood = parseInt(form.mood);
    if (form.anxiety) payload.anxiety = parseInt(form.anxiety);
    if (form.socialization) payload.socialization = parseInt(form.socialization);
    if (form.notes) payload.notes = form.notes;

    const res = await fetch(`/api/health/metrics/${petId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Failed to save.");
    } else {
      router.push(`/portal/pets/${petId}`);
    }
  }

  const physicalFields: {
    key: keyof typeof form;
    label: string;
    unit: string;
    step: string;
    placeholder: string;
    hint: PhysicalHint;
  }[] = [
    {
      key: "weightKg",
      label: "Weight",
      unit: "kg",
      step: "0.01",
      placeholder: weightHint ? `${weightHint.min}–${weightHint.max} ${weightHint.unit}` : "e.g. 8.5",
      hint: weightHint,
    },
    {
      key: "temperatureC",
      label: "Temperature",
      unit: "°C",
      step: "0.1",
      placeholder: tempHint ? `${tempHint.min}–${tempHint.max} ${tempHint.unit}` : "e.g. 38.5",
      hint: tempHint,
    },
    {
      key: "heartRateBpm",
      label: "Heart rate",
      unit: "bpm",
      step: "1",
      placeholder: hrHint ? `${hrHint.min}–${hrHint.max} bpm` : "e.g. 80",
      hint: hrHint,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="alert-error">{error}</p>}

      {/* Date */}
      <div className="card p-5">
        <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="form-input w-auto"
        />
      </div>

      {/* Physical */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
          Physical measurements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {physicalFields.map(({ key, label, unit, step, placeholder, hint }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                {label}
                <span className="text-[var(--muted)] font-normal ms-1">{unit}</span>
              </label>
              <input
                type="number"
                step={step}
                min="0"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="form-input"
              />
              {hint && (
                <p className="text-xs text-[var(--muted)] mt-1">
                  Normal for {petName}: {hint.min}–{hint.max} {hint.unit}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Emotional */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
          Emotional wellbeing
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {EMOTIONAL_METRICS.map((metricId) => {
            const def = HEALTH_METRIC_CONFIG[metricId];
            const labels = EMOTIONAL_SCALE_LABELS[metricId] ?? [];
            return (
              <div key={metricId}>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
                  {def.label}
                </label>
                <select
                  value={form[metricId as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [metricId]: e.target.value })}
                  className="form-input"
                >
                  <option value="">Not logged</option>
                  {Array.from(
                    { length: (def.scale?.max ?? 5) - (def.scale?.min ?? 1) + 1 },
                    (_, i) => (def.scale?.min ?? 1) + i,
                  ).map((v) => (
                    <option key={v} value={v}>
                      {v} — {labels[v - 1] ?? ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--muted)] mt-1">{def.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
          Notes <span className="text-[var(--faint)] font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Any observations, symptoms, or mood notes…"
          className="form-input resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : initialValues ? "Update check-in" : "Save check-in"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
