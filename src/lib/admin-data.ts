import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { isAllowedAdmin } from "./admin-allowlist";
import { buildDashboard, type DashboardData, type DemographicKey, type QuestionMeta } from "./aggregate";
import { SURVEY_BY_KEY, type SurveyKey } from "./survey-data";

export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAllowedAdmin(user.email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }
  return user;
}

export interface CycleRow {
  id: string;
  survey_key: SurveyKey;
  year: number;
  label: string;
  status: string;
  responses: number;
  tokensTotal: number;
  tokensUsed: number;
}

export async function listCycles(): Promise<CycleRow[]> {
  const db = createAdminClient();
  const { data: cycles } = await db.from("cycles").select("*").order("year", { ascending: false }).order("survey_key");
  if (!cycles) return [];
  const rows: CycleRow[] = [];
  for (const c of cycles) {
    const [{ count: responses }, { count: tokensTotal }, { count: tokensUsed }] = await Promise.all([
      db.from("response_sessions").select("id", { count: "exact", head: true }).eq("cycle_id", c.id),
      db.from("access_tokens").select("id", { count: "exact", head: true }).eq("cycle_id", c.id),
      db.from("access_tokens").select("id", { count: "exact", head: true }).eq("cycle_id", c.id).eq("used", true),
    ]);
    rows.push({
      id: c.id,
      survey_key: c.survey_key,
      year: c.year,
      label: c.label,
      status: c.status,
      responses: responses ?? 0,
      tokensTotal: tokensTotal ?? 0,
      tokensUsed: tokensUsed ?? 0,
    });
  }
  return rows;
}

export async function getCycle(cycleId: string) {
  const db = createAdminClient();
  const { data } = await db.from("cycles").select("*").eq("id", cycleId).single();
  return data;
}

export async function getDashboardData(cycleId: string, demo: DemographicKey = "all"): Promise<{
  cycle: { id: string; survey_key: SurveyKey; year: number; label: string; status: string; title: string };
  data: DashboardData;
} | null> {
  const db = createAdminClient();
  const { data: cycle } = await db.from("cycles").select("*").eq("id", cycleId).single();
  if (!cycle) return null;
  const surveyKey = cycle.survey_key as SurveyKey;

  const { data: sq } = await db
    .from("survey_questions")
    .select("position, questions(id, segment, display_text, response_type, baseline)")
    .eq("survey_key", surveyKey)
    .order("position");
  const questions = (sq ?? [])
    .map((r) => (Array.isArray(r.questions) ? r.questions[0] : r.questions))
    .filter(Boolean) as unknown as QuestionMeta[];

  const { data: sessions } = await db.from("response_sessions").select("id, gender, nationality").eq("cycle_id", cycleId);
  const sessionIds = (sessions ?? []).map((s) => s.id);

  let answers: { session_id: string; question_id: number; value_num: number | null; value_text: string | null; value_choice: string | null }[] = [];
  if (sessionIds.length) {
    // fetch in chunks to stay under row limits
    const chunkSize = 50;
    for (let i = 0; i < sessionIds.length; i += chunkSize) {
      const chunk = sessionIds.slice(i, i + chunkSize);
      const { data: aa } = await db
        .from("answers")
        .select("session_id, question_id, value_num, value_text, value_choice")
        .in("session_id", chunk);
      if (aa) answers = answers.concat(aa);
    }
  }

  const { data: targets } = await db.from("targets").select("question_id, survey_key, target_value");
  const { data: history } = await db.from("historical_results").select("survey_key, year, question_id, value, n").eq("survey_key", surveyKey);

  const data = buildDashboard({
    questions,
    answers,
    sessions: sessions ?? [],
    surveyKey,
    targets: targets ?? [],
    history: history ?? [],
    demo,
  });

  return {
    cycle: {
      id: cycle.id,
      survey_key: surveyKey,
      year: cycle.year,
      label: cycle.label,
      status: cycle.status,
      title: SURVEY_BY_KEY[surveyKey]?.title ?? cycle.label,
    },
    data,
  };
}
