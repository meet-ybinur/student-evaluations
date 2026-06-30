import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requireAdmin();
  const cycleId = new URL(req.url).searchParams.get("cycleId");
  if (!cycleId) return NextResponse.json({ error: "missing cycleId" }, { status: 400 });

  const db = createAdminClient();
  const { data: cycle } = await db.from("cycles").select("label").eq("id", cycleId).single();
  const { data: tokens } = await db
    .from("access_tokens")
    .select("token, used, used_at")
    .eq("cycle_id", cycleId)
    .order("created_at");

  const origin = new URL(req.url).origin;
  const header = "code,link,used,used_at\n";
  const body = (tokens ?? [])
    .map((t) => `${t.token},${origin}/s/${t.token},${t.used ? "yes" : "no"},${t.used_at ?? ""}`)
    .join("\n");

  const filename = `meet-codes-${(cycle?.label ?? "cycle").replace(/\s+/g, "-")}.csv`;
  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
