import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Thermometer, Heart, Weight,
  Zap, Smile, Wind, Users, CheckCircle,
} from "lucide-react";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { HEALTH_METRIC_CONFIG, getNormalRange } from "@/lib/config/health-metrics";

type Params = { params: Promise<{ speciesId: string; locale: string }> };

/** Statically render dog, cat, horse. "other" has no useful health ranges. */
export function generateStaticParams() {
  return [
    { speciesId: "dog" },
    { speciesId: "cat" },
    { speciesId: "horse" },
  ];
}

const PHYSICAL_INFO = [
  { id: "temperature" as const, icon: Thermometer, unit: "°C", label: "Body temperature" },
  { id: "heart_rate"  as const, icon: Heart,       unit: " bpm", label: "Resting heart rate" },
  { id: "weight"      as const, icon: Weight,       unit: " kg", label: "Weight range" },
] as const;

const EMOTIONAL_INFO = [
  { id: "energy"        as const, icon: Zap,   desc: "How active and lively your pet feels. Low energy can signal illness or pain." },
  { id: "mood"          as const, icon: Smile, desc: "Overall happiness and contentment. Tracks emotional wellbeing over time." },
  { id: "anxiety"       as const, icon: Wind,  desc: "Calm vs. stressed. High anxiety is a key indicator of unmet needs or fear." },
  { id: "socialization" as const, icon: Users, desc: "Engagement with people and other animals. Withdrawal can be an early health signal." },
] as const;

const SPECIES_BLURB: Partial<Record<SpeciesId, string>> = {
  dog: "Dogs are highly expressive animals whose mood, energy, and body condition change visibly day to day. Consistent tracking lets you catch weight loss, lethargy, or anxiety before a vet visit is urgent.",
  cat: "Cats are experts at hiding discomfort. Subtle changes in activity level, appetite, and social behaviour are often the first signs of illness. Daily logging surfaces patterns that are easy to miss.",
  horse: "Horses require careful monitoring of temperature, heart rate, and weight — small deviations can indicate colic, laminitis, or infection. Petvity makes it easy to spot trends before they become emergencies.",
};

const CARE_TIPS: Partial<Record<SpeciesId, string[]>> = {
  dog: [
    "Weigh monthly — weight change > 10% warrants a vet check",
    "Normal temperature: 38.0–39.0 °C (rectal). Anything above 39.5 °C is fever.",
    "Heart rate varies by size: small breeds 100–140 bpm, large breeds 60–100 bpm",
    "Energy dips lasting > 2 days are worth logging and watching closely",
    "Track mood after major changes (new pet, house move, routine shift)",
  ],
  cat: [
    "Cats are obligate carnivores — even mild weight loss can indicate illness",
    "Normal temperature: 38.0–39.25 °C. Cats run slightly higher than dogs.",
    "Heart rate at rest: 120–220 bpm — a wide range, consistent baseline matters",
    "A sudden drop in socialization score is a key early-warning signal in cats",
    "Anxiety spikes correlate with litter box issues, hiding, or over-grooming",
  ],
  horse: [
    "Weigh weekly with a weight tape — horses fluctuate with season and workload",
    "Normal temperature: 37.5–38.5 °C. Fever above 38.5 °C warrants investigation.",
    "Resting heart rate 28–44 bpm. Above 50 at rest is a veterinary concern.",
    "Daily gut sounds and manure output are as important as temperature",
    "Anxiety tracking helps identify tack fit problems, social stress, or pain",
  ],
};

