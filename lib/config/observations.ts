/**
 * SSOT for what is worth observing about a pet, and for which species.
 *
 * Why this exists separately from `health-metrics.ts`: that file models seven
 * metrics applied uniformly to all ten species. That is convenient and, for
 * several species, wrong in ways that matter:
 *
 *   - Body temperature is not a property a fish or a reptile *has* in the sense
 *     the field implies. They are ectotherms: a fish's body temperature is the
 *     water temperature, and a reptile's depends on where it is sitting in a
 *     thermal gradient. Asking an owner to log it produces a number with no
 *     meaning, or no number at all.
 *   - Heart rate is not measurable at home for a bird, a fish or a hamster.
 *     Asking for it trains owners to skip fields.
 *   - The signals that actually kill these animals were absent. A rabbit that
 *     has not eaten and not produced droppings for twelve hours is a medical
 *     emergency — gut stasis is the leading cause of death in pet rabbits, and
 *     nothing in the seven metrics captures it.
 *
 * So an observation declares which species it applies to, how often it is worth
 * asking, whether an owner can actually produce the answer, and what answer
 * means "call a vet". The daily set per species is deliberately small: an owner
 * has seconds, not minutes, and a form that asks for more than it needs is a
 * form that gets abandoned or filled in carelessly. Carelessly-filled health
 * data is worse than none, because it looks like signal.
 *
 * Clinical values here are typical published ranges for healthy adult animals
 * and are intended to prompt an owner to seek care, never to replace a vet's
 * judgement. They should be reviewed by a veterinarian before being presented
 * as guidance, and `REVIEW_STATUS` below records that they have not been.
 */

import type { SpeciesId } from "./species";

/** Whether a qualified vet has signed off on the clinical thresholds here.
 *  Displayed wherever these numbers are shown to an owner — an unreviewed
 *  threshold presented as authoritative is the failure mode to avoid. */
export const REVIEW_STATUS = {
  reviewedByVeterinarian: false,
  note: "Typical published ranges, compiled for product design. Not yet clinically reviewed.",
} as const;

/* ─── Vocabulary ──────────────────────────────────────────────────────────── */

/**
 * How often an observation earns a place in front of the owner.
 * `daily` is the scarcest resource in the product — five items is the ceiling.
 */
export type ObservationTier = "daily" | "periodic" | "episodic";

/** Who or what can produce the answer. Anything not `owner` must never appear
 *  in the daily check-in, because the owner cannot answer it unaided. */
export type ObservationSource = "owner" | "vet" | "device";

export type ObservationKind =
  /** 1–5 subjective scale. */
  | "scale5"
  /** A counted or measured number, with a unit. */
  | "quantity"
  /** Yes/no. The cheapest possible question — prefer it for daily items. */
  | "boolean"
  /** One of a small set of named states. */
  | "choice";

export type Urgency =
  /** Go now, or call an emergency service. Hours matter. */
  | "emergency"
  /** Speak to a vet today. */
  | "same_day"
  /** Worth a routine appointment. */
  | "routine";

export type RedFlag = {
  /** Stated in the owner's terms, not a formula. */
  when: string;
  urgency: Urgency;
  /** Why it is urgent. An alert without a reason gets dismissed. */
  because: string;
};

export type ObservationDef = {
  id: string;
  label: string;
  /** The literal question to put in front of the owner. If it cannot be
   *  phrased as a question an owner can answer in one breath, it does not
   *  belong in the `daily` tier. */
  question: string;
  tier: ObservationTier;
  kind: ObservationKind;
  source: ObservationSource;
  /** Species this is meaningful for. Never "all" by default — the point of
   *  this file is that very little is genuinely universal. */
  species: SpeciesId[];
  /**
   * How often to ask, for species where the default is wrong.
   *
   * A snake fed once a week cannot answer "did they eat today", and a rabbit
   * must be asked every single day. Same observation, different cadence — so
   * the cadence belongs to the pairing, not to the observation alone.
   */
  tierBySpecies?: Partial<Record<SpeciesId, ObservationTier>>;
  /**
   * Lower sorts first within a tier. Explicit because the daily set is capped:
   * if the cap were applied to catalogue order, adding an observation near the
   * top would silently push a more important one out of the owner's day.
   */
  priority: number;
  /** Why it earns a tap. Shown as help text; also the honesty check on whether
   *  the field should exist at all. */
  why: string;
  unit?: string;
  choices?: { value: string; label: string }[];
  redFlags?: RedFlag[];
};

