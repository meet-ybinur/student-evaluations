/* Insert authored analysis into analysis_runs for each cycle, so the
   dashboard's analysis panel is populated without the Anthropic API.
   Authored by reading the real seeded aggregates (see analyze-digest.ts).
   Replace later by clicking "Re-run analysis" once ANTHROPIC_API_KEY is set. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { SurveyKey } from "../src/lib/survey-data";

config({ path: ".env.local" });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const MODEL = "manual analysis (demo data — no API key yet)";

type H = { type: "win" | "concern" | "movement" | "gap" | "trend"; title: string; detail: string };
const DATA: Record<SurveyKey, { summary: string; highlights: H[] }> = {
  Y1_end_YL: {
    summary:
      "Year 1 closes the yearlong at **79% favorable** overall, with all five segments clustered tightly between 77% and 81% — a consistent, healthy spread with no weak area. Entrepreneurship (81.4%) leads; relationships with instructors and TAs and students' appetite to keep learning are the strongest notes of the year.\n\nThe clearest soft spot is engagement intensity: the CS and DU \"learning zone\" questions sit at 57% and 60%, the furthest below their targets. Note these are measured differently from the agreement questions (only the *learning* zone counts as favorable, not comfort or panic), so they are not directly comparable to an 80% agreement goal — worth reviewing how that target is set rather than reading it as a shortfall.\n\nResults are even-handed across the cohort: female (80%) and male (78%), Palestinian (80%) and Israeli (78%) responses sit within two points of each other.\n\n_Based on the current demo dataset; targets and prior-year figures are placeholders until the real numbers are imported._",
    highlights: [
      { type: "win", title: "Curiosity is high (94%)", detail: "\"I'm interested in learning more CS\" is the top item at 94.4% and the biggest year-over-year gain (+32pp) — students leave Year 1 wanting more." },
      { type: "win", title: "Instructors and TAs are trusted", detail: "The entrepreneurship team scores 88.5% on \"treat me with respect\" and 86.5% on peer help — the relational core of the program is strong." },
      { type: "gap", title: "CS session engagement below target", detail: "\"Which zone…during CS sessions\" is 22.6pp under target (57.4% in the learning zone). Largely a metric-definition effect, but worth a look at CS session pacing." },
      { type: "gap", title: "Coordinator openness lags", detail: "\"My coordinators make me feel comfortable to share\" sits at 67.3% (-12.7pp) — the one relationship item notably behind the others." },
      { type: "movement", title: "Entrepreneurship skills up sharply", detail: "Self-rated entrepreneurship skill (+20.4pp) and team respect (+19.5pp) are among the largest gains vs last year." },
      { type: "trend", title: "Balanced across nationality and gender", detail: "Favorability differs by ≤2pp between female/male and Palestinian/Israeli students — consistent with MEET's 50/50 design." },
    ],
  },
  Y1_summer: {
    summary:
      "The Year 1 Summer intensive lands at **81% favorable** overall — the strongest of the five cycles alongside Y3. Regional Dialogue (84.1%) is the highest segment; Deeper Understanding (76.4%) is the lowest but still solid.\n\nLeadership and empathy outcomes stand out: students' sense that MEET increased their ability to empathize and to inspire others both score ~90%. The recurring weak spots are again the session \"zone\" questions and the 1–5 identity-sharing rating (63–70%), the items furthest below target — measured on different scales than the agreement questions.\n\nThe cohort is balanced (female 81% / male 80%, Palestinian 80% / Israeli 81%).\n\n_Based on the current demo dataset; targets and prior-year figures are placeholders until the real numbers are imported._",
    highlights: [
      { type: "win", title: "Coordinators rate highest (94%)", detail: "\"My coordinators make me feel comfortable to share\" tops the summer at 94.2% — a strong start to the relationship that the yearlong should protect." },
      { type: "win", title: "Empathy and influence land early", detail: "Empathy (90.4%) and inspiring/empowering others (90.4%) — core leadership aims — are already high at the end of the first summer." },
      { type: "gap", title: "CS-session engagement weakest", detail: "CS \"zone\" is 63% (-17pp vs target) and the largest year-over-year drop (-22pp). Consistent with the yearlong; a candidate for session-design review." },
      { type: "gap", title: "Sharing identity feels harder", detail: "\"Rate your experience sharing your identities\" averages 68.5% (-11.5pp) — expected this early in a binational cohort, worth tracking into the yearlong." },
      { type: "movement", title: "Big lift in entrepreneurship relationships", detail: "Entrepreneurship team respect is the top mover (+28.9pp), with empathy (+23.4pp) and inspiration (+21.4pp) close behind." },
      { type: "trend", title: "Even across gender and nationality", detail: "Group differences stay within 1pp — no demographic is having a markedly different first summer." },
    ],
  },
  Y2_end_YL: {
    summary:
      "Year 2's yearlong finishes at **79% favorable**. Startups & Status Quo (81.4%) and Regional Dialogue (81%) lead — fitting for the year that centers social-impact work — while Entrepreneurship (74.3%) is the softest segment and worth attention.\n\nThe strongest signals are about working across difference: belief in diverse groups (94%) and trust within the group (90%) are the top items. Deeper Understanding session engagement (62.9% learning zone) and comfort sharing in DU are the main gaps, alongside a dip in the sense of contributing one's strength to teamwork.\n\nResults are balanced (Palestinian 81% / Israeli 78%, female 79% / male 80%).\n\n_Based on the current demo dataset; targets and prior-year figures are placeholders until the real numbers are imported._",
    highlights: [
      { type: "win", title: "Belief in diversity at 94%", detail: "\"Working in diverse groups is beneficial\" tops the cycle (94.1%) and is the largest year-over-year gain (+28pp) — the dialogue work is landing." },
      { type: "win", title: "High trust within hubs", detail: "\"I have trust in the students in my group\" (89.7%) and feeling one is doing social impact (87.1%) show the Year-2 model working." },
      { type: "concern", title: "Entrepreneurship the softest segment", detail: "At 74.3%, Entrepreneurship trails the others; \"gain practical experience in entrepreneurship\" (74.3%, -5.7pp) is the item to probe." },
      { type: "gap", title: "DU session engagement low", detail: "DU \"zone\" is 62.9% (-17.1pp), the widest gap — the same engagement-intensity pattern seen across cycles." },
      { type: "movement", title: "Contributing-to-teamwork slipped", detail: "\"I helped my team bring their strength\" fell -13.4pp year-over-year and sits at 70.6% — watch whether team roles are balanced." },
      { type: "trend", title: "Equitable across the cohort", detail: "Favorability is within ~3pp across gender and nationality — no group is being left behind." },
    ],
  },
  Y2_summer: {
    summary:
      "The Year 2 Summer sits at **79% favorable**. Startups & Status Quo (82.6%) and Regional Dialogue (81.5%) lead; Deeper Understanding (75.5%) is lowest. Hands-on entrepreneurship and CS project work are the high points.\n\nThis cycle has the widest engagement gaps of the five: the entrepreneurship and DU \"zone\" questions fall to 54–67% and account for the largest below-target items (DU zone -25.8pp). Because the zone metric counts only the learning zone as favorable, part of this is definitional — but the entrepreneurship-zone drop (-31.8pp year-over-year) is large enough to flag for the program team.\n\nThe cohort is balanced (female 80% / male 78%, Palestinian 78% / Israeli 79%).\n\n_Based on the current demo dataset; targets and prior-year figures are placeholders until the real numbers are imported._",
    highlights: [
      { type: "win", title: "Practical entrepreneurship lands (92%)", detail: "\"MEET helped me gain practical experience in entrepreneurship\" tops the cycle at 91.7% — the applied focus is resonating." },
      { type: "win", title: "Pride in CS project work", detail: "CS team approachability (89.6%) and pride in personal CS work (89.6%) show strong ownership of the technical project." },
      { type: "concern", title: "Entrepreneurship-session engagement dropped", detail: "The entrepreneurship \"zone\" fell to 54.2% and -31.8pp year-over-year — the single largest movement anywhere. Worth a direct look at those sessions." },
      { type: "gap", title: "DU engagement furthest below target", detail: "DU \"zone\" is -25.8pp vs target; the DU segment (75.5%) is the lowest this cycle." },
      { type: "movement", title: "CS-team rapport up strongly", detail: "\"CS team are easy to talk to\" rose +29.6pp, and understanding of inequalities +23.4pp — meaningful gains to celebrate." },
      { type: "trend", title: "No demographic divide", detail: "Gender and nationality favorability sit within ~2pp of each other." },
    ],
  },
  Y3_summer: {
    summary:
      "The capstone Year 3 Summer is the strongest, most even cycle at **81% favorable**, with every segment between 78% and 83% and the *smallest* set of below-target items (12). Regional Dialogue (82.5%) leads — appropriate for graduates heading into the alumni network.\n\nThe standout results are the ones MEET most wants from a graduating cohort: understanding inequalities in society (92%) and being able to understand the perspective of people from the other nationality (92%), the latter up +21pp year-over-year. Remaining gaps are modest — interest in further entrepreneurship and a sense that hub-mates learned from one's own reality.\n\nThe cohort is balanced (Palestinian 81% / Israeli 80%, female 81% / male 80%).\n\n_Based on the current demo dataset; targets and prior-year figures are placeholders until the real numbers are imported._",
    highlights: [
      { type: "win", title: "Perspective-taking at 92%", detail: "\"I can now understand the perspective of people from the other nationality\" reaches 92% (+21pp year-over-year) — arguably MEET's core graduating outcome." },
      { type: "win", title: "Sees inequality clearly (92%)", detail: "\"MEET impacted my understanding of inequalities in my society\" is the top item — graduates leave with a sharpened social lens." },
      { type: "win", title: "Tightest, highest spread of any cycle", detail: "All segments 78–83% with only 12 items below target — the most consistent results across the program." },
      { type: "movement", title: "Dialogue and impact rose", detail: "Readiness for dialogue/conflict resolution (+20.8pp) and feeling one is doing social impact (+20.7pp) are the largest gains." },
      { type: "gap", title: "Entrepreneurship interest the soft note", detail: "\"I'm interested in learning Entrepreneurship\" (69.2%) is the lowest item — expected by Year 3 as students specialize, but worth noting." },
      { type: "trend", title: "Balanced to the end", detail: "Gender and nationality favorability stay within ~1pp — the graduating cohort's experience is shared evenly." },
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
