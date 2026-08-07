"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEMO_ACCOUNT } from "@/lib/config/demo";

/**
 * One-click demo entry: /demo signs the visitor into the shared demo account
 * and lands them on the dashboard. Linked from the marketing pages so a
 * visitor reaches the real product in a single click, no form.
 */
export default function DemoPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // strict-mode double-invoke guard
    started.current = true;
    (async () => {
      const res = await signIn("credentials", {
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
        redirect: false,
      });
      if (res?.error) setFailed(true);
      else router.replace("/portal/dashboard");
    })();
  }, [router]);

  return (
    <div className="text-center py-10">
      {failed ? (
        <>
          <h1 className="font-display font-medium text-2xl mb-2 text-[var(--warm-ink)]">
            The demo is being refreshed
          </h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Please try again in a minute — or create your own free account.
          </p>
          <Link href="/register" className="btn-primary inline-flex">
            Start for free
          </Link>
        </>
      ) : (
        <>
          <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-[var(--border)] border-t-[var(--gold)] animate-spin" aria-hidden />
          <p className="text-sm text-[var(--muted)]">Opening the live demo…</p>
        </>
      )}
    </div>
  );
}
