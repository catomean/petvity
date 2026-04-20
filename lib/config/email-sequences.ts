/** Delays in milliseconds for the owner welcome email sequence */
export const WELCOME_SEQUENCE = {
  /** Immediate: welcome + first steps */
  welcome: 0,
  /** Day 1: guide to adding your first pet */
  addPet: 24 * 60 * 60 * 1000,
  /** Day 3: health tracking intro */
  healthTracking: 3 * 24 * 60 * 60 * 1000,
  /** Day 7: feature highlights + community */
  weekOne: 7 * 24 * 60 * 60 * 1000,
} as const;
