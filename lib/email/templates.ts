import { APP, APP_URL } from "@/lib/config/app";
import { HOUSING_TYPE_LABELS } from "@/lib/config/adoptions";
import { getEmailStrings, t } from "@/lib/email/i18n";

/** When unsubscribeUrl is provided, an "Unsubscribe" link is rendered in the footer.
 *  Only welcome-series emails should pass it; transactional emails (vaccination
 *  reminders, health alerts, order confirmations) intentionally have no opt-out
 *  affordance because they're necessary for the service the user signed up for. */
const base = (content: string, locale?: string | null, unsubscribeUrl?: string) => {
  const s = getEmailStrings(locale);
  const dir = s.dir;
  const rtlBodyStyle = dir === "rtl" ? ' style="direction:rtl;text-align:right;"' : "";
  return `
<!DOCTYPE html>
<html lang="${locale ?? "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f7f4; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e0d8; }
    .header { background: #2a7a8a; padding: 28px 32px; }
    .header a { color: #fff; font-size: 20px; font-weight: 600; text-decoration: none; }
    .body { padding: 32px; color: #1a1a22; line-height: 1.6; }
    .body h2 { margin: 0 0 16px; font-size: 22px; font-weight: 600; }
    .body p { margin: 0 0 16px; color: #3a3a4a; }
    .btn { display: inline-block; background: #2a7a8a; color: #fff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 8px 0 24px; }
    .footer { padding: 20px 32px; background: #f8f7f4; border-top: 1px solid #e5e0d8; font-size: 13px; color: #888a96; }
    .footer a { color: #888a96; }
  </style>
</head>
<body${rtlBodyStyle}>
  <div class="wrap">
    <div class="header"><a href="${APP_URL}">${APP.name}</a></div>
    <div class="body"${rtlBodyStyle}>${content}</div>
    <div class="footer"${rtlBodyStyle}>
      <p>${APP.name} · <a href="${APP_URL}">${APP_URL.replace("https://", "")}</a></p>
      <p>Questions? <a href="mailto:${APP.supportEmail}">${APP.supportEmail}</a></p>
      ${unsubscribeUrl ? `<p style="margin-top:12px;"><a href="${unsubscribeUrl}">${s.unsubscribe}</a></p>` : ""}
    </div>
  </div>
</body>
</html>`;
};

// ─── Welcome ──────────────────────────────────────────────────────────────────

/** Welcome-series payload — unsubscribeUrl is injected at send time
 *  (cron looks up user; immediate POST /api/account builds it from user.id). */
type WelcomePayload = { name: string; unsubscribeUrl?: string };

export function ownerWelcome(data: WelcomePayload, locale?: string | null) {
  const s = getEmailStrings(locale).ownerWelcome;
  return {
    subject: s.subject,
    html: base(`
      <h2>${t(s.h2, { name: data.name })}</h2>
      <p>${s.p1}</p>
      <p>${s.p2}</p>
      <a class="btn" href="${APP_URL}/portal/pets/new">${s.button}</a>
      <p>${s.p3}</p>
    `, locale, data.unsubscribeUrl),
  };
}

export function ownerAddPet(data: WelcomePayload, locale?: string | null) {
  const s = getEmailStrings(locale).ownerAddPet;
  return {
    subject: s.subject,
    html: base(`
      <h2>${t(s.h2, { name: data.name })}</h2>
      <p>${s.p1}</p>
      <a class="btn" href="${APP_URL}/portal/pets/new">${s.button}</a>
    `, locale, data.unsubscribeUrl),
  };
}

export function ownerHealthTracking(data: WelcomePayload, locale?: string | null) {
  const s = getEmailStrings(locale).ownerHealthTracking;
  return {
    subject: s.subject,
    html: base(`
      <h2>${t(s.h2, { name: data.name })}</h2>
      <p>${s.p1}</p>
      <p>${s.p2}</p>
      <a class="btn" href="${APP_URL}/portal/checkin">${s.button}</a>
    `, locale, data.unsubscribeUrl),
  };
}

