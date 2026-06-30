/* Insert authored analysis into analysis_runs for each cycle, so the
   dashboard's analysis panel is populated without the Anthropic API.
   Authored by reading the real seeded aggregates, including the multi-year
   trajectory 2024 -> 2025 -> 2026 (see analyze-digest.ts / analyze-multiyear.ts).
   Replace later by clicking "Re-run analysis" once ANTHROPIC_API_KEY is set. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { SurveyKey } from "../src/lib/survey-data";

config({ path: ".env.local" });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const MODEL = "manual analysis (demo data — no API key yet)";
const CAVEAT =
  "\n\n_Based on the current demo dataset. Targets and the 2024/2025 figures are placeholders, so the multi-year trends below are illustrative until the real history is imported._";

type H = { type: "win" | "concern" | "movement" | "gap" | "trend"; title: string; detail: string };
const DATA: Record<SurveyKey, { summary: string; highlights: H[] }> = {
  Y1_end_YL: {
    summary:
      "Year 1 closes the yearlong at **79% favorable** overall, with all five segments clustered tightly between 77% and 81% — a consistent spread with no weak area. Entrepreneurship (81.4%) leads; instructor/TA relationships and students' appetite to keep learning are the strongest notes.\n\n**Across the past three surveys**, the direction is encouraging: 10 items are on a sustained multi-year rise versus only 4 in decline. The clearest climb is interest in CS (64% → 62% → 94%) and pride in personal work (61% → 69% → 83%). The clearest multi-year slide is CS-session engagement (86% → 61% → 57% in the learning zone) — a two-year drift, not a one-off.\n\nResults are even-handed across the cohort: female (80%) and male (78%), Palestinian (80%) and Israeli (78%) sit within two points of each other." + CAVEAT,
    highlights: [
      { type: "trend", title: "CS engagement sliding for 2 years", detail: "The CS \"learning zone\" has fallen 86% → 61% → 57% across the three surveys — the most sustained multi-year decline this cycle. Worth treating as a trend, not noise." },
      { type: "trend", title: "Curiosity climbing multi-year", detail: "\"Interested in learning more CS\" rose 64% → 62% → 94% and \"proud of my personal work\" 61% → 69% → 83% — steady multi-year gains." },
      { type: "win", title: "Instructors and TAs are trusted", detail: "The entrepreneurship team scores 88.5% on \"treat me with respect\" and 86.5% on peer help — the relational core is strong." },
      { type: "gap", title: "Coordinator openness lags", detail: "\"My coordinators make me feel comfortable to share\" sits at 67.3% (-12.7pp vs target) — the one relationship item notably behind." },
      { type: "movement", title: "Entrepreneurship skills up this year", detail: "Self-rated entrepreneurship skill (+20.4pp) and team respect (+19.5pp) are among the largest single-year gains." },
      { type: "trend", title: "Balanced across nationality and gender", detail: "Favorability differs by ≤2pp between female/male and Palestinian/Israeli — consistent with MEET's 50/50 design, and stable across years." },
    ],
  },
  Y1_summer: {
    summary:
      "The Year 1 Summer intensive lands at **81% favorable** overall — the strongest cycle alongside Y3. Regional Dialogue (84.1%) is the highest segment; Deeper Understanding (76.4%) the lowest but still solid.\n\n**Over the past three surveys**, 13 items trend up against just 3 down. Empathy (62% → 67% → 90%) and coordinator openness (70% → 74% → 94%) show the strongest multi-year climbs. Two engagement/relationship items are drifting down across years — \"group members make me feel comfortable\" (88% → 73% → 72%) and the DU session zone (80% → 77% → 67%) — both worth watching into the yearlong.\n\nThe cohort is balanced (female 81% / male 80%, Palestinian 80% / Israeli 81%)." + CAVEAT,
    highlights: [
      { type: "trend", title: "Empathy on a steady multi-year rise", detail: "\"MEET increased my ability to empathize\" climbed 62% → 67% → 90% over three summers — a sustained gain in a core leadership outcome." },
      { type: "trend", title: "Group comfort slipping across years", detail: "\"My group members make me feel comfortable to share\" has eased 88% → 73% → 72% — a two-year softening worth a closer look at group facilitation." },
      { type: "win", title: "Coordinators rate highest (94%)", detail: "\"My coordinators make me feel comfortable to share\" tops the summer at 94.2%, and has risen each year (70 → 74 → 94)." },
      { type: "gap", title: "Sharing identity feels harder", detail: "\"Rate your experience sharing your identities\" averages 68.5% (-11.5pp) and is down multi-year (78 → 76 → 69) — expected early, but trending the wrong way." },
      { type: "gap", title: "CS-session engagement weakest", detail: "CS \"zone\" is 63% (-17pp vs target) and the largest single-year drop (-22pp)." },
      { type: "trend", title: "Even across gender and nationality", detail: "Group differences stay within ~1pp and have held steady year to year." },
    ],
  },
  Y2_end_YL: {
    summary:
      "Year 2's yearlong finishes at **79% favorable**. Startups & Status Quo (81.4%) and Regional Dialogue (81%) lead — fitting for the social-impact year — while Entrepreneurship (74.3%) is the softest segment.\n\n**The multi-year picture is more mixed than Year 1**: 6 items rising, 5 falling. The standout climbs are awareness of one's own status quo (61% → 72% → 87%) and trust within the group (67% → 76% → 90%). But \"I increased my knowledge about my peers' realities/narratives\" has slipped two years running (88% → 81% → 75%), and DU session engagement continues its cross-cohort decline (78% → 79% → 63%).\n\nResults are balanced (Palestinian 81% / Israeli 78%, female 79% / male 80%)." + CAVEAT,
    highlights: [
      { type: "trend", title: "Knowledge of peers' narratives declining", detail: "\"I increased my knowledge about my peers' realities and narratives\" has fallen 88% → 81% → 75% across three surveys — a sustained slide in a central DU outcome." },
      { type: "trend", title: "Status-quo awareness climbing", detail: "\"This process is helping me gain awareness of SQs in my community\" rose 61% → 72% → 87% — the strongest multi-year gain, validating the Year-2 model." },
      { type: "win", title: "High trust within hubs", detail: "\"I have trust in the students in my group\" reaches 89.7% and has risen each year (67 → 76 → 90)." },
      { type: "concern", title: "Entrepreneurship the softest segment", detail: "At 74.3%, Entrepreneurship trails; \"gain practical experience in entrepreneurship\" peaked then fell (61% → 87% → 74%) — a reversal to watch." },
      { type: "gap", title: "DU session engagement low", detail: "DU \"zone\" is 62.9% (-17.1pp), the widest gap, and down multi-year (78 → 79 → 63)." },
      { type: "trend", title: "Equitable across the cohort", detail: "Favorability is within ~3pp across gender and nationality, stable year to year." },
    ],
  },
  Y2_summer: {
    summary:
      "The Year 2 Summer sits at **79% favorable**. Startups & Status Quo (82.6%) and Regional Dialogue (81.5%) lead; Deeper Understanding (75.5%) is lowest. Hands-on entrepreneurship and CS project work are the high points.\n\n**Multi-year, the wins are real and the warnings are specific**: 14 items up vs 6 down. Practical entrepreneurship (65% → 90% → 92%) and pride in CS work (63% → 68% → 90%) are sustained climbs. The sharpest concern is a genuine reversal — feeling \"more equipped to engage in dialogue and conflict resolution\" has dropped two years straight (90% → 75% → 71%), and the entrepreneurship session zone swung 75% → 86% → 54%. These are the items to interrogate first.\n\nThe cohort is balanced (female 80% / male 78%, Palestinian 78% / Israeli 79%)." + CAVEAT,
    highlights: [
      { type: "trend", title: "Dialogue-readiness declining 2 years", detail: "\"I feel more equipped to engage in dialogue and conflict resolution\" has fallen 90% → 75% → 71% — a sustained multi-year slide in a flagship outcome. Highest-priority item to examine." },
      { type: "trend", title: "Practical entrepreneurship strong and rising", detail: "\"Gain practical experience in entrepreneurship\" climbed 65% → 90% → 92% — the applied focus is compounding year over year." },
      { type: "concern", title: "Entrepreneurship-session engagement collapsed", detail: "The entrepreneurship \"zone\" swung 75% → 86% → 54% (-31.8pp this year) — the single largest movement anywhere; look directly at those sessions." },
      { type: "win", title: "Pride in CS project work", detail: "CS-team approachability rose 29.6pp this year and \"proud of my personal CS work\" climbed 63 → 68 → 90 multi-year." },
      { type: "gap", title: "DU engagement furthest below target", detail: "DU \"zone\" is -25.8pp vs target; the DU segment (75.5%) is the lowest this cycle." },
      { type: "trend", title: "No demographic divide", detail: "Gender and nationality favorability sit within ~2pp and have held across years." },
    ],
  },
  Y3_summer: {
    summary:
      "The capstone Year 3 Summer is the strongest, most even cycle at **81% favorable**, every segment 78–83% with the *smallest* set of below-target items (12). Regional Dialogue (82.5%) leads.\n\n**The multi-year story is the headline here: 17 items rising and not a single sustained decline.** The defining outcomes for a graduating cohort are climbing steadily — understanding the other nationality's perspective (60% → 71% → 92%), trust across the group (60% → 68% → 88%), and understanding inequalities in society (75% → 83% → 92%). The only soft notes are a couple of single-year reversals (e.g., interest in more CS dipped this year after rising), not multi-year problems.\n\nThe cohort is balanced (Palestinian 81% / Israeli 80%, female 81% / male 80%)." + CAVEAT,
    highlights: [
      { type: "trend", title: "Perspective-taking climbing to 92%", detail: "\"I can understand the perspective of people from the other nationality\" rose 60% → 71% → 92% — the steepest sustained multi-year gain, and arguably MEET's core graduating outcome." },
      { type: "trend", title: "Every trend points up", detail: "17 items are on a sustained multi-year rise and none on a sustained decline — the healthiest trajectory of any cycle. Understanding inequalities climbed 75% → 83% → 92%." },
      { type: "win", title: "Tightest, highest spread of any cycle", detail: "All segments 78–83% with only 12 items below target — the most consistent results across the program." },
      { type: "movement", title: "Dialogue and impact rose this year", detail: "Readiness for dialogue/conflict resolution (+20.8pp) and feeling one is doing social impact (+20.7pp) are the largest single-year gains." },
      { type: "gap", title: "Entrepreneurship interest the soft note", detail: "\"I'm interested in learning Entrepreneurship\" (69.2%) is the lowest item — expected by Year 3 as students specialize." },
      { type: "trend", title: "Balanced to the end", detail: "Gender and nationality favorability stay within ~1pp — the graduating cohort's experience is shared evenly, and steady across years." },
    ],
  },
};

async function main() {
  const { data: cycles } = await db.from("cycles").select("id, survey_key, label");
  for (const c of cycles ?? []) {
    const entry = DATA[c.survey_key as SurveyKey];
    if (!entry) continue;
    await db.from("analysis_runs").delete().eq("cycle_id", c.id);
    const { error } = await db.from("analysis_runs").insert({
      cycle_id: c.id,
      model: MODEL,
      summary: entry.summary,
      highlights: entry.highlights,
    });
    if (error) throw error;
    console.log(`✓ analysis inserted: ${c.label} (${entry.highlights.length} highlights)`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
