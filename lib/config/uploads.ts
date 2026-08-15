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

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * File extension to store an upload under.
 *
 * Caddy serves the uploads directory with `file_server`, which derives
 * Content-Type from the extension. Stored without one, an image came back with
 * an empty Content-Type — Chrome sniffs and renders it anyway, but that is a
 * browser courtesy, not a guarantee, and it defeats correct caching.
 *
 * Falls back to .jpg only for an already-validated image whose type we somehow
 * don't recognise; callers reject unknown types before reaching here.
 */
export function imageExtension(type: string | undefined): string {
  return EXTENSION_BY_TYPE[type ?? ""] ?? ".jpg";
}
