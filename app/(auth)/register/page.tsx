"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PawPrint, Stethoscope, Heart } from "lucide-react";
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";
import { PasswordInput } from "@/components/portal/PasswordInput";
import { safeReturnTo } from "@/lib/auth/safe-redirect";

type IntendedRole = "pet_owner" | "veterinarian" | "pet_sitter";

const ROLE_OPTIONS: { id: IntendedRole; icon: React.ElementType; label: string; desc: string }[] = [
  { id: "pet_owner",    icon: PawPrint,     label: "Pet owner",   desc: "Track my pet's health" },
  { id: "veterinarian", icon: Stethoscope,  label: "Veterinarian", desc: "Offer vet services" },
  { id: "pet_sitter",   icon: Heart,        label: "Pet sitter",   desc: "Offer sitting & boarding" },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(
    searchParams.get("returnTo") ?? searchParams.get("next"),
    "/portal/dashboard",
  );
  const roleParam = searchParams.get("role");
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [intendedRole, setIntendedRole] = useState<IntendedRole>(
    roleParam === "vet" ? "veterinarian" : roleParam === "sitter" ? "pet_sitter" : "pet_owner",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { nameRef.current?.focus(); }, []);

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
      body: JSON.stringify({ name: name.trim() || undefined, email, password, intendedRole }),
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
      router.push(intendedRole === "pet_owner" ? returnTo : "/portal/professional-profile");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-1 text-[var(--ink)]">
        Start for free
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        No credit card · Cancel anytime
      </p>

      {error && <p className="alert-error mb-5">{error}</p>}

      {/* Role selector */}
      <div className="mb-5">
        <p className="text-sm font-medium text-[var(--ink2)] mb-2">I am joining as…</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map(({ id, icon: Icon, label, desc }) => {
            const selected = intendedRole === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setIntendedRole(id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                  selected
                    ? "border-[var(--teal)] bg-[var(--teal-light)]"
                    : "border-[var(--border)] hover:border-[var(--teal-light)] hover:bg-[var(--off)]"
                }`}
              >
                <Icon className={`w-5 h-5 ${selected ? "text-[var(--teal)]" : "text-[var(--muted)]"}`} />
                <span className={`text-xs font-semibold leading-tight ${selected ? "text-[var(--teal)]" : "text-[var(--ink2)]"}`}>
                  {label}
                </span>
                <span className="text-xs text-[var(--muted)] leading-tight hidden sm:block">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">
            Your name
          </label>
          <input
            ref={nameRef}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="George"
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
          {loading
            ? "Setting up your account…"
            : intendedRole === "pet_owner"
              ? "Begin your pet's wellness journey"
              : "Create professional account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--teal)] hover:underline font-medium">
          Log in
        </Link>
      </p>

      <p className="mt-5 text-center text-xs text-[var(--muted)] leading-relaxed">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
