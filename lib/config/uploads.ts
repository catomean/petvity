/**
 * SSOT for image upload limits.
 *
 * These constraints have to agree in three places — the API route that rejects
 * a bad file, the `accept` attribute that stops the user picking one, and the
 * hint text that tells them the limit. They had already drifted: the pet-avatar
 * route accepted GIF while its file picker did not offer it, so a GIF was
 * rejectable by the UI and acceptable to the API.
 */

/** Cap per image. Product photos and pet avatars don't need more, and
 *  rejecting a large upload early is cheaper than streaming it to disk. */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** For the `accept` attribute of a file input — same list, so the picker and
 *  the API can never disagree about what is allowed. */
export const IMAGE_ACCEPT_ATTR = IMAGE_ALLOWED_TYPES.join(",");

export const IMAGE_MAX_MB = IMAGE_MAX_BYTES / 1024 / 1024;
