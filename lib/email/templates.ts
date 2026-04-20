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
