import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Thermometer, Heart, Weight,
  Zap, Smile, Wind, Users, CheckCircle,
} from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { HEALTH_METRIC_CONFIG, getNormalRange } from "@/lib/config/health-metrics";
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

type Params = { params: Promise<{ speciesId: string; locale: string }> };

/* ── Static lookup tables — keys map to speciesGuide namespace ── */

const PHYS_LABEL_KEY = {
  temperature: "physTempLabel",
  heart_rate:  "physHeartRateLabel",
  weight:      "physWeightLabel",
} as const;

const PHYS_DESC_KEY = {
  temperature: "physTempDesc",
  heart_rate:  "physHeartRateDesc",
  weight:      "physWeightDesc",
} as const;

const EMOT_DESC_KEY: Record<string, string> = {
  energy:        "emotEnergyDesc",
  mood:          "emotMoodDesc",
  anxiety:       "emotAnxietyDesc",
  socialization: "emotSocializationDesc",
};

const EMOT_LABEL_KEY: Record<string, string> = {
  energy:        "emotEnergyLabel",
  mood:          "emotMoodLabel",
  anxiety:       "emotAnxietyLabel",
  socialization: "emotSocializationLabel",
};

const SPECIES_BLURB_KEY: Partial<Record<SpeciesId, string>> = {
  dog:       "dogBlurb",
  cat:       "catBlurb",
  horse:     "horseBlurb",
  bird:      "birdBlurb",
  rabbit:    "rabbitBlurb",
  guinea_pig:"guineaPigBlurb",
  hamster:   "hamsterBlurb",
  reptile:   "reptileBlurb",
  fish:      "fishBlurb",
};

const CARE_TIP_KEYS: Partial<Record<SpeciesId, string[]>> = {
  dog:       ["dogTip1","dogTip2","dogTip3","dogTip4","dogTip5"],
  cat:       ["catTip1","catTip2","catTip3","catTip4","catTip5"],
  horse:     ["horseTip1","horseTip2","horseTip3","horseTip4","horseTip5"],
  bird:      ["birdTip1","birdTip2","birdTip3","birdTip4","birdTip5"],
  rabbit:    ["rabbitTip1","rabbitTip2","rabbitTip3","rabbitTip4","rabbitTip5"],
  guinea_pig:["guineaPigTip1","guineaPigTip2","guineaPigTip3","guineaPigTip4","guineaPigTip5"],
  hamster:   ["hamsterTip1","hamsterTip2","hamsterTip3","hamsterTip4","hamsterTip5"],
  reptile:   ["reptileTip1","reptileTip2","reptileTip3","reptileTip4","reptileTip5"],
  fish:      ["fishTip1","fishTip2","fishTip3","fishTip4","fishTip5"],
};

/* ── Physical metrics shown in the ranges section ── */

const PHYSICAL_INFO = [
  { id: "temperature" as const, icon: Thermometer, unit: "°C" },
  { id: "heart_rate"  as const, icon: Heart,       unit: " bpm" },
  { id: "weight"      as const, icon: Weight,       unit: " kg" },
] as const;

const EMOTIONAL_INFO = [
  { id: "energy"        as const, icon: Zap   },
  { id: "mood"          as const, icon: Smile },
  { id: "anxiety"       as const, icon: Wind  },
  { id: "socialization" as const, icon: Users },
] as const;

/** Statically render all trackable species. "other" has no species-specific ranges. */
export function generateStaticParams() {
  return [
    { speciesId: "dog" },
    { speciesId: "cat" },
    { speciesId: "horse" },
    { speciesId: "bird" },
    { speciesId: "rabbit" },
    { speciesId: "guinea_pig" },
    { speciesId: "hamster" },
    { speciesId: "reptile" },
    { speciesId: "fish" },
  ];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { speciesId, locale } = await params;
  const def = SPECIES_CONFIG[speciesId as SpeciesId];
  if (!def || def.id === "other") return { title: APP.name };

  const [t, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "speciesGuide" }),
    getTranslations({ locale, namespace: "public" }),
  ]);
  const speciesName = tPub(`species_${speciesId}` as Parameters<typeof tPub>[0]);
  const title = t("metaTitle", { species: speciesName, app: APP.name });
  const description = t("metaDesc", { species: speciesName, app: APP.name });

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: buildAlternates(`/species/${speciesId}`),
  };
}

