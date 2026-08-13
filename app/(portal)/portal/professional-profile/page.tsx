import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstance } from "@/lib/db";
import { vetProfiles, sitterProfiles, groomerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfessionalProfileForm from "./ProfessionalProfileForm";
import AvailabilityManager from "@/components/portal/AvailabilityManager";

export default async function ProfessionalProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  if (role !== "veterinarian" && role !== "pet_sitter" && role !== "groomer") {
    redirect("/portal/dashboard");
  }

  const db = getInstance();

  if (role === "veterinarian") {
    const profile = await db.query.vetProfiles.findFirst({
      where: eq(vetProfiles.userId, session.user.id),
    });
    return (
      <>
        <ProfessionalProfileForm role="veterinarian" initialData={profile ?? null} />
        <AvailabilityManager />
      </>
    );
  }

  if (role === "groomer") {
    const profile = await db.query.groomerProfiles.findFirst({
      where: eq(groomerProfiles.userId, session.user.id),
    });
    return (
      <>
        <ProfessionalProfileForm role="groomer" initialData={profile ?? null} />
        <AvailabilityManager />
      </>
    );
  }

  const profile = await db.query.sitterProfiles.findFirst({
    where: eq(sitterProfiles.userId, session.user.id),
  });
  return (
    <>
      <ProfessionalProfileForm role="pet_sitter" initialData={profile ?? null} />
      <AvailabilityManager />
    </>
  );
}
