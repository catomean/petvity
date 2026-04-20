import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-6">Settings</h1>
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 space-y-4">
        <div>
          <div className="text-sm font-medium text-[var(--ink2)] mb-1">Name</div>
          <div className="text-[var(--ink)]">{session.user.name}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--ink2)] mb-1">Email</div>
          <div className="text-[var(--ink)]">{session.user.email}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--ink2)] mb-1">Role</div>
          <div className="text-[var(--muted)] capitalize">
            {session.user.role.replace("_", " ")}
          </div>
        </div>
      </div>
    </div>
  );
}
