/**
 * Deterministic daily check-in generator for the resident pets.
 *
 * Values are seeded from the calendar date (and a per-pet salt), so each
 * series is continuous and reproducible (re-running a day yields the same
 * row) while still looking like a life: weight drifts on a slow seasonal
 * curve, moods wobble, roughly one day in N is an anxious one (vacuum day
 * for the cat, thunderstorm for the dog), and some days carry a note.
 * Everything stays inside the species' normal ranges except the deliberate
 * anxiety spikes — so the wellness signal is mostly healthy with the
 * occasional, realistic "watch".
 */

export interface ResidentCheckin {
  weightGrams: number;
  temperatureCentidegrees: number;
  heartRateBpm: number;
  energy: number;
  mood: number;
  anxiety: number;
  socialization: number;
  notes: string | null;
}

export interface CheckinProfile {
  /** Distinguishes pets sharing a date so their series differ. 0 = the original cat. */
  seedSalt: number;
  baseWeightGrams: number;
  /** Peak amplitude of the ~90-day seasonal weight curve. */
  seasonalAmplitudeGrams: number;
  /** Daily weight jitter total span (± half of this). */
  weightJitterGrams: number;
  tempMinCentidegrees: number;
  tempSpanCentidegrees: number;
  heartRateMin: number;
  heartRateSpan: number;
  /** Every Nth day is an anxious one. */
  anxiousEveryNDays: number;
  /** Note shown on anxious days (index into notes) + general pool. */
  anxiousNote: string;
  notes: string[];
}

/** mulberry32 — tiny deterministic PRNG */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Day index since a fixed epoch — drives slow, continuous curves. */
function dayIndex(dateStr: string): number {
  return Math.floor(Date.parse(dateStr + "T00:00:00Z") / 86_400_000);
}

export function generateResidentCheckin(dateStr: string, profile: CheckinProfile): ResidentCheckin {
  const day = dayIndex(dateStr);
  const rand = prng((day * 2654435761) ^ profile.seedSalt);

  const seasonal = Math.sin((day / 90) * 2 * Math.PI) * profile.seasonalAmplitudeGrams;
  const weightGrams = Math.round(
    profile.baseWeightGrams + seasonal + (rand() - 0.5) * profile.weightJitterGrams,
  );

  const temperatureCentidegrees =
    profile.tempMinCentidegrees + Math.round(rand() * profile.tempSpanCentidegrees);

  const heartRateBpm = profile.heartRateMin + Math.round(rand() * profile.heartRateSpan);

  const anxiousDay = day % profile.anxiousEveryNDays === 0;
  const lazyDay = rand() < 0.2;

  const energy = anxiousDay ? 3 : lazyDay ? 3 : rand() < 0.55 ? 4 : 5;
  const mood = anxiousDay ? 3 : rand() < 0.4 ? 4 : 5;
  const anxiety = anxiousDay ? 4 : rand() < 0.7 ? 1 : 2;
  const socialization = anxiousDay ? 2 : rand() < 0.5 ? 4 : 5;

  const notes = anxiousDay
    ? profile.anxiousNote
    : rand() < 0.3
      ? profile.notes[Math.floor(rand() * profile.notes.length)]
      : null;

  return {
    weightGrams,
    temperatureCentidegrees,
    heartRateBpm,
    energy,
    mood,
    anxiety,
    socialization,
    notes,
  };
}