export function ownerWeekOne(data: WelcomePayload, locale?: string | null) {
  const s = getEmailStrings(locale).ownerWeekOne;
  const bulletHtml = s.bullets.map((b) => `<li>${b}</li>`).join("");
  return {
    subject: s.subject,
    html: base(`
      <h2>${t(s.h2, { name: data.name })}</h2>
      <p>${s.p1}</p>
      <ul>${bulletHtml}</ul>
      <a class="btn" href="${APP_URL}/portal/dashboard">${s.button}</a>
    `, locale, data.unsubscribeUrl),
  };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export function passwordReset(data: { resetUrl: string }, locale?: string | null) {
  const s = getEmailStrings(locale).passwordReset;
  return {
    subject: s.subject,
    html: base(`
      <h2>${s.h2}</h2>
      <p>${s.p1}</p>
      <a class="btn" href="${data.resetUrl}">${s.button}</a>
      <p>${s.p2}</p>
    `, locale),
  };
}

// ─── Health alert ─────────────────────────────────────────────────────────────

export function petHealthAlert(data: {
  ownerName: string;
  petName: string;
  reason: string;
  petUrl: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).petHealthAlert;
  return {
    subject: t(s.subject, { petName: data.petName }),
    html: base(`
      <h2>${t(s.h2, { name: data.ownerName })}</h2>
      <p>${t(s.p1, { petName: data.petName })}</p>
      <p style="background:#fff3cd;padding:12px 16px;border-radius:6px;border-left:4px solid #d4820a;">
        ${data.reason}
      </p>
      <a class="btn" href="${data.petUrl}">${t(s.button, { petName: data.petName })}</a>
      <p style="margin-top:8px;">${t(s.proTip, { findUrl: `${APP_URL}/portal/find` })}</p>
    `, locale),
  };
}

// ─── Vaccination reminder ─────────────────────────────────────────────────────

export function vaccinationReminder(data: {
  ownerName: string;
  petName: string;
  vaccinationName: string;
  dueDate: string;
  petUrl: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).vaccinationReminder;
  return {
    subject: t(s.subject, { petName: data.petName, vaccName: data.vaccinationName }),
    html: base(`
      <h2>${s.h2}</h2>
      <p>${t(s.greeting, { name: data.ownerName })}</p>
      <p>${t(s.p1, { petName: data.petName, vaccName: data.vaccinationName, dueDate: data.dueDate })}</p>
      <p>${s.p2}</p>
      <a class="btn" href="${data.petUrl}">${s.button}</a>
    `, locale),
  };
}

export function medicationEndingReminder(data: {
  ownerName: string;
  petName: string;
  medicationName: string;
  endDate: string;
  petUrl: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).medicationEndingReminder;
  return {
    subject: t(s.subject, { petName: data.petName, medName: data.medicationName }),
    html: base(`
      <h2>${s.h2}</h2>
      <p>${t(s.greeting, { name: data.ownerName })}</p>
      <p>${t(s.p1, { petName: data.petName, medName: data.medicationName, endDate: data.endDate })}</p>
      <p>${s.p2}</p>
      <a class="btn" href="${data.petUrl}">${s.button}</a>
    `, locale),
  };
}

// ─── Booking notifications ────────────────────────────────────────────────────

export function bookingReminder(data: {
  ownerName: string;
  petName: string;
  professionalName: string;
  startDate: string;
  bookingsUrl: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).bookingReminder;
  return {
    subject: t(s.subject, { petName: data.petName }),
    html: base(`
      <h2>${s.h2}</h2>
      <p>${t(s.greeting, { name: data.ownerName })}</p>
      <p>${t(s.p1, { petName: data.petName, professional: data.professionalName, date: data.startDate })}</p>
      <a class="btn" href="${data.bookingsUrl}">${s.button}</a>
    `, locale),
  };
}

export function bookingRequestReceived(data: {
  professionalName: string;
  ownerName: string;
  petName: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
}, locale?: string | null) {
  const s = getEmailStrings(locale).bookingRequestReceived;
  const dateRange = data.startDate !== data.endDate
    ? `${data.startDate} – ${data.endDate}`
    : data.startDate;
  return {
    subject: t(s.subject, { ownerName: data.ownerName, petName: data.petName }),
    html: base(`
      <h2>${s.h2}</h2>
      <p>${t(s.greeting, { name: data.professionalName })}</p>
      <p>${t(s.p1, { ownerName: data.ownerName, petName: data.petName })}</p>
      <p style="background:#f0faf8;padding:12px 16px;border-radius:6px;border-left:4px solid #0D6E78;">
        <strong>${s.datesLabel}:</strong> ${dateRange}<br/>
        ${data.notes ? `<strong>${s.notesLabel}:</strong> ${data.notes}` : ""}
      </p>
      <a class="btn" href="${APP_URL}/portal/bookings">${s.button}</a>
      <p>${s.p2}</p>
    `, locale),
  };
}

export function bookingStatusChanged(data: {
  ownerName: string;
  petName: string;
  status: "confirmed" | "cancelled" | "completed";
  startDate: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).bookingStatusChanged;
  const variant = s[data.status];
  return {
    subject: variant.subject,
    html: base(`
      <h2>${variant.h2}</h2>
      <p>${t(s.greeting, { name: data.ownerName })}</p>
      <p>${t(variant.body, { petName: data.petName, date: data.startDate })}</p>
      <a class="btn" href="${APP_URL}/portal/bookings">${s.button}</a>
    `, locale),
  };
}

// ─── Order notifications ──────────────────────────────────────────────────────

export function orderConfirmation(data: {
  customerName: string;
  orderTotal: string;
  items: { name: string; quantity: number; lineTotal: string }[];
  notes?: string | null;
}, locale?: string | null) {
  const s = getEmailStrings(locale).orderConfirmation;
  const itemRows = data.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #f0ede8;">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #f0ede8;text-align:right;">×${i.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #f0ede8;text-align:right;font-weight:500;">${i.lineTotal}</td></tr>`)
    .join("");
  return {
    subject: s.subject,
    html: base(`
      <h2>${s.h2}</h2>
      <p>${t(s.p1, { name: data.customerName })}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemRows}</table>
      <p style="text-align:right;font-size:16px;font-weight:600;">${s.totalLabel}: ${data.orderTotal}</p>
      ${data.notes ? `<p style="background:#f8f7f4;padding:12px 16px;border-radius:6px;font-size:14px;"><strong>${s.noteLabel}:</strong> ${data.notes}</p>` : ""}
      <a class="btn" href="${APP_URL}/portal/orders">${s.button}</a>
    `, locale),
  };
}

export function orderStatusUpdate(data: {
  customerName: string;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  orderTotal: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).orderStatusUpdate;
  const variant = s[data.status];
  return {
    subject: variant.subject,
    html: base(`
      <h2>${variant.h2}</h2>
      <p>${t(s.greeting, { name: data.customerName })}</p>
      <p>${variant.body}</p>
      <p style="color:#888;font-size:14px;">${s.totalLabel}: ${data.orderTotal}</p>
      <a class="btn" href="${APP_URL}/portal/orders">${s.button}</a>
    `, locale),
  };
}

export function sellerOrderNotification(data: {
  sellerName: string;
  buyerName: string;
  items: { name: string; quantity: number; lineTotal: string }[];
  subtotal: string;
}, locale?: string | null) {
  const s = getEmailStrings(locale).sellerOrderNotification;
  const count = data.items.length;
  const itemWord = count === 1 ? s.itemWord_one : s.itemWord_other;
  const itemRows = data.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #f0ede8;">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #f0ede8;text-align:right;">×${i.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #f0ede8;text-align:right;font-weight:500;">${i.lineTotal}</td></tr>`)
    .join("");
  return {
    subject: t(s.subject, { app: APP.name, count, itemWord }),
    html: base(`
      <h2>${s.h2}</h2>
      <p>${t(s.p1, { sellerName: data.sellerName, buyerName: data.buyerName })}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemRows}</table>
      <p style="text-align:right;font-size:16px;font-weight:600;">${s.subtotalLabel}: ${data.subtotal}</p>
      <a class="btn" href="${APP_URL}/portal/my-products/orders">${s.button}</a>
    `, locale),
  };
}

// ─── Adoption notifications ───────────────────────────────────────────────────

export function adoptionApplicationReceived(data: {
  ownerName: string;
  petName: string;
  applicantName: string;
  message?: string | null;
  experience?: string | null;
  housingType?: string | null;
}, locale?: string | null) {
  const s = getEmailStrings(locale).adoptionApplicationReceived;
  const housingLabel = data.housingType
    ? HOUSING_TYPE_LABELS[data.housingType] ?? data.housingType.replace(/_/g, " ")
    : null;
  return {
    subject: t(s.subject, { petName: data.petName }),
    html: base(`
      <h2>${t(s.h2, { petName: data.petName })}</h2>
      <p>${t(s.greeting, { name: data.ownerName })}</p>
      <p>${t(s.p1, { applicantName: data.applicantName, petName: data.petName })}</p>
      ${housingLabel ? `<p><strong>${s.housingLabel}:</strong> ${housingLabel}</p>` : ""}
      ${data.experience ? `<p style="background:#f0faf8;padding:12px 16px;border-radius:6px;border-left:4px solid #0D6E78;"><strong>${s.experienceLabel}:</strong> ${data.experience}</p>` : ""}
      ${data.message ? `<p style="background:#f8f7f4;padding:12px 16px;border-radius:6px;"><strong>${s.messageLabel}:</strong> ${data.message}</p>` : ""}
      <a class="btn" href="${APP_URL}/portal/adoptions">${s.button}</a>
    `, locale),
  };
}

export function adoptionApplicationStatusChanged(data: {
  applicantName: string;
  petName: string;
  status: "approved" | "rejected";
  ownerNote?: string | null;
}, locale?: string | null) {
  const s = getEmailStrings(locale).adoptionApplicationStatusChanged;
  const variant = s[data.status];
  return {
    subject: t(variant.subject, { petName: data.petName }),
    html: base(`
      <h2>${variant.h2}</h2>
      <p>${t(s.greeting, { name: data.applicantName })}</p>
      <p>${t(variant.body, { petName: data.petName })}</p>
      ${data.ownerNote ? `<p style="background:#f8f7f4;padding:12px 16px;border-radius:6px;"><strong>${s.ownerNoteLabel}:</strong> ${data.ownerNote}</p>` : ""}
      <a class="btn" href="${APP_URL}/portal/adopt">${s.button}</a>
    `, locale),
  };
}

// ─── Template key → function map ─────────────────────────────────────────────

export type TemplateKey =
  | "owner_welcome"
  | "owner_add_pet"
  | "owner_health_tracking"
  | "owner_week_one";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TEMPLATE_MAP: Record<TemplateKey, (data: any, locale?: string | null) => { subject: string; html: string }> = {
  owner_welcome: ownerWelcome,
  owner_add_pet: ownerAddPet,
  owner_health_tracking: ownerHealthTracking,
  owner_week_one: ownerWeekOne,
};