const MAMMALS: SpeciesId[] = ["dog", "cat", "horse", "rabbit", "guinea_pig", "hamster"];
const ALL_BUT_FISH: SpeciesId[] = [...MAMMALS, "bird", "reptile", "other"];

/* ─── The catalogue ───────────────────────────────────────────────────────── */

export const OBSERVATIONS: ObservationDef[] = [
  /* ── Universal-ish daily signals ─────────────────────────────────────── */
  {
    id: "appetite",
    priority: 10,
    tierBySpecies: { reptile: "periodic" },
    label: "Appetite",
    question: "Did they eat normally today?",
    tier: "daily",
    kind: "choice",
    source: "owner",
    species: ALL_BUT_FISH,
    why:
      "Appetite falls before almost every illness becomes visible. It is the " +
      "one thing every owner already notices, which is why it costs nothing to ask.",
    choices: [
      { value: "normal", label: "Normal" },
      { value: "reduced", label: "Less than usual" },
      { value: "none", label: "Nothing at all" },
    ],
    redFlags: [
      {
        when: "A rabbit or guinea pig eats nothing for 12 hours",
        urgency: "emergency",
        because:
          "Their gut stops moving when it empties, and gut stasis becomes fatal " +
          "quickly. This is the single most common way pet rabbits die.",
      },
      {
        when: "A cat eats nothing for 24 hours",
        urgency: "same_day",
        because:
          "Cats that stop eating can develop hepatic lipidosis, a liver failure " +
          "driven by the fast itself rather than by the original illness.",
      },
    ],
  },
  {
    id: "energy",
    priority: 40,
    label: "Energy",
    question: "How active were they compared with a normal day?",
    tier: "daily",
    kind: "scale5",
    source: "owner",
    species: ALL_BUT_FISH,
    why: "A change from this animal's own baseline is the signal — not the absolute number.",
  },
  {
    id: "stool",
    priority: 20,
    tierBySpecies: { reptile: "periodic" },
    label: "Droppings",
    question: "Were their droppings normal?",
    tier: "daily",
    kind: "choice",
    source: "owner",
    // Not horses or birds: each has a more specific version below — a manure
    // count for colic, and droppings appearance for a bird. Asking both would
    // spend two of five daily slots on one question.
    species: ["dog", "cat", "rabbit", "guinea_pig", "hamster", "reptile", "other"],
    why:
      "Output is the cheapest window into the gut, and for small herbivores it " +
      "is the earliest warning there is.",
    choices: [
      { value: "normal", label: "Normal" },
      { value: "soft", label: "Soft or loose" },
      { value: "none", label: "None produced" },
      { value: "blood", label: "Blood present" },
    ],
    redFlags: [
      {
        when: "A rabbit or guinea pig produces no droppings for 12 hours",
        urgency: "emergency",
        because: "It means the gut has stopped. Paired with not eating, treat it as an emergency.",
      },
      {
        when: "Blood is present in any species",
        urgency: "same_day",
        because: "It is never normal and the cause ranges from diet to obstruction.",
      },
    ],
  },

  /* ── Small animals: weight is the daily signal ───────────────────────── */
  {
    id: "weight_small",
    priority: 25,
    label: "Weight",
    question: "What do the scales say today?",
    tier: "daily",
    kind: "quantity",
    unit: "g",
    source: "owner",
    species: ["bird", "hamster", "guinea_pig"],
    why:
      "Birds and small rodents hide illness — as prey animals, looking sick is " +
      "dangerous for them. Weight is the measurement that does not lie, which is " +
      "why bird keepers weigh daily in grams rather than weekly in kilograms.",
    redFlags: [
      {
        when: "A bird loses 10% of its body weight",
        urgency: "same_day",
        because:
          "By the time a bird looks unwell it is usually gravely ill. A 10% drop " +
          "is often the only warning you get.",
      },
    ],
  },

  /* ── Cats and dogs ───────────────────────────────────────────────────── */
  {
    id: "resting_respiratory_rate",
    priority: 80,
    label: "Resting breathing rate",
    question: "Breaths per minute while asleep or fully at rest",
    tier: "periodic",
    kind: "quantity",
    unit: "breaths/min",
    source: "owner",
    species: ["dog", "cat"],
    why:
      "The most useful number an owner can collect unaided. Count the chest rises " +
      "over 30 seconds while the animal sleeps and double it. It is the standard " +
      "home monitor for heart failure and it rises before an animal looks unwell.",
    redFlags: [
      {
        when: "Consistently above 30 breaths per minute while genuinely asleep",
        urgency: "same_day",
        because:
          "A sustained resting rate above 30 is the recognised threshold for " +
          "seeking assessment, particularly in an animal with a known heart murmur.",
      },
      {
        when: "Open-mouth breathing in a cat",
        urgency: "emergency",
        because: "Cats do not pant like dogs. It signals serious respiratory distress.",
      },
    ],
  },
  {
    id: "urination",
    priority: 30,
    label: "Urination",
    question: "Did they pass urine normally?",
    tier: "daily",
    kind: "choice",
    source: "owner",
    species: ["cat", "dog"],
    why:
      "For a male cat this is the difference between a normal day and a " +
      "life-threatening emergency, and a litter tray makes it observable.",
    choices: [
      { value: "normal", label: "Normal" },
      { value: "more", label: "More than usual" },
      { value: "straining", label: "Straining, little or nothing" },
      { value: "blood", label: "Blood present" },
    ],
    redFlags: [
      {
        when: "A cat, especially a male, strains without producing urine",
        urgency: "emergency",
        because:
          "A blocked urethra is fatal within about 24–48 hours and is one of the " +
          "few true emergencies an owner can spot at home.",
      },
      {
        when: "Drinking and urinating noticeably more, over days",
        urgency: "routine",
        because:
          "Increased thirst is an early sign of kidney disease, diabetes and " +
          "hyperthyroidism — all far more treatable when caught early.",
      },
    ],
  },
  {
    id: "vomiting",
    priority: 65,
    label: "Vomiting",
    question: "Any vomiting today?",
    tier: "episodic",
    kind: "boolean",
    source: "owner",
    species: ["dog", "cat"],
    why: "Frequency and pattern matter more than any single episode, and only a log shows pattern.",
    redFlags: [
      {
        when: "Repeated unproductive retching in a deep-chested dog, with a swollen belly",
        urgency: "emergency",
        because: "It suggests bloat and gastric torsion, which is fatal within hours.",
      },
    ],
  },
  {
    id: "body_condition_score",
    priority: 90,
    label: "Body condition",
    question: "Can you feel the ribs easily, and is there a waist from above?",
    tier: "periodic",
    kind: "choice",
    source: "owner",
    species: ["dog", "cat", "horse", "rabbit"],
    why:
      "More meaningful than raw weight, because it does not depend on breed or " +
      "frame. Obesity is the most common preventable welfare problem in pets, and " +
      "owners consistently under-estimate it.",
    choices: [
      { value: "underweight", label: "Ribs and spine visible" },
      { value: "lean", label: "Ribs easily felt, clear waist" },
      { value: "ideal", label: "Ribs felt with light pressure, visible waist" },
      { value: "overweight", label: "Ribs hard to feel, waist disappearing" },
      { value: "obese", label: "Cannot feel ribs, no waist" },
    ],
  },

  /* ── Herbivores with continuously growing teeth ──────────────────────── */
  {
    id: "vitamin_c",
    priority: 35,
    label: "Vitamin C",
    question: "Did they get vitamin C today?",
    tier: "daily",
    kind: "boolean",
    source: "owner",
    species: ["guinea_pig"],
    why:
      "Guinea pigs are one of the few mammals that cannot make their own vitamin C, " +
      "so it has to come from the diet every day. Without it they develop scurvy.",
  },
  {
    id: "dental",
    priority: 95,
    label: "Teeth",
    question: "Any drooling, dropped food, or difficulty chewing?",
    tier: "periodic",
    kind: "boolean",
    source: "owner",
    species: ["rabbit", "guinea_pig", "horse", "dog", "cat"],
    why:
      "Rabbit, guinea pig and horse teeth grow continuously and wear unevenly. " +
      "Overgrowth stops them eating, which for a small herbivore starts the gut " +
      "stasis cascade.",
  },

  /* ── Horses ──────────────────────────────────────────────────────────── */
  {
    id: "manure_output",
    priority: 15,
    label: "Manure output",
    question: "Roughly how many piles since yesterday?",
    tier: "daily",
    kind: "quantity",
    unit: "piles",
    source: "owner",
    species: ["horse"],
    why:
      "A drop in manure output is the earliest practical warning of colic, which " +
      "is the leading cause of death in horses outside old age.",
    redFlags: [
      {
        when: "Little or no manure, with pawing, flank-watching or rolling",
        urgency: "emergency",
        because: "These are colic signs and some causes are surgical within hours.",
      },
    ],
  },
  {
    id: "lameness",
    priority: 70,
    tierBySpecies: { horse: "daily" },
    label: "Movement",
    question: "Are they moving evenly on all four legs?",
    tier: "periodic",
    kind: "boolean",
    source: "owner",
    species: ["horse", "dog", "cat", "rabbit"],
    why:
      "Lameness is common, progressive and easy to normalise as 'getting older'. " +
      "A dated log is what turns a vague impression into a trend.",
    redFlags: [
      {
        when: "A horse reluctant to move, rocking weight onto its heels",
        urgency: "emergency",
        because: "It suggests laminitis, where hours of delay change the outcome permanently.",
      },
    ],
  },

  /* ── Reptiles: the enclosure is the patient ──────────────────────────── */
  {
    id: "enclosure_warm_temp",
    priority: 5,
    label: "Basking temperature",
    question: "Temperature at the warm end today",
    tier: "daily",
    kind: "quantity",
    unit: "°C",
    source: "device",
    species: ["reptile"],
    why:
      "A reptile cannot generate its own heat, so its digestion and immune " +
      "function are set by the enclosure. Husbandry failure, not infection, is " +
      "behind most pet reptile illness — so the enclosure is what to measure.",
  },
  {
    id: "enclosure_cool_temp",
    priority: 6,
    label: "Cool end temperature",
    question: "Temperature at the cool end today",
    tier: "daily",
    kind: "quantity",
    unit: "°C",
    source: "device",
    species: ["reptile"],
    why:
      "A gradient matters more than any single temperature: the animal needs " +
      "somewhere to go to be cooler, or it cannot regulate at all.",
  },
  {
    id: "humidity",
    priority: 7,
    label: "Humidity",
    question: "Humidity reading today",
    tier: "daily",
    kind: "quantity",
    unit: "%",
    source: "device",
    species: ["reptile"],
    why: "Wrong humidity causes retained shed and respiratory infection, and it is invisible without a gauge.",
  },
  {
    id: "uvb_bulb_age",
    priority: 115,
    label: "UVB bulb",
    question: "When was the UVB bulb last replaced?",
    tier: "episodic",
    kind: "quantity",
    unit: "months ago",
    source: "owner",
    species: ["reptile"],
    why:
      "A UVB bulb keeps emitting visible light long after its UVB output has " +
      "decayed. It looks like it is working while the animal slowly develops " +
      "metabolic bone disease. This is the classic invisible husbandry failure, " +
      "and a calendar reminder prevents it outright.",
    redFlags: [
      {
        when: "Older than the manufacturer's replacement interval, typically 6–12 months",
        urgency: "routine",
        because: "Output has likely fallen below what the animal needs to use calcium.",
      },
    ],
  },
  {
    id: "shed_quality",
    priority: 110,
    label: "Shedding",
    question: "Did the last shed come away completely?",
    tier: "episodic",
    kind: "choice",
    source: "owner",
    species: ["reptile"],
    why:
      "Retained shed around toes or the tail tip constricts and causes them to " +
      "be lost. It is also the most reliable sign that humidity is wrong.",
    choices: [
      { value: "complete", label: "Complete, in one piece" },
      { value: "patchy", label: "Patchy" },
      { value: "retained", label: "Stuck around toes, tail or eyes" },
    ],
  },

  /* ── Fish: the water is the patient ──────────────────────────────────── */
  {
    id: "water_temp",
    priority: 5,
    label: "Water temperature",
    question: "Water temperature today",
    tier: "daily",
    kind: "quantity",
    unit: "°C",
    source: "device",
    species: ["fish"],
    why: "For a fish this is body temperature. There is no separate number to record.",
  },
  {
    id: "ammonia",
    priority: 100,
    label: "Ammonia",
    question: "Ammonia reading",
    tier: "periodic",
    kind: "quantity",
    unit: "ppm",
    source: "owner",
    species: ["fish"],
    why:
      "Most aquarium fish deaths are water quality, not disease. Ammonia is " +
      "produced constantly by the fish themselves and is acutely toxic.",
    redFlags: [
      {
        when: "Anything above 0",
        urgency: "same_day",
        because:
          "In an established tank the biological filter should hold ammonia at " +
          "zero. Any reading means the filter is not keeping up.",
      },
    ],
  },
  {
    id: "nitrite",
    priority: 101,
    label: "Nitrite",
    question: "Nitrite reading",
    tier: "periodic",
    kind: "quantity",
    unit: "ppm",
    source: "owner",
    species: ["fish"],
    why: "The second stage of the nitrogen cycle and also acutely toxic; it should also read zero.",
    redFlags: [
      {
        when: "Anything above 0",
        urgency: "same_day",
        because: "It stops the blood carrying oxygen.",
      },
    ],
  },
  {
    id: "nitrate",
    priority: 102,
    label: "Nitrate",
    question: "Nitrate reading",
    tier: "periodic",
    kind: "quantity",
    unit: "ppm",
    source: "owner",
    species: ["fish"],
    why: "The end product of the cycle. Not acutely toxic, but a rising trend is what water changes exist to fix.",
  },
  {
    id: "ph",
    priority: 103,
    label: "pH",
    question: "pH reading",
    tier: "periodic",
    kind: "quantity",
    source: "owner",
    species: ["fish"],
    why: "Stability matters more than hitting a target — a swinging pH is harder on fish than a steady imperfect one.",
  },

  /* ── Birds ───────────────────────────────────────────────────────────── */
  {
    id: "droppings_appearance",
    priority: 18,
    label: "Droppings",
    question: "Do the droppings look normal in colour and form?",
    tier: "daily",
    kind: "choice",
    source: "owner",
    species: ["bird"],
    why:
      "A bird's droppings have three visible parts, and a change in any of them " +
      "is often the first sign of illness in an animal that hides everything else.",
    choices: [
      { value: "normal", label: "Normal" },
      { value: "watery", label: "Unusually watery" },
      { value: "discoloured", label: "Odd colour" },
      { value: "blood", label: "Blood present" },
    ],
  },
  {
    id: "respiratory_effort",
    priority: 19,
    label: "Breathing",
    question: "Any tail-bobbing, open beak or clicking when breathing?",
    tier: "daily",
    kind: "boolean",
    source: "owner",
    species: ["bird"],
    why:
      "Birds show respiratory distress with the tail rather than the chest. " +
      "Visible effort means the illness is already advanced.",
    redFlags: [
      {
        when: "Tail-bobbing at rest, or sitting fluffed at the cage floor",
        urgency: "emergency",
        because:
          "A bird showing obvious illness is usually near the end of its ability to compensate.",
      },
    ],
  },

  /* ── Emotional and behavioural ───────────────────────────────────────── */
  {
    id: "mood",
    priority: 50,
    // Weekly for the species whose five daily slots are already spent on
    // things that kill them faster. Energy already carries most of the signal
    // mood would; the daily budget is better spent on a daily weight.
    tierBySpecies: { bird: "periodic", guinea_pig: "periodic" },
    label: "Mood",
    question: "How did they seem in themselves?",
    tier: "daily",
    kind: "scale5",
    source: "owner",
    species: ALL_BUT_FISH,
    why: "Owners read their own animal better than any instrument. The value is the trend, not the number.",
  },
  {
    id: "anxiety",
    priority: 60,
    label: "Anxiety",
    question: "Any hiding, pacing, trembling or vocalising?",
    tier: "periodic",
    kind: "scale5",
    source: "owner",
    species: ALL_BUT_FISH,
    why:
      "Behaviour change is often the first sign of pain, and pain in animals is " +
      "chronically under-recognised because they do not complain.",
  },
];

