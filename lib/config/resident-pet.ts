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
