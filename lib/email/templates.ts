import { APP, APP_URL } from "@/lib/config/app";

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
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
<body>
  <div class="wrap">
    <div class="header"><a href="${APP_URL}">${APP.name}</a></div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>${APP.name} · <a href="${APP_URL}">${APP_URL.replace("https://", "")}</a></p>
      <p>Questions? <a href="mailto:${APP.supportEmail}">${APP.supportEmail}</a></p>
    </div>
  </div>
</body>
</html>`;

// ─── Welcome ──────────────────────────────────────────────────────────────────

export function ownerWelcome(data: { name: string }) {
  return {
    subject: `Welcome to ${APP.name}!`,
    html: base(`
      <h2>Welcome, ${data.name}!</h2>
      <p>You're all set to start caring for your pets like family.</p>
      <p>Add your first pet to begin tracking their health and well-being.</p>
      <a class="btn" href="${APP_URL}/portal/pets/new">Add your first pet</a>
      <p>If you have any questions, reply to this email and we'll be happy to help.</p>
    `),
  };
}

export function ownerAddPet(data: { name: string }) {
  return {
    subject: `${APP.name}: Ready to add your first pet?`,
    html: base(`
      <h2>Hi ${data.name},</h2>
      <p>Adding your pet only takes a minute. Give them a name, choose their species, and you're ready to start tracking.</p>
      <a class="btn" href="${APP_URL}/portal/pets/new">Add a pet now</a>
    `),
  };
}

export function ownerHealthTracking(data: { name: string }) {
  return {
    subject: `${APP.name}: Start tracking your pet's health`,
    html: base(`
      <h2>Hi ${data.name},</h2>
      <p>Did you know you can track your pet's weight, temperature, mood, and energy levels right in ${APP.name}?</p>
      <p>Daily check-ins take less than 2 minutes and help you spot changes early.</p>
      <a class="btn" href="${APP_URL}/portal/checkin">Log today's check-in</a>
    `),
  };
}

