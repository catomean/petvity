/**
 * The resident pet — a persistent animal tracked EVERY day by a cron, the way
 * a real owner would log a morning check-in. Unlike the demo account (wiped
 * and reseeded daily), Milo's history accumulates for real: charts, trends,
 * signal history, and vaccination due-dates all evolve over genuine time.
 *
 * Publicly watchable at /pets/milo.
 */
export const RESIDENT_ACCOUNT = {
  email: "milo@petvity.com",
  name: "Milo's Human",
} as const;

export const RESIDENT_PET = {
  name: "Milo",
  species: "cat",
  breed: "European Shorthair",
  sex: "male",
  birthDate: "2023-09-03",
  handle: "milo",
  bio: "Window-sill philosopher and professional sunbeam locator. Logs a check-in every morning — watch a real health history grow, one day at a time.",
} as const;
