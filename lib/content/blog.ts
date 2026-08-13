/**
 * SSOT for blog content. Posts are authored here in English (the blog is
 * editorial content, not UI chrome — it is not machine-translated). Body is
 * an array of blocks rendered by the post page.
 */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export interface BlogPost {
  slug: string;
  date: string; // YYYY-MM-DD
  title: string;
  excerpt: string;
  body: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "a-platform-for-both-sides-of-pet-care",
    date: "2026-08-13",
    title: "A platform for both sides of pet care",
    excerpt:
      "Petvity started as a way to read your pet's health signal. It has grown into a two-sided platform: owners find trusted care in one place, and the people who provide that care get a storefront, a calendar, and customers.",
    body: [
      {
        type: "p",
        text: "Petvity began with a simple idea: one daily check-in builds a living picture of your pet's health, and when something shifts, you should know what — before it becomes a vet emergency. That idea is still the heart of the product. But a health signal alone doesn't take care of a pet. Someone has to walk the dog while you travel, trim the anxious cat's nails, and see your animal when the signal says something is wrong.",
      },
      { type: "h2", text: "For pet owners: everything after the signal" },
      {
        type: "p",
        text: "Everything an owner needs now lives in one place. The daily check-in and Digital Twin remain free, for unlimited pets. Around them: a directory of veterinarians, pet sitters, and groomers you can search by city and book directly — with availability checked before you ever submit a request; a marketplace for food, toys, and care essentials; and a humane adoption network for listing or finding a companion.",
      },
      {
        type: "ul",
        items: [
          "Search vets, sitters, and groomers near you — no account needed to browse",
          "Book with real availability: double-bookings are rejected before they happen",
          "Reviews come only from completed bookings — we do not seed or fake ratings",
          "Health tracking stays free, for unlimited pets",
        ],
      },
      { type: "h2", text: "For professionals and sellers: customers, not paperwork" },
      {
        type: "p",
        text: "If you are a groomer, sitter, or vet, Petvity gives you a public storefront the moment you sign up: a profile page that search engines can find, a services list, your prices, and a booking request flow with a calendar you control. Block the dates you're unavailable and the platform enforces it — nobody can double-book you. Reviews accumulate from real completed work, and a verification badge is available after review.",
      },
      {
        type: "p",
        text: "Sellers get the same treatment: open a store in minutes, list products with stock tracking, and reach owners inside the app they already open every day to check on their pets. Orders, fulfilment, and per-seller reporting are built in.",
      },
      { type: "h2", text: "The honest part" },
      {
        type: "p",
        text: "Petvity is young. The professionals and shops you see today include our own resident accounts — real profiles we operate so you can see exactly how the platform works, clearly identified, with no invented reviews attached. Every rating on this site comes from a real completed booking or it does not exist. That is a permanent policy, not a launch promise.",
      },
      {
        type: "p",
        text: "If you take care of pets for a living — or sell things that make their lives better — this platform is being built for you. Create your profile, set your availability, and your storefront is live today.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