export function ownerWeekOne(data: { name: string }) {
  return {
    subject: `${APP.name}: Your first week`,
    html: base(`
      <h2>Hi ${data.name},</h2>
      <p>One week in — great job! Here's what ${APP.name} can do for your pet:</p>
      <ul>
        <li>Track vaccinations and get reminders before they expire</li>
        <li>Keep a complete health record for every vet visit</li>
        <li>Share your pet's public profile with family and friends</li>
      </ul>
      <a class="btn" href="${APP_URL}/portal/dashboard">Go to your dashboard</a>
    `),
  };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export function passwordReset(data: { resetUrl: string }) {
  return {
    subject: `Reset your ${APP.name} password`,
    html: base(`
      <h2>Reset your password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a class="btn" href="${data.resetUrl}">Reset password</a>
      <p>If you didn't request a password reset, you can ignore this email.</p>
    `),
  };
}

// ─── Health alert ─────────────────────────────────────────────────────────────

export function petHealthAlert(data: {
  ownerName: string;
  petName: string;
  reason: string;
  petUrl: string;
}) {
  return {
    subject: `${APP.name}: ${data.petName} may need attention`,
    html: base(`
      <h2>Hi ${data.ownerName},</h2>
      <p>We noticed something that may need your attention for <strong>${data.petName}</strong>:</p>
      <p style="background:#fff3cd;padding:12px 16px;border-radius:6px;border-left:4px solid #d4820a;">
        ${data.reason}
      </p>
      <a class="btn" href="${data.petUrl}">View ${data.petName}'s health</a>
      <p style="margin-top:8px;">If you'd like a professional opinion, you can <a href="${APP_URL}/portal/find" style="color:#2a7a8a;">find a vet or sitter near you</a> directly on Petvity.</p>
    `),
  };
}

// ─── Vaccination reminder ─────────────────────────────────────────────────────

export function vaccinationReminder(data: {
  ownerName: string;
  petName: string;
  vaccinationName: string;
  dueDate: string;
  petUrl: string;
}) {
  return {
    subject: `${APP.name}: ${data.petName}'s ${data.vaccinationName} is due soon`,
    html: base(`
      <h2>Vaccination reminder</h2>
      <p>Hi ${data.ownerName},</p>
      <p><strong>${data.petName}'s ${data.vaccinationName}</strong> vaccination is due on <strong>${data.dueDate}</strong>.</p>
      <p>Book a vet appointment soon to keep your pet protected.</p>
      <a class="btn" href="${data.petUrl}">View vaccination schedule</a>
    `),
  };
}

// ─── Booking notifications ────────────────────────────────────────────────────

export function bookingRequestReceived(data: {
  professionalName: string;
  ownerName: string;
  petName: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
}) {
  return {
    subject: `New booking request from ${data.ownerName} for ${data.petName}`,
    html: base(`
      <h2>New booking request</h2>
      <p>Hi ${data.professionalName},</p>
      <p><strong>${data.ownerName}</strong> has requested a booking for <strong>${data.petName}</strong>.</p>
      <p style="background:#f0faf8;padding:12px 16px;border-radius:6px;border-left:4px solid #0D6E78;">
        <strong>Dates:</strong> ${data.startDate}${data.startDate !== data.endDate ? ` – ${data.endDate}` : ""}<br/>
        ${data.notes ? `<strong>Notes:</strong> ${data.notes}` : ""}
      </p>
      <a class="btn" href="${APP_URL}/portal/bookings">Review booking</a>
      <p>Please confirm or decline this request.</p>
    `),
  };
}

export function bookingStatusChanged(data: {
  ownerName: string;
  petName: string;
  status: "confirmed" | "cancelled" | "completed";
  startDate: string;
}) {
  const messages = {
    confirmed: { heading: "Booking confirmed!", body: `Your appointment for <strong>${data.petName}</strong> on <strong>${data.startDate}</strong> has been confirmed.` },
    cancelled:  { heading: "Booking cancelled", body: `Your booking for <strong>${data.petName}</strong> on <strong>${data.startDate}</strong> has been cancelled.` },
    completed:  { heading: "Session completed", body: `Your session for <strong>${data.petName}</strong> on <strong>${data.startDate}</strong> has been marked as completed. Leave a review to share your experience!` },
  };
  const { heading, body } = messages[data.status];
  return {
    subject: `${APP.name}: ${heading}`,
    html: base(`
      <h2>${heading}</h2>
      <p>Hi ${data.ownerName},</p>
      <p>${body}</p>
      <a class="btn" href="${APP_URL}/portal/bookings">View my bookings</a>
    `),
  };
}

// ─── Order notifications ──────────────────────────────────────────────────────

export function orderConfirmation(data: {
  customerName: string;
  orderTotal: string;
  items: { name: string; quantity: number; lineTotal: string }[];
  notes?: string | null;
}) {
  const itemRows = data.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #f0ede8;">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #f0ede8;text-align:right;">×${i.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #f0ede8;text-align:right;font-weight:500;">${i.lineTotal}</td></tr>`)
    .join("");
  return {
    subject: `Your ${APP.name} order is confirmed`,
    html: base(`
      <h2>Order confirmed ✓</h2>
      <p>Hi ${data.customerName}, your order has been received and is being prepared.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemRows}</table>
      <p style="text-align:right;font-size:16px;font-weight:600;">Total: ${data.orderTotal}</p>
      ${data.notes ? `<p style="background:#f8f7f4;padding:12px 16px;border-radius:6px;font-size:14px;"><strong>Your note:</strong> ${data.notes}</p>` : ""}
      <a class="btn" href="${APP_URL}/portal/orders">View my orders</a>
    `),
  };
}

export function orderStatusUpdate(data: {
  customerName: string;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  orderTotal: string;
}) {
  const messages = {
    confirmed: { heading: "Order confirmed", body: "Your order has been confirmed and is being prepared for shipment." },
    shipped:   { heading: "Order shipped!", body: "Great news — your order is on its way." },
    delivered: { heading: "Order delivered", body: "Your order has been marked as delivered. Enjoy!" },
    cancelled: { heading: "Order cancelled", body: "Your order has been cancelled." },
  };
  const { heading, body } = messages[data.status];
  return {
    subject: `${APP.name}: ${heading}`,
    html: base(`
      <h2>${heading}</h2>
      <p>Hi ${data.customerName},</p>
      <p>${body}</p>
      <p style="color:#888;font-size:14px;">Order total: ${data.orderTotal}</p>
      <a class="btn" href="${APP_URL}/portal/orders">View my orders</a>
    `),
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
}) {
  return {
    subject: `New adoption application for ${data.petName}`,
    html: base(`
      <h2>Someone wants to adopt ${data.petName}!</h2>
      <p>Hi ${data.ownerName},</p>
      <p><strong>${data.applicantName}</strong> has submitted an adoption application for <strong>${data.petName}</strong>.</p>
      ${data.housingType ? `<p><strong>Housing:</strong> ${data.housingType.replace(/_/g, " ")}</p>` : ""}
      ${data.experience ? `<p style="background:#f0faf8;padding:12px 16px;border-radius:6px;border-left:4px solid #0D6E78;"><strong>Experience:</strong> ${data.experience}</p>` : ""}
      ${data.message ? `<p style="background:#f8f7f4;padding:12px 16px;border-radius:6px;"><strong>Message:</strong> ${data.message}</p>` : ""}
      <a class="btn" href="${APP_URL}/portal/adoptions">Review application</a>
    `),
  };
}

export function adoptionApplicationStatusChanged(data: {
  applicantName: string;
  petName: string;
  status: "approved" | "rejected";
  ownerNote?: string | null;
}) {
  const isApproved = data.status === "approved";
  return {
    subject: isApproved
      ? `Your application to adopt ${data.petName} was approved! 🎉`
      : `Update on your application to adopt ${data.petName}`,
    html: base(`
      <h2>${isApproved ? "Application approved! 🎉" : "Application update"}</h2>
      <p>Hi ${data.applicantName},</p>
      ${isApproved
        ? `<p>Congratulations! Your adoption application for <strong>${data.petName}</strong> has been <strong style="color:#16A34A;">approved</strong>. The owner will be in touch to arrange the next steps.</p>`
        : `<p>Your adoption application for <strong>${data.petName}</strong> has been reviewed. Unfortunately, the owner has decided to proceed with another applicant at this time.</p>`
      }
      ${data.ownerNote ? `<p style="background:#f8f7f4;padding:12px 16px;border-radius:6px;"><strong>Message from owner:</strong> ${data.ownerNote}</p>` : ""}
      <a class="btn" href="${APP_URL}/portal/adopt">Browse more pets</a>
    `),
  };
}

// ─── Template key → function map ─────────────────────────────────────────────

export type TemplateKey =
  | "owner_welcome"
  | "owner_add_pet"
  | "owner_health_tracking"
  | "owner_week_one";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TEMPLATE_MAP: Record<TemplateKey, (data: any) => { subject: string; html: string }> = {
  owner_welcome: ownerWelcome,
  owner_add_pet: ownerAddPet,
  owner_health_tracking: ownerHealthTracking,
  owner_week_one: ownerWeekOne,
};
