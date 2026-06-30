/* Seed the MEET evaluations database.
 *
 *   npm run seed            # questions + survey membership (idempotent)
 *   npm run seed -- --demo  # also create demo cycles, targets, prior-year
 *                           # results and synthetic responses for the dashboard
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import {
  SURVEYS,
  getQuestionBank,
  questionsForSurvey,
  isFavorable,
  type SurveyKey,
} from "../src/lib/survey-data";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const DEMO = process.argv.includes("--demo");
const THIS_YEAR = 2026;

// Deterministic PRNG so re-seeding demo data is stable.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function seedQuestions() {
  const bank = getQuestionBank();
  const rows = bank.map((q) => ({
    id: q.id,
    segment: q.segment,
    text: q.text,
    display_text: q.displayText,
    baseline: q.baseline,
    tag: q.tag,
    response_type: q.responseType,
  }));
  const { error } = await db.from("questions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`✓ questions: ${rows.length}`);

  // membership
  const sqRows: { survey_key: string; question_id: number; position: number }[] = [];
  for (const s of SURVEYS) {
    const qs = questionsForSurvey(s.key);
    qs.forEach((q, i) => sqRows.push({ survey_key: s.key, question_id: q.id, position: i }));
  }
  const { error: e2 } = await db.from("survey_questions").upsert(sqRows, { onConflict: "survey_key,question_id" });
  if (e2) throw e2;
  console.log(`✓ survey_questions: ${sqRows.length}`);
}

async function seedTargets() {
  // Placeholder targets: 80% favorable for every question (editable in admin /
  // overwritten by the real data file). Baseline questions get a softer 70%.
  const bank = getQuestionBank().filter((q) => q.responseType !== "open_text");
  const rows = bank.map((q) => ({
    question_id: q.id,
    survey_key: null as string | null,
    metric: "favorable_pct",
    target_value: q.baseline ? 70 : 80,
  }));
  const { error } = await db.from("targets").upsert(rows, { onConflict: "question_id,survey_key,metric" });
  if (error) throw error;
  console.log(`✓ targets (placeholder): ${rows.length}`);
}

async function seedHistorical() {
  const rand = mulberry32(42);
  const rows: Record<string, unknown>[] = [];
  for (const s of SURVEYS) {
    const qs = questionsForSurvey(s.key).filter((q) => q.responseType !== "open_text");
    for (const year of [THIS_YEAR - 2, THIS_YEAR - 1]) {
      for (const q of qs) {
        const base = 60 + rand() * 30; // 60-90% favorable
        rows.push({
          survey_key: s.key,
          year,
          question_id: q.id,
          metric: "favorable_pct",
          value: Math.round(base),
          n: 90 + Math.floor(rand() * 30),
        });
      }
    }
  }
  const { error } = await db
    .from("historical_results")
    .upsert(rows, { onConflict: "survey_key,year,question_id,metric" });
  if (error) throw error;
  console.log(`✓ historical_results: ${rows.length}`);
}

async function seedDemoCycle(surveyKey: SurveyKey) {
  const survey = SURVEYS.find((s) => s.key === surveyKey)!;
  // Open cycle for this year.
  const { data: cyc, error } = await db
    .from("cycles")
    .upsert(
      { survey_key: surveyKey, year: THIS_YEAR, label: `${survey.short} ${THIS_YEAR}`, status: "open" },
      { onConflict: "survey_key,year" },
    )
    .select()
    .single();
  if (error) throw error;
  const cycleId = cyc.id as string;

  // Wipe any prior demo responses for a clean re-seed.
  await db.from("response_sessions").delete().eq("cycle_id", cycleId);

  const qs = questionsForSurvey(surveyKey);
  const rand = mulberry32(surveyKey.length * 7 + 13);
  const N = 110;
  for (let i = 0; i < N; i++) {
    const gender = rand() < 0.5 ? "female" : "male";
    const nationality = rand() < 0.5 ? "palestinian" : "israeli";
    const { data: sess, error: se } = await db
      .from("response_sessions")
      .insert({ cycle_id: cycleId, gender, nationality })
      .select()
      .single();
    if (se) throw se;
    const answers = qs.map((q) => {
      if (q.responseType === "open_text") {
        return { session_id: sess.id, question_id: q.id, value_text: rand() < 0.4 ? "Reflection sample." : null };
      }
      if (q.responseType === "zone") {
        const r = rand();
        const choice = r < 0.2 ? "comfort" : r < 0.85 ? "learning" : "panic";
        return { session_id: sess.id, question_id: q.id, value_choice: choice };
      }
      // likert/rating skewed positive
      const r = rand();
      const v = r < 0.05 ? 2 : r < 0.2 ? 3 : r < 0.6 ? 4 : 5;
      return { session_id: sess.id, question_id: q.id, value_num: v };
    });
    const { error: ae } = await db.from("answers").insert(answers);
    if (ae) throw ae;
  }
  // A few unused tokens to show the admin token tooling.
  const tokens = Array.from({ length: 10 }, () => ({ cycle_id: cycleId, token: randomUUID().slice(0, 8) }));
  await db.from("access_tokens").insert(tokens);

  // sanity: favorable count
  let fav = 0,
    tot = 0;
  for (const q of qs.filter((q) => q.responseType !== "open_text")) {
    tot++;
    if (isFavorable(q.responseType, 4)) fav++;
  }
  console.log(`✓ demo cycle ${survey.short} ${THIS_YEAR}: ${N} responses, ${qs.length} questions`);
}

async function main() {
  await seedQuestions();
  if (DEMO) {
    await seedTargets();
    await seedHistorical();
    for (const s of SURVEYS) await seedDemoCycle(s.key);
    console.log("\nDemo data seeded. Open /admin to explore the dashboard.");
  } else {
    console.log("\nBase seed complete. Run with --demo to add sample cycles + data.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
