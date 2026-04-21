"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";
import { PasswordInput } from "@/components/portal/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      setLoading(false);
      setError(data.error ?? "Registration failed.");
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (signInRes?.error) {
      setError("Account created — please log in.");
    } else {
      router.push("/portal/dashboard");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-1 text-[var(--ink)]">
        Start for free
      </h1>
      <p className="text-sm text-[var(--muted)] mb-7">
        No credit card · Cancel anytime
      </p>

      {error && <p className="alert-error mb-5">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Email
          </label>
          <input
            ref={emailRef}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Password
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Confirm password
          </label>
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
          {loading ? "Setting up your account…" : "Begin your pet's wellness journey"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--teal)] hover:underline font-medium">
          Log in
        </Link>
      </p>

      <p className="mt-5 text-center text-xs text-[var(--faint)] leading-relaxed">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </>
  );
}