export default async function SpeciesGuidePage({ params }: Params) {
  const { speciesId, locale } = await params;
  const species = SPECIES_CONFIG[speciesId as SpeciesId];
  if (!species || speciesId === "other") notFound();

  const [t, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "speciesGuide" }),
    getTranslations({ locale, namespace: "public" }),
  ]);

  const speciesName = tPub(`species_${speciesId}` as Parameters<typeof tPub>[0]);
  const speciesLc   = speciesName.toLowerCase();

  const tempRange = getNormalRange("temperature", species.id);
  const hrRange   = getNormalRange("heart_rate",  species.id);
  const wtRange   = getNormalRange("weight",       species.id);

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

  const blurbKey  = SPECIES_BLURB_KEY[species.id];
  const tipKeys   = CARE_TIP_KEYS[species.id] ?? [];

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[var(--teal-light)] to-white py-16 lg:py-24">
        <div className="section-inner text-center">
          <div className="text-7xl mb-4">{species.emoji}</div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--ink)] mb-4">
            {t("heroTitle", { species: speciesName })}
          </h1>
          {blurbKey && (
            <p className="text-lg text-[var(--ink2)] max-w-2xl mx-auto mb-8 leading-relaxed">
              {t(blurbKey as Parameters<typeof t>[0])}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-primary text-base px-6 py-3">
              {t("heroTrackCta", { species: speciesName })}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/features" className="btn-outline text-base px-6 py-3">
              {t("heroFeaturesCta")}
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap text-sm text-[var(--muted)]">
            <span>{t("heroLifespan", { min: species.typicalLifespanYears.min, max: species.typicalLifespanYears.max })}</span>
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <span>{t("heroBreedCount", { count: species.commonBreeds.length })}</span>
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <span>{t("heroMetricCount")}</span>
          </div>
        </div>
      </section>

      {/* ── Normal health ranges ─────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="section-inner">
          <h2 className="text-2xl lg:text-3xl font-bold text-[var(--ink)] mb-2 text-center">
            {t("rangesTitle", { species: speciesName })}
          </h2>
          <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
            {t("rangesDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {PHYSICAL_INFO.map(({ id, icon: Icon, unit }) => {
              const range = rangeValues[id];
              return (
                <div key={id} className="card p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-[var(--teal)]" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-1">
                    {t(PHYS_LABEL_KEY[id])}
                  </p>
                  <p className="text-xl font-bold text-[var(--ink)]">
                    {range.min}–{range.max}
                    <span className="text-sm font-normal text-[var(--muted)] ms-1">{unit}</span>
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {t(PHYS_DESC_KEY[id])}
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
            {t("emotionalTitle")}
          </h2>
          <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
            {t("emotionalDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {EMOTIONAL_INFO.map(({ id, icon: Icon }) => (
              <div key={id} className="card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--teal)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)] mb-1">
                    {t((EMOT_LABEL_KEY[id] ?? id) as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {t((EMOT_DESC_KEY[id] ?? id) as Parameters<typeof t>[0])}
                  </p>
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
            {t("breedsTitle", { species: speciesName })}
          </h2>
          <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
            {t("breedsDesc", { species: speciesLc })}
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
      {tipKeys.length > 0 && (
        <section className="py-16 lg:py-20 bg-[var(--off)]">
          <div className="section-inner">
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--ink)] mb-2 text-center">
              {t("tipsTitle", { species: speciesName })}
            </h2>
            <p className="text-[var(--muted)] text-center mb-10 max-w-xl mx-auto">
              {t("tipsDesc", { species: speciesLc })}
            </p>

            <ul className="space-y-3 max-w-2xl mx-auto">
              {tipKeys.map((key) => (
                <li key={key} className="flex items-start gap-3 card p-4">
                  <CheckCircle className="w-5 h-5 text-[var(--green-text)] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--ink2)] leading-relaxed">
                    {t(key as Parameters<typeof t>[0])}
                  </span>
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
            {t("ctaTitle", { species: speciesLc })}
          </h2>
          <p className="text-[var(--ink2)] max-w-xl mx-auto mb-8">
            {t("ctaDesc")}
          </p>
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            {t("ctaButton")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