/* ─── Derived views ───────────────────────────────────────────────────────── */

/** Everything meaningful for a species, most important first. */
export function observationsFor(species: SpeciesId): ObservationDef[] {
  return OBSERVATIONS.filter((o) => o.species.includes(species)).sort(
    (a, b) => a.priority - b.priority,
  );
}

/** How often this species is asked for this observation. */
export function tierFor(o: ObservationDef, species: SpeciesId): ObservationTier {
  return o.tierBySpecies?.[species] ?? o.tier;
}

/**
 * The most a person will answer every day before they start guessing.
 *
 * Enforced as a constraint on the catalogue rather than by truncating the list:
 * silently dropping the sixth item would mean adding an observation could push
 * a more important one out of the owner's day without anyone noticing. The test
 * fails instead, and a human decides what to demote.
 */
export const DAILY_LIMIT = 5;

/**
 * The whole daily check-in for a species, including readings taken from a
 * device. Reptile enclosure temperatures and aquarium water temperature ARE the
 * daily check for those animals — dropping them because an owner reads them off
 * a gauge rather than out of their own head left fish keepers with nothing to
 * log at all.
 */
export function dailyObservationsFor(species: SpeciesId): ObservationDef[] {
  return observationsFor(species).filter((o) => tierFor(o, species) === "daily");
}

