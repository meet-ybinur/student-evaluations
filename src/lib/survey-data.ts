/* Survey domain model for the MEET student evaluations.
   The canonical question bank lives in /survey-questions.json (parsed from
   the educational team's xlsx). This module defines the 5 surveys, the
   segment order, the response scales, and response-type inference. It is
   used both by the seed script and (for labels/scales) by the app. */

import questionBank from "../../survey-questions.json";

export type SurveyKey = "Y1_summer" | "Y1_end_YL" | "Y2_summer" | "Y2_end_YL" | "Y3_summer";

export type ResponseType = "likert5" | "rating5" | "zone" | "open_text";

export interface SurveyDef {
  key: SurveyKey;
  /** Order in which the surveys run across the program. */
  order: number;
  year: 1 | 2 | 3;
  phase: "summer" | "yearlong";
  title: string;
  short: string;
}

export const SURVEYS: SurveyDef[] = [
  { key: "Y1_summer", order: 1, year: 1, phase: "summer", title: "Year 1 — End of Summer", short: "Y1 Summer" },
  { key: "Y1_end_YL", order: 2, year: 1, phase: "yearlong", title: "Year 1 — End of Yearlong", short: "Y1 Yearlong" },
  { key: "Y2_summer", order: 3, year: 2, phase: "summer", title: "Year 2 — End of Summer", short: "Y2 Summer" },
  { key: "Y2_end_YL", order: 4, year: 2, phase: "yearlong", title: "Year 2 — End of Yearlong", short: "Y2 Yearlong" },
  { key: "Y3_summer", order: 5, year: 3, phase: "summer", title: "Year 3 — End of Summer", short: "Y3 Summer" },
];

export const SURVEY_BY_KEY: Record<SurveyKey, SurveyDef> = Object.fromEntries(
  SURVEYS.map((s) => [s.key, s]),
) as Record<SurveyKey, SurveyDef>;

/** Segment display order + the program icon that represents each. */
export const SEGMENTS: { name: string; icon: string; blurb: string }[] = [
  { name: "Computer Science", icon: "icon-curriculum", blurb: "Technical skills and the CS project." },
  { name: "Entrepreneurship", icon: "icon-leadership", blurb: "Entrepreneurship learning and teamwork." },
  { name: "Startups & Status Quo", icon: "icon-impact", blurb: "Social-impact startups and status-quos." },
  { name: "Deeper Understanding", icon: "icon-dialogue", blurb: "Deeper Understanding™ — dialogue and trust." },
  { name: "Regional Dialogue", icon: "icon-dialogue", blurb: "Leadership, empathy and bi-national connection." },
];

export const SEGMENT_ORDER = SEGMENTS.map((s) => s.name);

/* ---------- Response scales ---------- */
export const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

export const RATING_OPTIONS = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));

/* The "learning zones" model. MEET asks which zone a student feels in during
   sessions. Comfort = too easy/disengaged, Learning = optimal stretch,
   Panic = overwhelmed. Favorable answer is the Learning zone.
   (Admin can revise these labels later if MEET uses different wording.) */
export const ZONE_OPTIONS = [
  { value: "comfort", label: "Comfort zone" },
  { value: "learning", label: "Learning zone" },
  { value: "panic", label: "Panic zone" },
];

/** Top-box definition used for the "favorable %" headline metric. */
export function isFavorable(type: ResponseType, value: number | string | null): boolean {
  if (value == null) return false;
  if (type === "likert5" || type === "rating5") return Number(value) >= 4;
  if (type === "zone") return value === "learning";
  return false; // open_text has no favorable metric
}

/* ---------- Response-type inference from question text ---------- */
export function inferResponseType(text: string): ResponseType {
  const t = text.toLowerCase();
  if (/zone do you mostly feel|which zone/.test(t)) return "zone";
  if (/^\s*from 1-5 rate/.test(t)) return "rating5";
  if (/what was it\?/.test(t)) return "open_text";
  return "likert5";
}

/* ---------- Question bank typing ---------- */
export interface BankQuestion {
  id: number;
  segment: string;
  segment_raw: string;
  text: string;
  baseline: boolean;
  tag: string | null;
  surveys: Record<SurveyKey, boolean>;
}

export interface NormalizedQuestion extends BankQuestion {
  responseType: ResponseType;
  /** clean display text (strips stray "Comment end" markers from the source). */
  displayText: string;
}

function cleanText(text: string): string {
  return text.replace(/\s*Comment end\s*$/i, "").trim();
}

export function getQuestionBank(): NormalizedQuestion[] {
  const qs = (questionBank as { questions: BankQuestion[] }).questions;
  return qs.map((q) => ({
    ...q,
    displayText: cleanText(q.text),
    responseType: inferResponseType(q.text),
  }));
}

/** Questions that appear in a given survey, in segment then bank order. */
export function questionsForSurvey(key: SurveyKey): NormalizedQuestion[] {
  const bank = getQuestionBank().filter((q) => q.surveys[key]);
  return bank.sort((a, b) => {
    const sa = SEGMENT_ORDER.indexOf(a.segment);
    const sb = SEGMENT_ORDER.indexOf(b.segment);
    if (sa !== sb) return sa - sb;
    return a.id - b.id;
  });
}
