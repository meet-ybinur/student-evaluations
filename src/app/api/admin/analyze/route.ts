import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-data";
import { getDashboardData } from "@/lib/admin-data";
import { analyzeDashboard, ANALYSIS_MODEL } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  await requireAdmin();
  let cycleId: string | undefined;
  try {
    ({ cycleId } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!cycleId) return NextResponse.json({ error: "missing cycleId" }, { status: 400 });

  const dash = await getDashboardData(cycleId, "all");
  if (!dash) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (dash.data.totalResponses === 0)
    return NextResponse.json({ error: "no_responses" }, { status: 400 });

  try {
    const result = await analyzeDashboard(dash.cycle.title + " " + dash.cycle.year, dash.data);
    const db = createAdminClient();
    await db.from("analysis_runs").insert({
      cycle_id: cycleId,
      model: ANALYSIS_MODEL,
      summary: result.summary,
      highlights: result.highlights,
    });
    return NextResponse.json({ ...result, model: ANALYSIS_MODEL, generatedAt: new Date().toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "analysis_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await requireAdmin();
  const cycleId = new URL(req.url).searchParams.get("cycleId");
  if (!cycleId) return NextResponse.json({ error: "missing cycleId" }, { status: 400 });
  const db = createAdminClient();
  const { data } = await db
    .from("analysis_runs")
    .select("summary, highlights, model, created_at")
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json(data ?? null);
}
