import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/admin-allowlist";

export const dynamic = "force-dynamic";

/** Google OAuth redirect target. Exchanges the code for a session, then
    enforces the admin allowlist before letting the user into /admin. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=missing_code", url.origin));
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=exchange_failed", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedAdmin(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
