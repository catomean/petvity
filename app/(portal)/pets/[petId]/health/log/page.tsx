"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EMOTIONAL_METRICS, PHYSICAL_METRICS, HEALTH_METRIC_CONFIG } from "@/lib/config/health-metrics";

export default function LogHealthPage() {
  const router = useRouter();
  const { petId } = useParams<{ petId: string }>();

  const today = new Date().toISOString().slice(0, 10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: today,
    // Physical — stored in raw units (grams, centidegrees, bpm)
    weightKg: "",
    temperatureC: "",
    heartRateBpm: "",
    // Emotional — 1–5
    energy: "",
    mood: "",
    anxiety: "",
    socialization: "",
    notes: "",
  });

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
      router.push(`/portal/pets/${petId}/health`);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-6">
        Log health metrics
      </h1>

      {error && (
        <p className="mb-4 text-sm text-[var(--danger)] bg-red-50 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-[var(--border)] p-6 flex flex-col gap-6"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
          />
        </div>

        {/* Physical */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-3">
            Physical
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                placeholder="e.g. 8.5"
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.temperatureC}
                onChange={(e) => setForm({ ...form, temperatureC: e.target.value })}
                placeholder="e.g. 38.5"
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
                Heart rate (bpm)
              </label>
              <input
                type="number"
                min="0"
                value={form.heartRateBpm}
                onChange={(e) => setForm({ ...form, heartRateBpm: e.target.value })}
                placeholder="e.g. 80"
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
              />
            </div>
          </div>
        </div>

        {/* Emotional */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-3">
            Emotional (1 = low, 5 = high)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {EMOTIONAL_METRICS.map((metricId) => {
              const def = HEALTH_METRIC_CONFIG[metricId];
              const fieldMap: Record<string, string> = {
                energy: form.energy,
                mood: form.mood,
                anxiety: form.anxiety,
                socialization: form.socialization,
              };
              return (
                <div key={metricId}>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
                    {def.label}
                  </label>
                  <select
                    value={fieldMap[metricId]}
                    onChange={(e) =>
                      setForm({ ...form, [metricId]: e.target.value })
                    }
                    className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
                  >
                    <option value="">–</option>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {def.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
            Notes
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any observations today…"
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
