import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarNav from "@/components/portal/SidebarNav";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--off)]">
      <SidebarNav
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={session.user.role}
      />
      {/* Offset for desktop sidebar (w-60) and mobile top/bottom bars */}
      <div className="lg:ps-60">
        <main className="pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
