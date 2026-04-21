"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <>
        <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center text-2xl mx-auto mb-5">
          📬
        </div>
        <h1 className="text-2xl font-bold mb-2 text-[var(--ink)] text-center">Check your inbox</h1>
        <p className="text-sm text-[var(--muted)] text-center mb-7 leading-relaxed">
          If <strong className="text-[var(--ink2)]">{email}</strong> is registered, we sent a
          password reset link. Check your spam folder if it doesn&apos;t arrive.
        </p>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="text-[var(--teal)] hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to login
      </Link>

      <h1 className="text-2xl font-bold mb-1 text-[var(--ink)]">Reset your password</h1>
      <p className="text-sm text-[var(--muted)] mb-7">
        Enter your email and we&apos;ll send you a reset link.
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
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </>
  );
}
