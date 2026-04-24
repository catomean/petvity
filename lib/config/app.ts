export const APP = {
  name: "Petvity",
  tagline: "The global platform for pet care",
  email: "hello@petvity.com",
  supportEmail: "support@petvity.com",
  foundingYear: 2026,
} as const;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://petvity.com";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
