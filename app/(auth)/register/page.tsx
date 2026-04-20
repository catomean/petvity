"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
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
      setError("Account created but login failed. Please log in manually.");
    } else {
      router.push("/portal/dashboard");
    }
  }

  return (
    <>
      <h1 className="text-xl font-bold mb-1 text-[var(--ink)]">Create your account</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        Free forever · No credit card required
      </p>

      {error && <p className="alert-error mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Your name
          </label>
          <input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Email
          </label>
          <input
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
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center mt-1 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create free account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--teal)] hover:underline font-medium">
          Log in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-[var(--faint)] leading-relaxed">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </>
  );
}
