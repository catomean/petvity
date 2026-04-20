import { getInstance } from "@/lib/db";
import { emailQueue } from "@/lib/db/schema";
import { WELCOME_SEQUENCE } from "@/lib/config/email-sequences";

/**
 * Enqueue the welcome email sequence for a new pet owner.
 * Emails are scheduled relative to now using WELCOME_SEQUENCE delays.
 */
export async function enqueueWelcomeSequence(
  userId: string,
  payload: { name: string; email: string },
): Promise<void> {
  const db = getInstance();
  const now = Date.now();

  await db.insert(emailQueue).values([
    {
      userId,
      templateKey: "owner_welcome",
      sendAt: new Date(now + WELCOME_SEQUENCE.welcome),
      payload,
    },
    {
      userId,
      templateKey: "owner_add_pet",
      sendAt: new Date(now + WELCOME_SEQUENCE.addPet),
      payload,
    },
    {
      userId,
      templateKey: "owner_health_tracking",
      sendAt: new Date(now + WELCOME_SEQUENCE.healthTracking),
      payload,
    },
    {
      userId,
      templateKey: "owner_week_one",
      sendAt: new Date(now + WELCOME_SEQUENCE.weekOne),
      payload,
    },
  ]);
}
