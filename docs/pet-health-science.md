# What is actually worth tracking, and for which animal

**Status:** product design, compiled from typical published veterinary ranges.
**Not yet reviewed by a veterinarian** — see `REVIEW_STATUS` in
`lib/config/observations.ts`. Nothing here should be shown to an owner as
clinical authority until it has been.

---

## The problem with what we had

`lib/config/health-metrics.ts` models seven metrics — weight, temperature, heart
rate, energy, mood, anxiety, socialization — and applies all seven to all ten
species. That is tidy, and for several species it is wrong in ways that matter.

**Body temperature is not a thing a fish or a reptile has.** They are
ectotherms. A fish's body temperature *is* the water temperature; there is no
second number. A reptile's depends on which end of its enclosure it is currently
sitting in. Asking an owner to log it yields either a meaningless number or an
empty field, and empty fields teach people to skip.

**Heart rate is not measurable at home** for a bird, a fish, a hamster or a
guinea pig. Including it as a metric asks owners for something they cannot give.

**The things that actually kill these animals were missing entirely.** Not one
of the seven captures a rabbit that has stopped eating, a male cat that cannot
urinate, a horse that has stopped passing manure, or a UVB bulb that has quietly
stopped emitting UVB.

A tracker that asks for what is easy to model rather than what is dangerous to
miss produces a tidy chart and a dead animal.

---

## The organising idea

Three questions decide whether something belongs in the product at all:

1. **Can the owner actually answer it?** If it needs a vet, a lab or equipment
   they do not own, it is a record to store, not a question to ask.
2. **Does the answer change what we would tell them?** If every answer leads to
   the same advice, the question is decoration.
3. **How fast does it change?** That sets the cadence. Cadence is the scarce
   resource, not screen space.

This is encoded in `lib/config/observations.ts`: every observation declares its
species, its cadence, its source, why it earns a tap, and what answer means
"call a vet" — with the reason, because an alert nobody believes is an alert
everybody dismisses.

---

## The daily set, per species

Five is the ceiling. It is enforced by a test that **fails** rather than by code
that truncates — if a new observation would push the set to six, a person
decides what to demote, instead of an important question silently falling off
the end of an array.

| Species | What we ask every day |
|---|---|
| **Dog** | ate normally · droppings · urine · activity · mood |
| **Cat** | ate normally · droppings · urine · activity · mood |
| **Horse** | ate normally · **manure piles** · activity · mood · **moving evenly** |
| **Bird** | ate normally · droppings appearance · **breathing effort** · **weight in grams** · activity |
| **Rabbit** | **ate normally · droppings** · activity · mood |
| **Guinea pig** | ate normally · droppings · **weight** · **vitamin C given** · activity |
| **Hamster** | ate normally · droppings · **weight** · activity · mood |
| **Reptile** | **warm-end temp · cool-end temp · humidity** · activity · mood |
| **Fish** | **water temperature** |

Bold marks what is species-specific — and it is most of the value.

Fish get one daily question, and that is the honest answer: daily you glance at
the thermometer; the water chemistry that matters is a weekly test, not a daily
one. A product that invented four more fish questions to look thorough would be
lying about what fish keeping is.

---

## Why each of those, by species

### Rabbits and guinea pigs — the gut is the emergency

Gut stasis is the leading cause of death in pet rabbits. The gut relies on near-
constant food moving through it; when a rabbit stops eating, the gut stops, and
the situation becomes self-reinforcing and then fatal. **No food and no
droppings for twelve hours is an emergency**, not a "watch and see".

This is why appetite and droppings are the first two questions for these species
and why both are flagged `emergency`. It is also the clearest case for asking a
question daily rather than weekly: twelve hours is inside the window.

Guinea pigs additionally **cannot synthesise vitamin C** — one of very few
mammals that cannot. It must come from the diet every day or they develop
scurvy. One daily yes/no prevents a disease outright, which is the best ratio in
the whole catalogue.

Both species have **continuously growing teeth**. Overgrowth stops them eating,
which starts the same cascade — so dental checks are periodic, not episodic.

### Birds — a prey animal that hides everything

Birds conceal illness, because in the wild looking sick attracts predators. By
the time a bird looks unwell it is often gravely ill and close to the end of
what it can compensate for.

**Weight is the measurement that does not lie.** Bird keepers weigh daily, in
grams, on a kitchen scale. A **10% drop is significant** and often the only
warning available. This is why birds are one of only three species with a daily
weight.

Birds also show respiratory distress with the **tail rather than the chest** —
tail-bobbing at rest, an open beak, clicking. Sitting fluffed on the cage floor
is close to an emergency.

### Cats — two things worth catching early, one worth catching today

**Urinary blockage** is one of the few true emergencies an owner can spot
unaided. A male cat straining in the tray and producing nothing is fatal within
roughly 24–48 hours. A litter tray makes this observable, which is why urination
is a daily question for cats.

**Increased thirst and urination** over days is an early sign of kidney disease,
diabetes and hyperthyroidism — three conditions that are far more manageable
caught early, and all three are common in older cats.

**A cat that stops eating** risks hepatic lipidosis, where the fast itself
causes liver failure independent of whatever started it. That makes "not eating"
more urgent in a cat than intuition suggests.

**Resting respiratory rate** deserves special mention. Counting chest rises over
30 seconds while the animal genuinely sleeps, and doubling it, is the standard
home monitor for heart failure in cats and dogs. A sustained rate above about 30
breaths per minute warrants assessment, especially with a known murmur. It is
free, it needs no equipment, it rises before the animal looks unwell, and almost
no consumer pet app asks for it. It is periodic rather than daily because it
needs a sleeping animal and a quiet minute.

