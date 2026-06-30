/* Compute the dashboard aggregates for every cycle and print a compact
   digest, so analysis can be authored from the real (seeded) numbers. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { buildDashboard, segmentFavorable, type DemographicKey } from "../src/lib/aggregate";
import { SEGMENT_ORDER, type SurveyKey } from "../src/lib/survey-data";

config({ path: ".env.local" });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function fetchCycle(cycleId: string, surveyKey: SurveyKey) {
  const { data: sq } = await db
    .from("survey_questions")
    .select("position, questions(id, segment, display_text, response_type, baseline)")
    .eq("survey_key", surveyKey)
    .order("position");
  const questions = (sq ?? []).map((r: any) => (Array.isArray(r.questions) ? r.questions[0] : r.questions));
  const { data: sessions } = await db.from("response_sessions").select("id, gender, nationality").eq("cycle_id", cycleId);
  let answers: any[] = [];
  const ids = (sessions ?? []).map((s) => s.id);
  for (let i = 0; i < ids.length; i += 50) {
    const { data } = await db.from("answers").select("session_id, question_id, value_num, value_text, value_choice").in("session_id", ids.slice(i, i + 50));
    if (data) answers = answers.concat(data);
  }
  const { data: targets } = await db.from("targets").select("question_id, survey_key, target_value");
  const { data: history } = await db.from("historical_results").select("survey_key, year, question_id, value, n").eq("survey_key", surveyKey);
  return { questions, sessions: sessions ?? [], answers, targets: targets ?? [], history: history ?? [] };
}

function overall(d: ReturnType<typeof buildDashboard>) {
  const v = d.comparisons.map((c) => c.current.favorablePct).filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

async function main() {
  const { data: cycles } = await db.from("cycles").select("*").order("survey_key");
  for (const c of cycles ?? []) {
    const raw = await fetchCycle(c.id, c.survey_key);
    const base = { questions: raw.questions, answers: raw.answers, sessions: raw.sessions, surveyKey: c.survey_key, targets: raw.targets, history: raw.history };
    const all = buildDashboard({ ...base, demo: "all" });
    console.log(`\n========== ${c.label} (${c.survey_key}) — ${all.totalResponses} responses ==========`);
    console.log("OVERALL favorable:", overall(all) + "%");
    console.log("Demographics:", JSON.stringify(all.demographics));
    const segs = SEGMENT_ORDER.filter((s) => all.bySegment[s]).map((s) => `${s}=${segmentFavorable(all.bySegment[s])}%`);
    console.log("By segment:", segs.join("  "));
    for (const demo of ["female", "male", "palestinian", "israeli"] as DemographicKey[]) {
      console.log(`  ${demo} overall:`, overall(buildDashboard({ ...base, demo })) + "%");
    }
    const scored = all.comparisons.filter((c) => c.current.favorablePct != null);
    const sorted = [...scored].sort((a, b) => (b.current.favorablePct ?? 0) - (a.current.favorablePct ?? 0));
    console.log("TOP 4:", sorted.slice(0, 4).map((c) => `${c.current.favorablePct}% ${c.text.slice(0, 60)}`).join(" | "));
    console.log("BOTTOM 4:", sorted.slice(-4).map((c) => `${c.current.favorablePct}% ${c.text.slice(0, 60)}`).join(" | "));
    const belowT = scored.filter((c) => c.vsTarget != null && c.vsTarget < 0).sort((a, b) => (a.vsTarget ?? 0) - (b.vsTarget ?? 0));
    console.log("WORST vs target:", belowT.slice(0, 4).map((c) => `${c.vsTarget}pp ${c.text.slice(0, 45)}`).join(" | "), `(${belowT.length} below target)`);
    const yoy = scored.filter((c) => c.vsPrevYear != null).sort((a, b) => (b.vsPrevYear ?? 0) - (a.vsPrevYear ?? 0));
    console.log("BEST YoY:", yoy.slice(0, 3).map((c) => `+${c.vsPrevYear}pp ${c.text.slice(0, 45)}`).join(" | "));
    console.log("WORST YoY:", yoy.slice(-3).map((c) => `${c.vsPrevYear}pp ${c.text.slice(0, 45)}`).join(" | "));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
