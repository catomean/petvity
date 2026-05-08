import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstance } from "@/lib/db";
import { sellerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SellerProfileForm from "./SellerProfileForm";

export default async function SellerProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const db = getInstance();
  const profile = await db.query.sellerProfiles.findFirst({
    where: eq(sellerProfiles.userId, session.user.id),
  });

  return <SellerProfileForm initialData={profile ?? null} userName={session.user.name ?? null} />;
}
