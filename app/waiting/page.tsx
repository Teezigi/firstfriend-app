"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  display_name: string;
  area: string;
  interest: string;
  arrival_status: string;
  group_id: string | null;
};

type GroupMember = {
  profile_id: string;
  passcode: string;
  profiles: { display_name: string; arrival_status: string } | null;
};

const ARRIVAL_LABEL: Record<string, string> = {
  just_landed: "Just landed",
  "1_3_months": "1–3 months here",
  "3_6_months": "3–6 months here",
  "6_12_months": "6–12 months here",
  moving_soon: "Moving soon",
};

export default function WaitingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [othersWaiting, setOthersWaiting] = useState(0);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myPasscode, setMyPasscode] = useState<string | null>(null);

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

      const { data: me } = await supabase
        .from("profiles")
        .select("id, display_name, area, interest, arrival_status, group_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!me) {
        router.replace("/onboarding");
        return;
      }
      setProfile(me);

      if (me.group_id) {
        const { data: groupMembers } = await supabase
          .from("group_members")
          .select("profile_id, passcode, profiles(display_name, arrival_status)")
          .eq("group_id", me.group_id);
        // Supabase's typed join can return an array or object depending on
        // relationship inference, normalize to a single object here.
        const normalized = (groupMembers ?? []).map((m) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles,
        })) as GroupMember[];
        setMembers(normalized);
        setMyPasscode(
          normalized.find((m) => m.profile_id === user.id)?.passcode ?? null
        );
      } else {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("area", me.area)
          .eq("interest", me.interest)
          .is("group_id", null)
          .neq("id", user.id);
        setOthersWaiting(count ?? 0);
      }

      setLoading(false);
    })();
  }, [router]);

  if (loading) return null;
  if (!profile) return null;

  // ── Matched into a group ──────────────────────────────
  if (profile.group_id) {
    const others = members.filter((m) => m.profile_id !== profile.id);
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
        <div className="max-w-sm w-full">
          <div className="text-xl font-extrabold mb-6">
            first<span className="text-coral">friend</span>
          </div>
          <h1 className="text-2xl font-bold">You&apos;re in: meet your group</h1>
          <p className="mt-2 text-sub text-[14.5px]">
            {others.length} other{others.length === 1 ? "" : "s"} who moved to{" "}
            {profile.area} recently and picked {profile.interest} too. No 1:1
            matching. You&apos;re walking into a small group, together.
          </p>

          <div className="mt-5 space-y-3">
            {others.map((m) => (
              <div
                key={m.profile_id}
                className="flex items-center gap-3 bg-white border-2 border-line rounded-2xl p-3.5"
              >
                <div className="w-11 h-11 rounded-full bg-coral-soft flex items-center justify-center text-lg flex-shrink-0">
                  👋
                </div>
                <div>
                  <div className="font-bold text-[15px]">
                    {m.profiles?.display_name ?? "Newcomer"}
                  </div>
                  <div className="text-[12.5px] text-sub">
                    {ARRIVAL_LABEL[m.profiles?.arrival_status ?? ""] ?? ""}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {myPasscode && (
            <div className="mt-6 bg-background border border-dashed border-coral rounded-2xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-sub">
                Your FirstFriend code
              </div>
              <div className="text-2xl font-extrabold tracking-widest text-coral mt-1">
                {myPasscode}
              </div>
              <p className="mt-2 text-xs text-sub leading-relaxed">
                Everyone in your group has their own code, a low-key way to
                check someone&apos;s meant to be there.
              </p>
            </div>
          )}

          <p className="mt-6 text-xs text-sub text-center">
            Meetup scheduling is next, coming very soon.
          </p>
        </div>
      </div>
    );
  }

  // ── Still waiting to be matched ───────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🌱</div>
        <h1 className="text-2xl font-bold">You&apos;re early</h1>
        <p className="mt-3 text-sub text-[15px] leading-relaxed">
          {othersWaiting > 0
            ? `${othersWaiting} other newcomer${
                othersWaiting === 1 ? " is" : "s are"
              } near ${profile.area} waiting for a FirstFriend group too.`
            : `You're the first person we've seen in ${profile.area} looking for ${profile.interest}.`}{" "}
          We&apos;ll form your group as soon as there are four.
        </p>
        <p className="mt-4 text-xs text-sub">
          No need to keep this open, refresh later to check.
        </p>
      </div>
    </div>
  );
}
