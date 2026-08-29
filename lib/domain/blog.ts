import { z } from "zod";

/**
 * Blog authoring rules. Kept out of the route so the same shape validates a
 * create and a patch, and so the slug rule has one definition.
 */

/**
 * A slug becomes a permanent public URL, so it may only contain characters
 * that survive one: lowercase, digits, single hyphens, no leading or trailing
 * hyphen.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Derive a URL-safe slug from a title, for the "suggest" affordance. */
export function slugify(title: string): string {
  return (
    title
      .normalize("NFKD")
      // Strip accents so "Hündchen" becomes "hundchen" rather than losing the word.
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 200)
      // A trailing hyphen can reappear after the length clamp.
      .replace(/-+$/g, "")
  );
}

export const blogPostCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens"),
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  body: z.string().min(1),
  status: z.enum(["draft", "published"]).optional(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export type BlogPostCreate = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdate = z.infer<typeof blogPostUpdateSchema>;
