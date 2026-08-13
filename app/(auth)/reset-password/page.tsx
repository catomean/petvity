"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";
import { PasswordInput } from "@/components/portal/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => { passwordRef.current?.focus(); }, []);

  if (!token) {
    return (
      <>
        <h1 className="font-display font-medium text-3xl mb-2 text-[var(--warm-ink)]">Invalid link</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          This reset link is missing a token.{" "}
          <Link href="/forgot-password" className="link-accent">
            Request a new one.
          </Link>
        </p>
      </>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-7 h-7 text-[var(--teal)]" />
        </div>
        <h1 className="font-display font-medium text-3xl mb-2 text-[var(--warm-ink)]">Password updated</h1>
        <p className="text-sm text-[var(--muted)] mb-7">
          Your password has been changed. You can now log in with your new password.
        </p>
        <button
          className="btn-primary w-full justify-center py-3 text-base"
          onClick={() => router.push("/login")}
        >
          Go to login
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Reset failed. Please request a new link.");
    } else {
      setDone(true);
    }
  }

  return (
    <>
      <h1 className="font-display font-medium text-3xl mb-1 text-[var(--warm-ink)]">Set new password</h1>
      <p className="text-sm text-[var(--muted)] mb-7">
        Choose a strong password — at least {PASSWORD_MIN_LENGTH} characters.
      </p>

      {error && <p className="alert-error mb-5">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="form-label">New password</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          />
        </div>
        <div>
          <label className="form-label">Confirm new password</label>
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            required
            placeholder="Repeat your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center mt-1 py-3 text-base disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
