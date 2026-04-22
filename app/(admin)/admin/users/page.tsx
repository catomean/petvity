"use client";

import { useEffect, useState, useTransition } from "react";
import { Users, PawPrint, Shield } from "lucide-react";

type UserRole = "pet_owner" | "veterinarian" | "pet_sitter" | "admin";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  petCount: number;
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin:        "bg-purple-50 text-purple-700",
  veterinarian: "bg-blue-50 text-blue-700",
  pet_sitter:   "bg-amber-50 text-amber-700",
  pet_owner:    "bg-[var(--teal-light)] text-[var(--teal)]",
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "pet_owner",    label: "Pet Owner" },
  { value: "veterinarian", label: "Veterinarian" },
  { value: "pet_sitter",   label: "Pet Sitter" },
  { value: "admin",        label: "Admin" },
];

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRows(json.data);
        else setError(json.error ?? "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setChangingId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    setChangingId(null);
    if (data.success) {
      setRows((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, role: newRole } : r)),
      );
      startTransition(() => {});
    } else {
      alert(data.error ?? "Failed to update role");
    }
  }

  const admins    = rows.filter((r) => r.role === "admin").length;
  const vets      = rows.filter((r) => r.role === "veterinarian").length;
  const totalPets = rows.reduce((sum, r) => sum + r.petCount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Users</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Manage accounts and roles</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users,   label: "Total users",  value: rows.length },
          { icon: PawPrint,label: "Total pets",    value: totalPets },
          { icon: Shield,  label: "Admins",        value: admins },
          { icon: Shield,  label: "Veterinarians", value: vets },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[var(--teal)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--ink)]">{loading ? "—" : value}</p>
              <p className="text-xs text-[var(--muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[var(--muted)] text-sm">Loading…</div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-[var(--danger)] text-sm">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--off)]">
                  <th className="text-start py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">User</th>
                  <th className="text-start py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Role</th>
                  <th className="text-start py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Pets</th>
                  <th className="text-start py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--off)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-xs flex-shrink-0">
                          {(row.name ?? row.email)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--ink)] truncate">
                            {row.name ?? <span className="text-[var(--muted)] italic">No name</span>}
                          </p>
                          <p className="text-xs text-[var(--muted)] truncate">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[row.role] ?? "bg-[var(--off)] text-[var(--ink2)]"}`}>
                          {row.role.replace("_", " ")}
                        </span>
                        <select
                          className="text-xs border border-[var(--border)] rounded-md px-1.5 py-0.5 bg-white text-[var(--ink2)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)] disabled:opacity-50"
                          value={row.role}
                          disabled={changingId === row.id}
                          onChange={(e) => handleRoleChange(row.id, e.target.value as UserRole)}
                          aria-label={`Change role for ${row.name ?? row.email}`}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {changingId === row.id && (
                          <span className="text-xs text-[var(--muted)]">Saving…</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--ink2)]">{row.petCount}</td>
                    <td className="py-3 px-4 text-[var(--muted)]">
                      {new Date(row.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[var(--muted)] text-sm">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
