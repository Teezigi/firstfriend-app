"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTERESTS = [
  "🏃 Running",
  "🍜 Food spots",
  "🎨 Art & museums",
  "⚽ Five-a-side",
  "🎶 Live music",
  "📚 Book clubs",
  "🧗 Climbing",
  "☕ Coffee",
];

const ARRIVAL_OPTIONS: { value: string; label: string }[] = [
  { value: "just_landed", label: "Just landed" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_12_months", label: "6–12 months" },
];

function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isMovingSoon = params.get("path") === "soon";

  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [area, setArea] = useState("");
  const [arrivalStatus, setArrivalStatus] = useState("just_landed");
  const [moveDate, setMoveDate] = useState("");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [isAdult, setIsAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // If this user already has a profile, skip straight to their status page.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        router.replace("/waiting");
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isAdult) {
      setError("You need to confirm you're 18 or over to continue.");
      return;
    }
    if (!area.trim()) {
      setError("Let us know which area you're in.");
      return;
    }
    if (isMovingSoon && !moveDate) {
      setError("Let us know roughly when you're moving.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      display_name: displayName.trim() || "Newcomer",
      area: area.trim(),
      arrival_status: isMovingSoon ? "moving_soon" : arrivalStatus,
      move_date: isMovingSoon ? moveDate : null,
      interest: interest.replace(/^\S+\s/, ""), // store without emoji
      is_adult: true,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/waiting");
  }

  if (checking) return null;

  return (
    <form onSubmit={submit} className="max-w-sm w-full">
      <div className="text-xl font-extrabold mb-6">
        first<span className="text-coral">friend</span>
      </div>

      <h1 className="text-2xl font-bold leading-snug">
        {isMovingSoon
          ? "Tell us where you're headed"
          : "Quick signal: who are you, where'd you land?"}
      </h1>
      <p className="mt-2 text-sub text-[14.5px]">
        This is the only setup step. No profile essay, no swiping.
      </p>

      <div className="mt-6">
        <label className="text-[12.5px] font-bold uppercase tracking-wide text-sub">
          First name
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Sam"
          className="mt-2 w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-[16px] focus:outline-none focus:border-coral"
        />
      </div>

      <div className="mt-5">
        <label className="text-[12.5px] font-bold uppercase tracking-wide text-sub">
          {isMovingSoon ? "Where are you moving?" : "Your new city / area"}
        </label>
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Manchester"
          className="mt-2 w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-[16px] focus:outline-none focus:border-coral"
        />
      </div>

      {isMovingSoon ? (
        <div className="mt-5">
          <label className="text-[12.5px] font-bold uppercase tracking-wide text-sub">
            When are you moving?
          </label>
          <input
            type="date"
            value={moveDate}
            onChange={(e) => setMoveDate(e.target.value)}
            className="mt-2 w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-[16px] focus:outline-none focus:border-coral"
          />
          <p className="mt-1.5 text-xs text-sub">
            We&apos;ll start looking for your group shortly before you arrive.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <label className="text-[12.5px] font-bold uppercase tracking-wide text-sub">
            When did you arrive?
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ARRIVAL_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setArrivalStatus(opt.value)}
                className={`px-3.5 py-2.5 rounded-full text-sm border-2 ${
                  arrivalStatus === opt.value
                    ? "bg-coral-soft border-coral text-coral font-bold"
                    : "bg-[#f2efe9] border-transparent text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="text-[12.5px] font-bold uppercase tracking-wide text-sub">
          Pick one thing you&apos;d actually show up for
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setInterest(opt)}
              className={`px-3.5 py-2.5 rounded-full text-sm border-2 ${
                interest === opt
                  ? "bg-coral-soft border-coral text-coral font-bold"
                  : "bg-[#f2efe9] border-transparent text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 text-[13.5px] text-foreground">
        <input
          type="checkbox"
          checked={isAdult}
          onChange={(e) => setIsAdult(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-[#ff6b4a] flex-shrink-0"
        />
        <span>
          I confirm I&apos;m 18 or over. FirstFriend groups meet in person, so
          this keeps everyone in a group an adult.
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full py-4 rounded-2xl bg-coral text-white font-bold text-[16px] disabled:opacity-50"
      >
        {saving
          ? "Saving…"
          : isMovingSoon
          ? "Set my move date"
          : "Find my group"}
      </button>
    </form>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <Suspense fallback={null}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
