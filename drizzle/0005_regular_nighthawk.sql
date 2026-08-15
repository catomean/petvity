CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(200) NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
-- Carry the one existing post over from lib/content/blog.ts, which this table
-- replaces. Its URL (/[locale]/blog/a-platform-for-both-sides-of-pet-care) is
-- already public, so dropping the content would 404 an indexed page.
-- Dollar-quoted because the copy is full of apostrophes; ON CONFLICT keeps the
-- migration safe to re-run.
INSERT INTO "blog_posts" ("slug", "title", "excerpt", "body", "status", "published_at")
VALUES (
  'a-platform-for-both-sides-of-pet-care',
  'A platform for both sides of pet care',
  $blog$Petvity started as a way to read your pet's health signal. It has grown into a two-sided platform: owners find trusted care in one place, and the people who provide that care get a storefront, a calendar, and customers.$blog$,
  $blog$Petvity began with a simple idea: one daily check-in builds a living picture of your pet's health, and when something shifts, you should know what — before it becomes a vet emergency. That idea is still the heart of the product. But a health signal alone doesn't take care of a pet. Someone has to walk the dog while you travel, trim the anxious cat's nails, and see your animal when the signal says something is wrong.

## For pet owners: everything after the signal

Everything an owner needs now lives in one place. The daily check-in and Digital Twin remain free, for unlimited pets. Around them: a directory of veterinarians, pet sitters, and groomers you can search by city and book directly — with availability checked before you ever submit a request; a marketplace for food, toys, and care essentials; and a humane adoption network for listing or finding a companion.

- Search vets, sitters, and groomers near you — no account needed to browse
- Book with real availability: double-bookings are rejected before they happen
- Reviews come only from completed bookings — we do not seed or fake ratings
- Health tracking stays free, for unlimited pets

## For professionals and sellers: customers, not paperwork

If you are a groomer, sitter, or vet, Petvity gives you a public storefront the moment you sign up: a profile page that search engines can find, a services list, your prices, and a booking request flow with a calendar you control. Block the dates you're unavailable and the platform enforces it — nobody can double-book you. Reviews accumulate from real completed work, and a verification badge is available after review.

Sellers get the same treatment: open a store in minutes, list products with stock tracking, and reach owners inside the app they already open every day to check on their pets. Orders, fulfilment, and per-seller reporting are built in.

## The honest part

Petvity is young. The professionals and shops you see today include our own resident accounts — real profiles we operate so you can see exactly how the platform works, clearly identified, with no invented reviews attached. Every rating on this site comes from a real completed booking or it does not exist. That is a permanent policy, not a launch promise.

If you take care of pets for a living — or sell things that make their lives better — this platform is being built for you. Create your profile, set your availability, and your storefront is live today.$blog$,
  'published',
  '2026-08-13T00:00:00Z'
) ON CONFLICT ("slug") DO NOTHING;