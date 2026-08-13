import type { CheckinProfile } from "@/lib/domain/resident-checkin";

/**
 * The resident cast — persistent accounts and pets that live on the platform
 * for real, so every user type is represented with genuine, aging data:
 *
 *  - Two tracked pets (cat + dog) whose daily check-ins a cron logs the way
 *    a real owner would. Unlike the demo account (wiped nightly), their
 *    history accumulates: charts lengthen, trends emerge, vaccination
 *    due-dates approach on the true calendar.
 *  - A verified veterinarian and a pet sitter (Find-a-Pro isn't empty).
 *  - A seller with a stocked shop.
 *  - A rescue with an adoption listing.
 *  - Completed bookings with reviews, so ratings render.
 *
 * All accounts are passwordless: machine-only, nobody can log into or lock
 * out the residents.
 */

const CAT_NOTES = [
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

const DOG_NOTES = [
  "Two laps around the park and still asked for more. Tail never stopped.",
  "Found the muddiest puddle in the canton. Bath followed. Betrayal noted.",
  "Practiced 'stay' for a full ninety seconds. We're calling it a record.",
  "Carried her favorite stick home like a trophy.",
  "Met three dogs at the lake, befriended all of them plus one confused swan.",
  "Slept through the entire thunderclap replay on TV. Progress?",
  "Snuck onto the sofa at dawn. Acted innocent. Was not.",
  "New squeaky toy lasted four minutes. A personal best.",
  "Sat perfectly for the vet-visit photo, then ate a fly.",
  "Long evening walk along the river. Came home, sighed happily, flopped.",
];

export interface ResidentPetDef {
  account: { email: string; name: string };
  pet: {
    name: string;
    species: "cat" | "dog";
    breed: string;
    sex: "male" | "female";
    birthDate: string;
    handle: string;
    bio: string;
  };
  checkin: CheckinProfile;
  /** Days relative to bootstrap (negative = past). */
  vaccinations: {
    name: string;
    administeredDaysAgo: number;
    nextDueInDays: number;
    vetName: string;
  }[];
  firstRecord: { daysAgo: number; title: string; notes: string };
}

export const RESIDENT_PETS: ResidentPetDef[] = [
  {
    account: { email: "milo@petvity.com", name: "Milo's Human" },
    pet: {
      name: "Milo",
      species: "cat",
      breed: "European Shorthair",
      sex: "male",
      birthDate: "2023-09-03",
      handle: "milo",
      bio: "Window-sill philosopher and professional sunbeam locator. Logs a check-in every morning — watch a real health history grow, one day at a time.",
    },
    checkin: {
      seedSalt: 0, // original series — keeps Milo's existing history continuous
      baseWeightGrams: 4300,
      seasonalAmplitudeGrams: 120,
      weightJitterGrams: 50,
      tempMinCentidegrees: 3840,
      tempSpanCentidegrees: 50,
      heartRateMin: 150,
      heartRateSpan: 35,
      anxiousEveryNDays: 11,
      anxiousNote: CAT_NOTES[2],
      notes: CAT_NOTES,
    },
    vaccinations: [
      { name: "Rabies", administeredDaysAgo: 100, nextDueInDays: 265, vetName: "Dr. Brunner, Kleintierpraxis Wiedikon" },
      { name: "FVRCP booster", administeredDaysAgo: 330, nextDueInDays: 35, vetName: "Dr. Brunner, Kleintierpraxis Wiedikon" },
    ],
    firstRecord: {
      daysAgo: 100,
      title: "Annual check-up and rabies shot",
      notes: "Healthy, well-muscled. Teeth in great shape. Slightly dramatic about the thermometer.",
    },
  },
  {
    account: { email: "rosie@petvity.com", name: "Rosie's Human" },
    pet: {
      name: "Rosie",
      species: "dog",
      breed: "Beagle",
      sex: "female",
      birthDate: "2022-11-20",
      handle: "rosie",
      bio: "Beagle of boundless optimism. Every walk is the best walk that has ever happened. Checked in daily — a real dog, tracked like one.",
    },
    checkin: {
      seedSalt: 0x9e3779b9,
      baseWeightGrams: 11200,
      seasonalAmplitudeGrams: 250,
      weightJitterGrams: 80,
      tempMinCentidegrees: 3820,
      tempSpanCentidegrees: 60,
      heartRateMin: 75,
      heartRateSpan: 35,
      anxiousEveryNDays: 13, // thunderstorm days
      anxiousNote: "Thunderstorm. Spent the afternoon as a trembling loaf under the desk.",
      notes: DOG_NOTES,
    },
    vaccinations: [
      { name: "Rabies", administeredDaysAgo: 200, nextDueInDays: 165, vetName: "Dr. Brunner, Kleintierpraxis Wiedikon" },
      { name: "DHPP booster", administeredDaysAgo: 320, nextDueInDays: 45, vetName: "Dr. Brunner, Kleintierpraxis Wiedikon" },
      { name: "Leptospirosis", administeredDaysAgo: 320, nextDueInDays: 45, vetName: "Dr. Brunner, Kleintierpraxis Wiedikon" },
    ],
    firstRecord: {
      daysAgo: 60,
      title: "Ear check after lake season",
      notes: "Mild wax buildup, cleaned in-clinic. Ears otherwise healthy. Advised drying ears after swims.",
    },
  },
];

/** Community accounts — one of every user type, with living data. */
export const RESIDENT_COMMUNITY = {
  vet: {
    account: { email: "vet.brunner@petvity.com", name: "Dr. Anna Brunner" },
    role: "veterinarian" as const,
    profile: {
      bio: "Small-animal internist with 12 years in practice. Special interest in feline medicine and preventive care. I read your pet's Petvity trends before every consult.",
      specialty: "Small animal internal medicine",
      clinicName: "Kleintierpraxis Wiedikon",
      clinicAddress: "Birmensdorferstrasse 198, 8055 Zürich",
      city: "Zürich",
      country: "CH",
      phone: "+41 44 555 01 23",
      isAcceptingClients: true,
      isVerified: true,
    },
  },
  sitter: {
    account: { email: "sitter.keller@petvity.com", name: "Sam Keller" },
    role: "pet_sitter" as const,
    profile: {
      bio: "Daily dog walker and cat sitter around Kreis 3–4. Photo updates from every visit; comfortable with medication schedules.",
      services: "walking,daycare,drop_in,house_sitting",
      pricePerDay: 4500,
      city: "Zürich",
      country: "CH",
      phone: "+41 76 555 04 56",
      isAcceptingClients: true,
      isVerified: true,
    },
  },
  groomer: {
    account: { email: "groomer.roth@petvity.com", name: "Nadia Roth" },
    role: "groomer" as const,
    profile: {
      salonName: "Salon Pfotenschick",
      bio: "Certified groomer with a patient hand for anxious dogs and double coats. Every session ends with a treat and a very good hair day.",
      services: "bath_brush,full_groom,haircut,deshedding,nail_trim",
      priceFrom: 6500,
      city: "Zürich",
      country: "CH",
      phone: "+41 79 555 08 21",
      isAcceptingClients: true,
      isVerified: true,
    },
  },
  seller: {
    account: { email: "shop.pfoten@petvity.com", name: "Pfoten & Co." },
    profile: {
      displayName: "Pfoten & Co.",
      bio: "Small Zürich shop for honest pet supplies — nothing we wouldn't give our own animals.",
      city: "Zürich",
      country: "CH",
      website: "https://petvity.orangecat.ch/en/shop",
      isActive: true,
    },
    products: [
      { name: "Salmon & Sweet Potato Dry Food 2 kg", category: "food" as const, priceCents: 2490, stock: 40, description: "Grain-free recipe for adult dogs. Single protein source, gentle on sensitive stomachs." },
      { name: "Tuna Pâté Cat Food, 12 × 85 g", category: "food" as const, priceCents: 1890, stock: 60, description: "Complete wet food with high meat content and no added sugar." },
      { name: "Feather Teaser Wand", category: "toys" as const, priceCents: 890, stock: 25, description: "Replaceable feather head on a springy wand — the red dot's honest cousin." },
      { name: "Rope Tug Ring", category: "toys" as const, priceCents: 1190, stock: 30, description: "Tightly braided cotton ring for fetch and tug. Machine washable." },
      { name: "Joint Support Chews, 60 pcs", category: "health" as const, priceCents: 2990, stock: 20, description: "Glucosamine and green-lipped mussel chews for senior dogs." },
      { name: "Reflective Adjustable Harness", category: "accessories" as const, priceCents: 3490, stock: 15, description: "Y-front harness with reflective piping, sizes S–L." },
      { name: "Soft Slicker Brush", category: "grooming" as const, priceCents: 1490, stock: 35, description: "Fine bent-wire brush for undercoat care without scratching." },
    ],
  },
  rescue: {
    account: { email: "rescue.sonnenhof@petvity.com", name: "Tierheim Sonnenhof" },
    pet: {
      name: "Biscuit",
      species: "rabbit" as const,
      breed: null,
      sex: "male" as const,
      birthDate: "2024-04-02",
      bio: "Gentle lop-eared rabbit who was surrendered when his family moved. Litter-trained, loves cilantro and quiet company.",
    },
    listing: {
      title: "Biscuit — gentle lop rabbit seeks calm home",
      description:
        "Biscuit is a calm, litter-trained lop who enjoys floor time and being talked to. He'd thrive in a quiet home with space to roam a few hours a day. Bonded-pair households welcome; he's curious about other rabbits.",
      feeCents: null,
      location: "Zürich, Switzerland",
      requiresExperience: false,
      goodWithKids: true,
      goodWithDogs: false,
      goodWithCats: true,
    },
  },
  /** Completed past bookings + reviews so ratings render on pro profiles. */
  bookings: [
    {
      ownerEmail: "milo@petvity.com",
      petHandle: "milo",
      professionalEmail: "vet.brunner@petvity.com",
      professionalRole: "veterinarian" as const,
      daysAgo: 100,
      notes: "Annual check-up and rabies shot.",
      review: { rating: 5, comment: "Dr. Brunner was thorough and gentle — talked us through Milo's trend charts and made the whole visit calm. The dramatic thermometer moment was handled with grace." },
    },
    {
      ownerEmail: "rosie@petvity.com",
      petHandle: "rosie",
      professionalEmail: "sitter.keller@petvity.com",
      professionalRole: "pet_sitter" as const,
      daysAgo: 21,
      notes: "Midday walks, Mon–Fri while travelling.",
      review: { rating: 5, comment: "Sam sent photos from every walk and kept perfect notes in the check-ins. Rosie now sits by the door at Sam o'clock." },
    },
    {
      ownerEmail: "rosie@petvity.com",
      petHandle: "rosie",
      professionalEmail: "groomer.roth@petvity.com",
      professionalRole: "groomer" as const,
      daysAgo: 12,
      notes: "De-shedding and nail trim before summer.",
      review: { rating: 5, comment: "Nadia took her time with Rosie's undercoat and even filed the nails she usually fights over. Came home fluffy, calm, and smelling like a meadow." },
    },
  ],
} as const;
