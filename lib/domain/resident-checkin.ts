/**
 * Deterministic daily check-in generator for the resident pet.
 *
 * Values are seeded from the calendar date, so the series is continuous and
 * reproducible (re-running a day yields the same row) while still looking
 * like a life: weight drifts on a slow seasonal curve, moods wobble, roughly
 * one day in eleven is an anxious one (vacuum day), and some days carry a
 * note. Everything stays inside the cat normal ranges except the deliberate
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

const NOTES = [
  "Spent the whole morning in the kitchen sunbeam. Purring at industrial volume.",
  "Chased the red dot for ten minutes, then pretended it never happened.",
  "Vacuum day. We are not amused.",
  "Brought a toy mouse to breakfast. Very proud.",
  "Long nap on the warm laptop. Productivity (mine) at zero.",
  "Extra zoomies at 6am. The hallway survived.",
  "Sat by the window chattering at pigeons for an hour.",
  "New cardboard box arrived. It is home now.",
  "Ate slowly today, then demanded seconds an hour later.",
  "Groomed to perfection. Ignored me elegantly all afternoon.",
];

/** Day index since a fixed epoch — drives slow, continuous curves. */
function dayIndex(dateStr: string): number {
  return Math.floor(Date.parse(dateStr + "T00:00:00Z") / 86_400_000);
}

export function generateResidentCheckin(dateStr: string): ResidentCheckin {
  const day = dayIndex(dateStr);
  const rand = prng(day * 2654435761);

  // Weight: 4.3 kg base, ±120 g seasonal curve over ~90 days, ±25 g daily noise
  const seasonal = Math.sin((day / 90) * 2 * Math.PI) * 120;
  const weightGrams = Math.round(4300 + seasonal + (rand() - 0.5) * 50);

  // Temperature: 38.4–38.9 °C (cat normal 38.0–39.25)
  const temperatureCentidegrees = 3840 + Math.round(rand() * 50);

  // Heart rate: 150–185 bpm (cat normal 120–220)
  const heartRateBpm = 150 + Math.round(rand() * 35);

  const anxiousDay = day % 11 === 0; // roughly every ~11 days
  const lazyDay = rand() < 0.2;

  const energy = anxiousDay ? 3 : lazyDay ? 3 : rand() < 0.55 ? 4 : 5;
  const mood = anxiousDay ? 3 : rand() < 0.4 ? 4 : 5;
  const anxiety = anxiousDay ? 4 : rand() < 0.7 ? 1 : 2;
  const socialization = anxiousDay ? 2 : rand() < 0.5 ? 4 : 5;

  const notes = anxiousDay
    ? NOTES[2]
    : rand() < 0.3
      ? NOTES[Math.floor(rand() * NOTES.length)]
      : null;

  return { weightGrams, temperatureCentidegrees, heartRateBpm, energy, mood, anxiety, socialization, notes };
}