export default async function SpeciesGuidePage({ params }: Params) {
  const { speciesId } = await params;
  const species = SPECIES_CONFIG[speciesId as SpeciesId];
  if (!species || speciesId === "other") notFound();

  const tempRange = getNormalRange("temperature", species.id);
  const hrRange   = getNormalRange("heart_rate", species.id);
  const wtRange   = getNormalRange("weight", species.id);

  const rangeValues = {
    temperature: {
      min: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRange.min),
      max: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRange.max),
    },
    heart_rate: { min: hrRange.min, max: hrRange.max },
    weight: {
      min: HEALTH_METRIC_CONFIG.weight.toDisplay(wtRange.min),
      max: HEALTH_METRIC_CONFIG.weight.toDisplay(wtRange.max),
    },
  };

  const blurb = SPECIES_BLURB[species.id];
  const tips  = CARE_TIPS[species.id] ?? [];

  return (
    <>
      <MarketingNav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-[var(--teal-light)] to-white py-16 lg:py-24">
          <div className="section-inner text-center">
            <div className="text-7xl mb-4">{species.emoji}</div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--ink)] mb-4">
              {species.label} Health Tracking
            </h1>
            <p className="text-lg text-[var(--ink2)] max-w-2xl mx-auto mb-8 leading-relaxed">
              {blurb}
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/register" className="btn-primary text-base px-6 py-3">
                Track my {species.label.toLowerCase()}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/features" className="btn-outline text-base px-6 py-3">
                See all features
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-10 flex-wrap text-sm text-[var(--muted)]">
              <span>Lifespan: {species.typicalLifespanYears.min}–{species.typicalLifespanYears.max} years</span>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <span>{species.commonBreeds.length} breeds supported</span>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <span>7 tracked health metrics</span>
            </div>
          </div>
        </section>

        {/* ── Normal health ranges ─────────────────────────────────────── */}
        <section className="py-16 lg:py-20">
          <div className="section-inner">
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--ink)] mb-2 text-center">
              Normal health ranges for {species.label.toLowerCase()}s
            </h2>
            <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
              Petvity compares every logged metric against these species-specific baselines and
              flags anything outside the normal range automatically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {PHYSICAL_INFO.map(({ id, icon: Icon, unit, label }) => {
                const range = rangeValues[id];
                return (
                  <div key={id} className="card p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-[var(--teal)]" />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-1">{label}</p>
                    <p className="text-xl font-bold text-[var(--ink)]">
                      {range.min}–{range.max}
                      <span className="text-sm font-normal text-[var(--muted)] ms-1">{unit}</span>
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {HEALTH_METRIC_CONFIG[id].description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Emotional metrics ────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-[var(--off)]">
          <div className="section-inner">
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--ink)] mb-2 text-center">
              Emotional health matters too
            </h2>
            <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
              Beyond physical vitals, Petvity tracks four emotional dimensions that form your
              pet&apos;s Digital Twin — a living portrait of how they&apos;re really feeling.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {EMOTIONAL_INFO.map(({ id, icon: Icon, desc }) => (
                <div key={id} className="card p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[var(--teal)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink)] mb-1">
                      {HEALTH_METRIC_CONFIG[id].label}
                    </p>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Common breeds ────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20">
          <div className="section-inner">
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--ink)] mb-2 text-center">
              Supported {species.label.toLowerCase()} breeds
            </h2>
            <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
              Start with a breed from the list below or select &ldquo;Mixed / Other&rdquo; — the
              health ranges automatically adjust to your {species.label.toLowerCase()}&apos;s species.
            </p>

            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
              {species.commonBreeds.map((breed) => (
                <span
                  key={breed}
                  className="bg-[var(--teal-light)] text-[var(--teal)] text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {breed}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Care tips ────────────────────────────────────────────────── */}
        {tips.length > 0 && (
          <section className="py-16 lg:py-20 bg-[var(--off)]">
            <div className="section-inner">
              <h2 className="text-2xl lg:text-3xl font-bold text-[var(--ink)] mb-2 text-center">
                {species.label} health monitoring tips
              </h2>
              <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
                What to watch for when tracking your {species.label.toLowerCase()}&apos;s health.
              </p>

              <ul className="space-y-3 max-w-2xl mx-auto">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 card p-4">
                    <CheckCircle className="w-5 h-5 text-[var(--green)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--ink2)] leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-[var(--teal-light)] to-white">
          <div className="section-inner text-center">
            <div className="text-5xl mb-4">{species.emoji}</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[var(--ink)] mb-4">
              Ready to start tracking your {species.label.toLowerCase()}?
            </h2>
            <p className="text-[var(--ink2)] max-w-xl mx-auto mb-8">
              Free forever. Log daily health data, get automatic wellness signals, and build
              a complete health record you can share with your vet.
            </p>
            <Link href="/register" className="btn-primary text-base px-8 py-3">
              Create a free account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
