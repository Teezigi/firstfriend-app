"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const path = params.get("path") === "soon" ? "soon" : "here";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?path=${path}`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-sub text-[15px]">
          We sent a sign-in link to <b>{email}</b>. Tap it on this device to
          continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={sendLink} className="max-w-sm w-full">
      <div className="text-xl font-extrabold mb-6">
        first<span className="text-coral">friend</span>
      </div>
      <h1 className="text-2xl font-bold">What&apos;s your email?</h1>
      <p className="mt-2 text-sub text-[14.5px]">
        No password needed — we&apos;ll email you a one-tap sign-in link.
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-6 w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-[16px] focus:outline-none focus:border-coral"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full py-4 rounded-2xl bg-coral text-white font-bold text-[16px] disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
