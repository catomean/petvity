"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/portal/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get("returnTo") ?? "";
  const returnTo = rawReturnTo.startsWith("/") ? rawReturnTo : "/portal/dashboard";
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password. Please try again.");
    } else {
      router.push(returnTo);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-1 text-[var(--ink)]">Welcome back</h1>
      <p className="text-sm text-[var(--muted)] mb-7">
        Your pets missed you 🐾
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-[var(--ink2)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--muted)] hover:text-[var(--teal)] no-underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center mt-1 py-3 text-base disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Continue to dashboard"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        No account?{" "}
        <Link href="/register" className="text-[var(--teal)] hover:underline font-medium">
          Start for free
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
