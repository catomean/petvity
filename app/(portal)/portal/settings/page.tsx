"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Lock, CheckCircle } from "lucide-react";
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";
import { PasswordInput } from "@/components/portal/PasswordInput";
import { userRoleLabel } from "@/lib/config/users";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [, startTransition] = useTransition();

  /* ── Profile section ─────────────────────────────────────────────────── */
  const [name, setName] = useState(session?.user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setProfileSaving(false);
    if (data.success) {
      setProfileMsg({ ok: true, text: "Name updated." });
      await updateSession({ name: name.trim() });
      startTransition(() => router.refresh());
    } else {
      setProfileMsg({ ok: false, text: data.error ?? "Update failed." });
    }
  }

  /* ── Password section ────────────────────────────────────────────────── */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "Passwords don't match." });
      return;
    }
    if (newPw.length < PASSWORD_MIN_LENGTH) {
      setPwMsg({ ok: false, text: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` });
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (data.success) {
      setPwMsg({ ok: true, text: "Password changed successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      setPwMsg({ ok: false, text: data.error ?? "Password change failed." });
    }
  }

  if (!session) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Settings</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Manage your account details</p>
      </div>

      {/* ── Profile ───────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
            <User className="w-4 h-4 text-[var(--teal)]" />
          </div>
          <h2 className="font-semibold text-[var(--ink)]">Profile</h2>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Display name
            </label>
            <input
              className="form-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Email
            </label>
            <input
              className="form-input bg-[var(--off)] cursor-not-allowed"
              value={session.user?.email ?? ""}
              disabled
              title="Email cannot be changed"
            />
            <p className="text-xs text-[var(--muted)] mt-1">Email address cannot be changed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Role
            </label>
            <input
              className="form-input bg-[var(--off)] cursor-not-allowed"
              value={userRoleLabel(session.user?.role ?? "pet_owner")}
              disabled
            />
          </div>

          {profileMsg && (
            <p className={profileMsg.ok ? "alert-success flex items-center gap-2" : "alert-error"}>
              {profileMsg.ok && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="btn-primary disabled:opacity-60"
          >
            {profileSaving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* ── Password ─────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[var(--teal)]" />
          </div>
          <h2 className="font-semibold text-[var(--ink)]">Change password</h2>
        </div>

        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Current password
            </label>
            <PasswordInput
              value={currentPw}
              onChange={setCurrentPw}
              autoComplete="current-password"
              required
              placeholder="Your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              New password
            </label>
            <PasswordInput
              value={newPw}
              onChange={setNewPw}
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
              Confirm new password
            </label>
            <PasswordInput
              value={confirmPw}
              onChange={setConfirmPw}
              autoComplete="new-password"
              required
              placeholder="Repeat your new password"
            />
          </div>

          {pwMsg && (
            <p className={pwMsg.ok ? "alert-success flex items-center gap-2" : "alert-error"}>
              {pwMsg.ok && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="btn-primary disabled:opacity-60"
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