Open-mouth breathing in a cat is an emergency. Cats do not pant like dogs.

### Dogs — plus one shape of emergency

Everything above about appetite, output and resting respiratory rate applies.
The dog-specific one worth encoding: **repeated unproductive retching in a
deep-chested dog with a swelling abdomen** suggests bloat with gastric torsion,
which is fatal within hours.

### Horses — colic and laminitis

Colic is the leading cause of death in horses outside old age, and the earliest
practical warning an owner has is **manure output falling**. That is why horses
get a manure count rather than the generic droppings question — a count carries
a trend, a yes/no does not.

Paired with pawing, flank-watching or rolling, reduced output is an emergency,
and some causes are surgical within hours.

**Laminitis** is the other clock-driven one: a horse reluctant to move and
rocking its weight back onto its heels needs help the same day, because hours of
delay change the outcome permanently. Hence a daily movement check for horses,
where dogs and cats get a periodic one.

Hoof care runs on a roughly six-week farrier cycle — a schedule, not an event,
which is why it is a recurring record.

### Reptiles — the enclosure is the patient

Most pet reptile illness traces to husbandry, not infection. The animal cannot
generate its own heat, so its digestion and immune function are set by its
enclosure. What matters is not one temperature but a **gradient**: a warm end to
reach, and a cool end to retreat to. Both, plus humidity, are the daily check.

The one worth singling out: **a UVB bulb keeps emitting visible light long after
its UVB output has decayed.** It looks like it is working. Meanwhile the animal
slowly develops metabolic bone disease. Typical replacement is every 6–12 months
per the manufacturer, regardless of whether the light still comes on. This is
the perfect case for software — a calendar reminder eliminates a whole disease
category, and no observation of the animal would have caught it in time.

Wrong humidity shows up as **retained shed** around toes, tail tip and eyes,
which constricts and causes them to be lost. So shed quality is both a welfare
observation and the most reliable proxy for a humidity problem.

Many reptiles eat weekly or less, so "did they eat today" is demoted to periodic
for them — asking daily would train the owner to answer "no" meaninglessly six
days in seven.

### Fish — the water is the patient

Most aquarium fish deaths are water quality, not disease.

- **Ammonia** is produced constantly by the fish and is acutely toxic. In an
  established tank the biological filter should hold it at **zero**. Any reading
  above zero means the filter is not keeping up.
- **Nitrite**, the second stage of the nitrogen cycle, is also acutely toxic and
  should also read zero. It stops the blood carrying oxygen.
- **Nitrate** is the end product — not acutely toxic, but a rising trend is
  exactly what water changes exist to correct.
- **pH** matters for *stability* more than for hitting a target. A swinging pH
  is harder on fish than a steady imperfect one.

Temperature is daily. The chemistry is weekly. Water changes are a recurring
schedule the tank depends on.

### Everything with a body condition

**Body condition score** beats raw weight because it does not depend on breed or
frame: a 4 kg cat and a 4 kg cat can be very different animals. Obesity is the
most common preventable welfare problem in pets, and owners consistently
under-estimate it — which is why the question is phrased as something to *do*
("can you feel the ribs easily, and is there a waist from above?") rather than a
number to guess.

---

## Records, as distinct from observations

Observations are what changed today. Records are durable facts a vet or a
boarding kennel will ask for later.

The one most worth adding: **microchip number**. It is the single most useful
field for getting a lost animal home, and the one owners most often cannot find
at the moment they need it. Also: neuter status, parasite prevention schedule
(recurring — owners routinely lose track), current diet (the first question a
vet asks about a gut problem, and the hardest to recall under stress), chronic
conditions and allergies, insurance policy, and the species-specific schedules —
farrier for horses, water changes for fish, UVB replacement for reptiles.

---

## Progressive disclosure: the cadence ladder

Owners have seconds, not minutes. Data filled in carelessly is worse than no
data, because it looks like signal and will eventually be charted, trended and
alerted on.

- **Onboarding (~60 seconds).** Species, name, rough age, sex, neutered.
  At most two record fields. Nothing else. This is where owners are lost.
- **Daily (~15 seconds).** The species set above. Three to five taps, mostly
  yes/no and three-way choices — never free text, never a number the owner has
  to look up.
- **Periodic (weekly to monthly).** Weight, body condition, resting respiratory
  rate, dental, coat, water chemistry.
- **Episodic.** Vet visits, vaccinations, medications, incidents, bulb changes.
  Entered when they happen, surfaced as reminders when they are due.
- **Ambient.** Photos, video and voice, which cost the owner nothing beyond what
  they already do, and which are the raw material for everything in
  `digital-twin-and-legacy.md`.

The rule that keeps this honest: **never show a field whose answer the owner
cannot produce.** Every skipped field teaches the habit of skipping, and the
habit generalises to the field that mattered.

---

## What to do next

1. **Get these numbers in front of a vet.** They are compiled from typical
   published ranges and are good enough to design against; they are not good
   enough to present as clinical guidance. `REVIEW_STATUS` gates that.
2. **Wire the catalogue into the daily check-in**, replacing the uniform
   seven-metric form with `dailyObservationsFor(species)`.
3. **Add the emergency view** — `redFlagsFor(species)` already assembles a
   species-specific "when to call a vet", which is genuinely useful content and
   also strong organic search material.
4. **Add the records that do not exist yet**, microchip first.
5. **Keep the storage conventions**: integers only, in the smallest sensible
   unit. Floats reintroduce drift into threshold comparisons.