/** The subset the owner answers from their own observation. */
export function dailyOwnerObservationsFor(species: SpeciesId): ObservationDef[] {
  return dailyObservationsFor(species).filter((o) => o.source === "owner");
}

/** The subset read off a thermometer, hygrometer or test kit. */
export function dailyDeviceObservationsFor(species: SpeciesId): ObservationDef[] {
  return dailyObservationsFor(species).filter((o) => o.source === "device");
}

/** Every red flag relevant to a species, for the "when to call a vet" view. */
export function redFlagsFor(species: SpeciesId): (RedFlag & { observation: string })[] {
  return observationsFor(species).flatMap((o) =>
    (o.redFlags ?? []).map((f) => ({ ...f, observation: o.label })),
  );
}

export function observationById(id: string): ObservationDef | undefined {
  return OBSERVATIONS.find((o) => o.id === id);
}

/* ─── Records ─────────────────────────────────────────────────────────────── */

/**
 * Durable facts about a pet, as opposed to daily observations.
 *
 * These are the things an owner is asked for once, or on a schedule, and which
 * a vet or a boarding kennel will ask for later. `askAt` is what keeps
 * onboarding short: almost nothing is asked on day one.
 */
export type RecordDef = {
  id: string;
  label: string;
  why: string;
  species: SpeciesId[] | "all";
  askAt: "onboarding" | "first_week" | "when_relevant";
  /** True when a reminder schedule makes sense (renewals, replacements). */
  recurring?: boolean;
};

