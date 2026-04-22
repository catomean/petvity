import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstance } from "@/lib/db";
import { vetProfiles, sitterProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfessionalProfileForm from "./ProfessionalProfileForm";

export default async function ProfessionalProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  if (role !== "veterinarian" && role !== "pet_sitter") {
    redirect("/portal/dashboard");
  }

  const db = getInstance();

  if (role === "veterinarian") {
    const profile = await db.query.vetProfiles.findFirst({
      where: eq(vetProfiles.userId, session.user.id),
    });
    return <ProfessionalProfileForm role="veterinarian" initialData={profile ?? null} />;
  }

  const profile = await db.query.sitterProfiles.findFirst({
    where: eq(sitterProfiles.userId, session.user.id),
  });
  return <ProfessionalProfileForm role="pet_sitter" initialData={profile ?? null} />;
}
