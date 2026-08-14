import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInstance } from "@/lib/db";
import { sellerProfiles, products } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import SellerProfileForm from "./SellerProfileForm";
import ProfileReadiness from "@/components/portal/ProfileReadiness";

export default async function SellerProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const db = getInstance();
  const [profile, [{ value: productCount }]] = await Promise.all([
    db.query.sellerProfiles.findFirst({
      where: eq(sellerProfiles.userId, session.user.id),
    }),
    db.select({ value: count() }).from(products).where(eq(products.sellerId, session.user.id)),
  ]);

  return (
    <>
      <ProfileReadiness
        kind="seller"
        profile={{ ...(profile ?? {}), productCount } as Record<string, unknown>}
      />
      <SellerProfileForm initialData={profile ?? null} userName={session.user.name ?? null} />
    </>
  );
}