export const PET_RECORDS: RecordDef[] = [
  {
    id: "microchip",
    label: "Microchip number",
    why:
      "The single most useful field for getting a lost animal home, and the one " +
      "owners most often cannot find when they need it most. Worth asking for once.",
    species: ["dog", "cat", "rabbit", "horse", "bird"],
    askAt: "first_week",
  },
  {
    id: "neuter_status",
    label: "Neutered or spayed",
    why: "Changes the risk profile for several diseases and the advice that follows from it.",
    species: "all",
    askAt: "onboarding",
  },
  {
    id: "parasite_prevention",
    label: "Flea, tick and worming",
    why:
      "A recurring schedule that owners routinely lose track of, and one where a " +
      "reminder is genuinely more useful than a record.",
    species: ["dog", "cat", "rabbit", "horse"],
    askAt: "first_week",
    recurring: true,
  },
  {
    id: "diet",
    label: "What they eat",
    why:
      "The first question a vet asks about a gut problem, and the thing an owner " +
      "is least able to recall precisely under stress.",
    species: "all",
    askAt: "first_week",
  },
  {
    id: "chronic_conditions",
    label: "Ongoing conditions and allergies",
    why: "Context for every alert the system will ever raise about this animal.",
    species: "all",
    askAt: "when_relevant",
  },
  {
    id: "insurance",
    label: "Insurance policy",
    why: "Needed at exactly the moment nobody wants to be searching for it.",
    species: "all",
    askAt: "when_relevant",
  },
  {
    id: "farrier",
    label: "Farrier visits",
    why: "Hoof care runs on a roughly six-week cycle and is a schedule, not an event.",
    species: ["horse"],
    askAt: "first_week",
    recurring: true,
  },
  {
    id: "water_change",
    label: "Water changes",
    why: "The routine that keeps nitrate down; a schedule the tank depends on.",
    species: ["fish"],
    askAt: "first_week",
    recurring: true,
  },
];

export function recordsFor(species: SpeciesId): RecordDef[] {
  return PET_RECORDS.filter((r) => r.species === "all" || r.species.includes(species));
}
