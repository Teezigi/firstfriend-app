import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const path = searchParams.get("path") === "soon" ? "soon" : "here";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // New or returning user. Either way, onboarding checks whether
      // a profile already exists and skips ahead if so.
      return NextResponse.redirect(`${origin}/onboarding?path=${path}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
