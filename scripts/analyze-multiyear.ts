/* Multi-year trajectory digest: for each cycle, build the 2024 -> 2025 ->
   2026(current) series per question and surface steepest multi-year moves,
   monotonic trends, and reversals. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { buildDashboard } from "../src/lib/aggregate";
import type { SurveyKey } from "../src/lib/survey-data";

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
  return buildDashboard({ questions, answers, sessions: sessions ?? [], surveyKey, targets: targets ?? [], history: history ?? [] });
}

async function main() {
  const { data: cycles } = await db.from("cycles").select("id, survey_key, label").order("survey_key");
  for (const c of cycles ?? []) {
    const d = await fetchCycle(c.id, c.survey_key as SurveyKey);
    const rows = d.comparisons
      .filter((x) => x.current.favorablePct != null && x.history.length >= 2)
      .map((x) => {
        const y24 = x.history.find((h) => h.year === 2024)?.value ?? null;
        const y25 = x.history.find((h) => h.year === 2025)?.value ?? null;
        const cur = x.current.favorablePct!;
        const span = y24 != null ? Math.round((cur - y24) * 10) / 10 : null;
        const mono =
          y24 != null && y25 != null
            ? y24 < y25 && y25 < cur
              ? "up"
              : y24 > y25 && y25 > cur
              ? "down"
              : null
            : null;
        const reversal =
          y24 != null && y25 != null
            ? y25 > y24 && cur < y25 - 3
              ? "peaked-then-fell"
              : y25 < y24 && cur > y25 + 3
              ? "dipped-then-recovered"
              : null
            : null;
        return { t: x.text, y24, y25, cur, span, mono, reversal };
      });
    console.log(`\n===== ${c.label} =====`);
    const bySpan = [...rows].sort((a, b) => (b.span ?? 0) - (a.span ?? 0));
    console.log("3-yr RISERS:", bySpan.slice(0, 3).map((r) => `${r.y24}->${r.y25}->${r.cur} (+${r.span}) ${r.t.slice(0, 38)}`).join(" | "));
    console.log("3-yr DECLINERS:", bySpan.slice(-3).map((r) => `${r.y24}->${r.y25}->${r.cur} (${r.span}) ${r.t.slice(0, 38)}`).join(" | "));
    console.log("MONOTONIC up:", rows.filter((r) => r.mono === "up").length, "| down:", rows.filter((r) => r.mono === "down").length);
    console.log("  steady-up ex:", rows.filter((r) => r.mono === "up").slice(0, 2).map((r) => `${r.y24}->${r.y25}->${r.cur} ${r.t.slice(0, 34)}`).join(" | "));
    console.log("  steady-down ex:", rows.filter((r) => r.mono === "down").slice(0, 2).map((r) => `${r.y24}->${r.y25}->${r.cur} ${r.t.slice(0, 34)}`).join(" | "));
    console.log("REVERSALS peaked-then-fell:", rows.filter((r) => r.reversal === "peaked-then-fell").slice(0, 2).map((r) => `${r.y24}->${r.y25}->${r.cur} ${r.t.slice(0, 34)}`).join(" | "));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
